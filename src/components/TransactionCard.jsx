import React from "react";

export default function TransactionCard({ tx, category, account, onClick }) {
  const isIncome = tx.type === "income";
  const isTransfer = tx.type === "transfer";
  return (
    <div
      className={`transaction-item-modern ${isIncome ? "income" : isTransfer ? "transfer" : "expense"}`}
      onClick={onClick}
      tabIndex={0}
      style={{ outline: "none" }}
      onKeyDown={e => {
        if (onClick && (e.key === "Enter" || e.key === " ")) onClick();
      }}
    >
      <div
        className="tx-icon-area"
        style={{ background: category?.color || "#bbb" }}
      >
        <i className={`fas fa-${category?.icon || "question"}`}></i>
      </div>
      <div className="tx-main">
        <div className="tx-row">
          <span className="tx-category">{category?.name || "未分類"}</span>
          <span className="tx-amount">
            <span className="sign">
              {isIncome ? "+" : isTransfer ? "⇄" : "-"}
            </span>
            {tx.amount}
            {tx.currency && (
              <span style={{ fontSize: 12, marginLeft: 4, opacity: 0.6 }}>
                {tx.currency}
              </span>
            )}
          </span>
        </div>
        <div className="tx-meta">
          <span className="tx-date">{tx.date}</span>
          {tx.note && <span className="tx-note">・{tx.note}</span>}
          {account && <span className="tx-account">・{account.name}</span>}
        </div>
      </div>
    </div>
  );
}