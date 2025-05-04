import { useFinanceStore } from "../store/financeStore";
import { useState } from "react";
import { Modal } from "../components/Modal";
import { formatCurrency } from "../utils/format";
import TransactionCard from "../components/TransactionCard";

function getAccountTypeName(type) {
  return {
    cash: "現金",
    bank: "銀行戶口",
    credit: "信用卡",
    investment: "投資",
    other: "其他",
  }[type] || type;
}

function AccountPreviewModal({ open, account, onClose, onEdit, onDelete, transactions, categories, mainCurrency, exchangeRates, accounts }) {
  if (!open || !account) return null;
  const recentTx = transactions
    .filter(tx => tx.accountId === account.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);
  return (
    <Modal open={open} onClose={onClose} title="戶口概覽">
      <div style={{fontWeight:600, fontSize:20}}>{account.name}</div>
      <div>類型：{getAccountTypeName(account.type)}</div>
      <div>餘額：{formatCurrency(account.balance, account.currency)}</div>
      <div>貨幣：{account.currency}</div>
      {account.note && <div>備註：{account.note}</div>}
      <div style={{color:"#888", fontSize:13, marginTop:10}}>建立時間：{account.createdAt?.slice(0,10)}</div>
      <div style={{margin:"18px 0 8px 0", fontWeight:500}}>最近交易記錄</div>
      {recentTx.length === 0
        ? <div style={{color:"#888", fontSize:13}}>暫無交易</div>
        : recentTx.map(tx => {
            const cat = categories.find(c=>c.id===tx.categoryId);
            return (
              <TransactionCard
                key={tx.id}
                tx={tx}
                category={cat}
                account={account}
              />
            );
          })}
      <div className="modal-footer" style={{marginTop:18}}>
        <button className="btn btn-secondary" onClick={()=>onEdit(account)}>編輯</button>
        <button className="btn btn-danger" style={{marginLeft:8}} onClick={()=>onDelete(account)}>
          刪除
        </button>
      </div>
    </Modal>
  );
}

// 你的 AccountsPage 可如原本邏輯，只要把 AccountPreviewModal 換成這版