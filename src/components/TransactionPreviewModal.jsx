import { Modal } from "./Modal";
import { formatCurrency } from "../utils/format";
import { useFinanceStore } from "../store/financeStore";

export default function TransactionPreviewModal({ open, tx, onClose, onEdit }) {
  const { categories, accounts } = useFinanceStore();
  if (!open || !tx) return null;
  const category = categories.find(c => c.id === tx.categoryId);
  const account = accounts.find(a => a.id === tx.accountId);
  return (
    <Modal open={open} onClose={onClose} title="交易詳情">
      <div style={{ fontSize: 16, marginBottom: 8 }}>
        <b>{category?.name || "未分類"}</b>・{formatCurrency(tx.amount, tx.currency)}
      </div>
      <div>日期：{tx.date}</div>
      <div>戶口：{account?.name || tx.accountId}</div>
      <div>備註：{tx.note}</div>
      <div style={{ marginTop: 18 }}>
        <button className="btn btn-primary" onClick={() => onEdit && onEdit(tx)}>編輯</button>
      </div>
    </Modal>
  );
}