// src/components/SyncProvider.jsx
import { useEffect, useRef } from "react";
import { useFinanceStore } from "../store/financeStore";
import { auth, firestore } from "../firebase";
import { doc, getDoc, setDoc, getDocs, deleteDoc, collection } from "firebase/firestore";
import debounce from "lodash.debounce";

// 自動同步與歷程備份（保留2份）
// 用戶登入時自動拉取雲端，每次本地異動自動推雲端&備份歷程
export default function SyncProvider() {
  const user = auth.currentUser;
  const unsubRef = useRef();

  // 啟動時自動拉取雲端（登入階段）
  useEffect(() => {
    if (!user) return;
    async function pullCloudToLocal() {
      const docSnap = await getDoc(doc(firestore, "users", user.uid));
      if (docSnap.exists()) {
        useFinanceStore.getState().setAll(docSnap.data());
      }
    }
    pullCloudToLocal();
  }, [user]);

  // 本地異動自動推送到雲端並備份歷程
  useEffect(() => {
    if (!user) return;
    const unsub = useFinanceStore.subscribe(
      // 監控所有主要資料
      state => [
        state.accounts, state.transactions, state.categories,
        state.budgets, state.savingsGoals, state.recurringItems, state.settings
      ],
      debounce(async () => {
        // 1. 取得雲端現有存檔，備份到 backup/ 目錄
        const userDoc = doc(firestore, "users", user.uid);
        const docSnap = await getDoc(userDoc);
        if (docSnap.exists()) {
          const now = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
          await setDoc(
            doc(firestore, `users/${user.uid}/backup`, now),
            docSnap.data()
          );
          // 保留最近2份
          const backups = await getDocs(collection(firestore, `users/${user.uid}/backup`));
          const all = backups.docs.map(d => d.id).sort().reverse();
          for (let i = 2; i < all.length; i++) {
            await deleteDoc(doc(firestore, `users/${user.uid}/backup`, all[i]));
          }
        }
        // 2. 推送本地到雲端
        const state = useFinanceStore.getState();
        const toPlain = (arr) => (arr || []).map(x => (x && typeof x.toJSON === "function" ? x.toJSON() : x));
        const uploadData = {
          accounts: toPlain(state.accounts),
          categories: toPlain(state.categories),
          transactions: toPlain(state.transactions),
          budgets: toPlain(state.budgets),
          savingsGoals: toPlain(state.savingsGoals),
          recurringItems: toPlain(state.recurringItems),
          noteSuggestions: state.noteSuggestions,
          settings: { ...state.settings, updatedAt: new Date().toISOString() },
          updatedAt: new Date().toISOString()
        };
        await setDoc(doc(firestore, "users", user.uid), uploadData);
      }, 1000)
    );
    unsubRef.current = unsub;
    return () => unsubRef.current?.();
  }, [user]);

  return null;
}