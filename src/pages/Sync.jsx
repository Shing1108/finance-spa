import { useState, useEffect, useRef } from "react";
import { auth, provider, firestore } from "../firebase";
import { signInWithPopup, signOut } from "firebase/auth";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { useFinanceStore } from "../store/financeStore";
import { mergeByUpdatedAt } from "../utils/mergeByUpdatedAt";

const ALL_KEYS = [
  "accounts",
  "transactions",
  "budgets",
  "savingsGoals",
  "categories"
];

// 輔助：轉為純物件
function toPlain(arr) {
  return (arr || []).map(x => (x && typeof x.toJSON === "function" ? x.toJSON() : x));
}

export default function SyncPage() {
  const [user, setUser] = useState(auth.currentUser);
  const [syncing, setSyncing] = useState(false);
  const [autoSync, setAutoSync] = useState(localStorage.getItem("autoSync") === "true");
  const [lastSyncTime, setLastSyncTime] = useState(localStorage.getItem("lastSyncTime") || "尚未同步");
  const unsubRef = useRef(null);

  // 監聽 Auth 狀態
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(setUser);
    return unsub;
  }, []);

  // autoSync 狀態保存
  useEffect(() => {
    localStorage.setItem("autoSync", autoSync);
  }, [autoSync]);

  // 自動同步
  useEffect(() => {
    if (!user || !autoSync) {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
      return;
    }
    // 監聽本地資料，自動同步
    const unsub = useFinanceStore.subscribe(
      (state) => ALL_KEYS.map(k => state[k]).concat([state.settings]),
      async () => {
        await smartSync("local");
      },
      { fireImmediately: false }
    );
    unsubRef.current = unsub;
    return unsub;
    // eslint-disable-next-line
  }, [user, autoSync]);

  // 雙向同步（本地push/雲端pull/自動合併）
  async function smartSync(triggerFrom = "manual") {
    if (!user) return;
    setSyncing(true);
    try {
      // 1. 下載雲端
      const docSnap = await getDoc(doc(firestore, "users", user.uid));
      const local = useFinanceStore.getState();
      let cloudData = docSnap.exists() ? docSnap.data() : {};
      // 2. 逐筆增量合併
      const merged = {};
      for (const key of ALL_KEYS) {
        merged[key] = mergeByUpdatedAt(
          toPlain(local[key] || []),
          toPlain(cloudData[key] || [])
        );
      }
      // 3. settings 合併，取 updatedAt 較新的
      let mergedSettings = { ...cloudData.settings, ...local.settings };
      if ((cloudData.settings?.updatedAt || "") > (local.settings?.updatedAt || "")) {
        mergedSettings = { ...local.settings, ...cloudData.settings };
      }
      merged.settings = {
        ...mergedSettings,
        updatedAt: new Date().toISOString()
      };

      // 4. 寫入本地
      useFinanceStore.getState().setAll(merged);

      // 5. 同步上雲（只要本地有變更或雲端有新變更都會推）
      const uploadData = {};
      for (const key of ALL_KEYS) uploadData[key] = toPlain(merged[key] || []);
      uploadData.settings = merged.settings;
      uploadData.updatedAt = new Date().toISOString();

      await setDoc(doc(firestore, "users", user.uid), uploadData);

      const now = new Date().toLocaleString();
      setLastSyncTime(now);
      localStorage.setItem("lastSyncTime", now);

      if (triggerFrom === "manual") alert("已完成雙向同步並合併");
    } catch (e) {
      alert("同步失敗：" + e.message);
    }
    setSyncing(false);
  }

  // 手動上傳本地（全覆蓋雲端）
  async function pushLocalToCloud() {
    if (!user) return;
    setSyncing(true);
    try {
      const state = useFinanceStore.getState();
      const dataToSync = {};
      for (const key of ALL_KEYS) dataToSync[key] = toPlain(state[key] || []);
      dataToSync.settings = { ...(state.settings || {}), updatedAt: new Date().toISOString() };
      dataToSync.updatedAt = new Date().toISOString();
      await setDoc(doc(firestore, "users", user.uid), dataToSync);
      const now = new Date().toLocaleString();
      setLastSyncTime(now);
      localStorage.setItem("lastSyncTime", now);
      alert("已強制上傳本地到雲端（覆蓋）");
    } catch (e) {
      alert("同步失敗：" + e.message);
    }
    setSyncing(false);
  }

  // 手動下載雲端（全覆蓋本地）
  async function pullCloudToLocal() {
    if (!user) return;
    setSyncing(true);
    try {
      const docSnap = await getDoc(doc(firestore, "users", user.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        const merged = {};
        for (const key of ALL_KEYS) merged[key] = toPlain(data[key] || []);
        merged.settings = data.settings || {};
        useFinanceStore.getState().setAll(merged);
        alert("已強制從雲端覆蓋本地");
      } else {
        alert("雲端沒有資料");
      }
    } catch (e) {
      alert("同步失敗：" + e.message);
    }
    setSyncing(false);
  }

  // 登入/登出
  async function handleLogin() {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
    } catch (e) {
      alert("登入失敗：" + e.message);
    }
  }
  async function handleLogout() {
    await signOut(auth);
    setUser(null);
  }

  // 刪除雲端資料
  async function handleDeleteCloudData() {
    const user = auth.currentUser;
    if (!user) {
      alert("請先登入 Google 帳戶");
      return;
    }
    if (!window.confirm("確定要刪除你在雲端（Google帳戶）上的所有存檔？此操作無法復原！")) return;
  
    try {
      await deleteDoc(doc(firestore, "users", user.uid));
      alert("雲端存檔已刪除。");
    } catch (e) {
      alert("刪除失敗：" + e.message);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 480, margin: "0 auto" }}>
      <div className="card-header">
        <h3>全量增量雙向同步</h3>
      </div>
      <div className="card-body">
        <div style={{ marginBottom: 16 }}>
          {user ? (
            <>
              已登入：{user.displayName || user.email}
              <button className="btn btn-secondary" onClick={handleLogout} style={{ marginLeft: 10 }}>
                登出
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={handleLogin}>
              <i className="fab fa-google"></i> 使用Google帳戶登入
            </button>
          )}
        </div>
        <div style={{ marginBottom: 16 }}>
          <input
            type="checkbox"
            id="autoSync"
            checked={autoSync}
            disabled={!user}
            onChange={e => setAutoSync(e.target.checked)}
            style={{ marginRight: 8 }}
          />
          <label htmlFor="autoSync">啟用自動同步 (每次數據變更時)</label>
          <div style={{ marginTop: 8, fontSize: 14 }}>
            上次同步時間: {lastSyncTime}
          </div>
        </div>
        <div>
          <button className="btn btn-primary" onClick={pushLocalToCloud} disabled={!user || syncing} style={{ marginRight: 8 }}>
            本地→雲端（全覆蓋）
          </button>
          <button className="btn btn-secondary" onClick={pullCloudToLocal} disabled={!user || syncing} style={{ marginRight: 8 }}>
            雲端→本地（全覆蓋）
          </button>
          <button className="btn btn-success" onClick={() => smartSync("manual")} disabled={!user || syncing}>
            智能雙向合併同步
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleDeleteCloudData}
          >
            刪除雲端存檔
          </button>
        </div>
        <div style={{ marginTop: 16, color: "#888", fontSize: 13 }}>
          <ul>
            <li>✅ 自動/手動智能合併：每筆資料以 id/updatedAt 增量合併，不會覆蓋最近異動</li>
            <li>✅ 「全覆蓋」功能可強制本地或雲端完全替換</li>
            <li>✅ 適合多端同時編輯，防止資料損失</li>
          </ul>
        </div>
      </div>
    </div>
  );
}