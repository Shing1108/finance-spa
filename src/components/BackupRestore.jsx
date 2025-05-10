// src/components/BackupRestore.jsx
import { useEffect, useState } from "react";
import { auth, firestore } from "../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { useFinanceStore } from "../store/financeStore";

export default function BackupRestore() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    async function fetchBackups() {
      if (!user) return;
      setLoading(true);
      const snaps = await getDocs(collection(firestore, `users/${user.uid}/backup`));
      const arr = snaps.docs.map(d => ({
        id: d.id,
        ...d.data()
      })).sort((a, b) => b.id.localeCompare(a.id));
      setBackups(arr);
      setLoading(false);
    }
    fetchBackups();
  }, [user]);

  async function handleRestore(backupId) {
    if (!window.confirm("確定要還原此歷史存檔？目前所有本地資料將被覆蓋！")) return;
    const docSnap = await getDoc(doc(firestore, `users/${user.uid}/backup`, backupId));
    if (docSnap.exists()) {
      useFinanceStore.getState().setAll(docSnap.data());
      alert("已還原該備份（本地資料已被覆蓋）");
    }
  }

  return (
    <div className="card">
      <div className="card-header">備份歷史還原</div>
      <div className="card-body">
        {loading ? "載入中..." : (
          backups.length === 0
            ? <div className="empty-message">暫無備份</div>
            : <ul>
                {backups.map(b => (
                  <li key={b.id} style={{ marginBottom: 8 }}>
                    <span>{b.id.slice(0, 4)}-{b.id.slice(4, 6)}-{b.id.slice(6, 8)} {b.id.slice(8, 10)}:{b.id.slice(10, 12)}:{b.id.slice(12, 14)}</span>
                    <button style={{ marginLeft: 14 }} className="btn btn-sm btn-primary" onClick={() => handleRestore(b.id)}>還原</button>
                  </li>
                ))}
              </ul>
        )}
      </div>
    </div>
  );
}