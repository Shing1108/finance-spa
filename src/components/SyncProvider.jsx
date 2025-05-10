import { useEffect, useRef, useState } from "react";
import { useFinanceStore } from "../store/financeStore";
import { auth, firestore } from "../firebase";
import { doc, getDoc, setDoc, getDocs, deleteDoc, collection } from "firebase/firestore";
import debounce from "lodash.debounce";
import { useToastStore } from "../store/toastStore";

export default function SyncProvider() {
  // 讓 user 為 React state，會自動 re-render！
  const [user, setUser] = useState(auth.currentUser);
  const unsubRef = useRef();
  const addToast = useToastStore.getState().addToast;

  // 監聽 Firebase auth 狀態
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(setUser);
    return unsub;
  }, []);

  // 1. 啟動時自動拉取雲端存檔
  useEffect(() => {
    if (!user) return;
    async function pullCloudToLocal() {
      try {
        const docSnap = await getDoc(doc(firestore, "users", user.uid));
        if (docSnap.exists()) {
          useFinanceStore.getState().setAll(docSnap.data());
          addToast("已自動從雲端同步資料", "success", 1500);
        } else {
          addToast("雲端尚無資料，將保持本地資料", "info", 1300);
        }
      } catch (e) {
        addToast("拉取雲端失敗：" + e.message, "error", 2000);
      }
    }
    pullCloudToLocal();
  }, [user]);

  // 2. 任何本地資料異動都自動推送到雲端
  useEffect(() => {
    if (!user) return;
    const unsub = useFinanceStore.subscribe(
      state => JSON.stringify([
        state.accounts, state.transactions, state.categories,
        state.budgets, state.savingsGoals, state.recurringItems,
        state.settings, state.noteSuggestions
      ]),
      debounce(async () => {
        console.log("[SyncProvider] Detected data change, will sync...");
        addToast("正在同步至雲端...", "info", 1600);
        try {
          // ...備份與 setDoc
          const userDoc = doc(firestore, "users", user.uid);
          const docSnap = await getDoc(userDoc);
          if (docSnap.exists()) {
            const now = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
            await setDoc(
              doc(firestore, `users/${user.uid}/backup`, now),
              docSnap.data()
            );
            // 只保留最近2份備份
            const backups = await getDocs(collection(firestore, `users/${user.uid}/backup`));
            const all = backups.docs.map(d => d.id).sort().reverse();
            for (let i = 2; i < all.length; i++) {
              await deleteDoc(doc(firestore, `users/${user.uid}/backup`, all[i]));
            }
          }
          // 2. 推送本地資料到雲端
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
          addToast("已自動同步至雲端", "success", 1600);
        } catch (e) {
          addToast("同步失敗：" + e.message, "error", 2500);
          console.error("[SyncProvider] 同步失敗：", e);
        }
      }, 900)
    );
    unsubRef.current = unsub;
    return () => unsubRef.current?.();
  }, [user]);

  return null;
}