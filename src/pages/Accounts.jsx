import { useFinanceStore } from "../store/financeStore";
import { useState } from "react";
import { Modal } from "../components/Modal";
import { formatCurrency } from "../utils/format";

function toMainCurrency(amount, currency, mainCurrency, exchangeRates) {
  if (currency === mainCurrency) return amount;
  const fromRate = exchangeRates[currency];
  const toRate = exchangeRates[mainCurrency];
  if (!fromRate || !toRate) return amount;
  return amount * (toRate / fromRate);
}

function getAccountTypeName(type) {
  return {
    cash: "現金",
    bank: "銀行戶口",
    credit: "信用卡",
    investment: "投資",
    other: "其他",
  }[type] || type;
}

export default function AccountsPage() {
  const { accounts, addAccount, updateAccount, deleteAccount, settings, exchangeRates, transactions, categories } = useFinanceStore();
  const [view, setView] = useState("card");
  const [modalOpen, setModalOpen] = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  const [previewAccount, setPreviewAccount] = useState(null);
  const [form, setForm] = useState({
    name: "",
    type: "cash",
    balance: "",
    currency: settings.defaultCurrency || "HKD",
    note: "",
  });

  const mainCurrency = settings.defaultCurrency || "HKD";

  function openAddModal() {
    setEditAccount(null);
    setForm({
      name: "",
      type: "cash",
      balance: "",
      currency: settings.defaultCurrency || "HKD",
      note: "",
    });
    setModalOpen(true);
  }

  function openEditModal(account) {
    setEditAccount(account);
    setForm({
      name: account.name,
      type: account.type,
      balance: account.balance,
      currency: account.currency,
      note: account.note || "",
    });
    setModalOpen(true);
  }

  function handleFormChange(e) {
    setForm((f) => ({
      ...f,
      [e.target.name]: e.target.value,
    }));
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.type) return;
    const payload = {
      ...form,
      balance: parseFloat(form.balance),
      initialBalance: parseFloat(form.balance),
    };
    if (editAccount) {
      updateAccount(editAccount.id, payload);
    } else {
      addAccount(payload);
    }
    setModalOpen(false);
  }

  function handleAdjust(acc) {
    const str = prompt(`請輸入「${acc.name}」欲校正的新餘額`, acc.balance);
    if (str === null) return;
    const newBalance = parseFloat(str);
    if (isNaN(newBalance)) return alert("請輸入正確數字！");
    useFinanceStore.getState().adjustAccountBalance(acc.id, newBalance);
  }

  function handleDelete(account) {
    if (window.confirm(`確定要刪除戶口「${account.name}」嗎？`)) {
      deleteAccount(account.id);
      setPreviewAccount(null);
    }
  }

  // 計算主幣種總資產
  const totalMainCurrency = accounts.reduce(
    (sum, acc) =>
      sum + toMainCurrency(Number(acc.balance), acc.currency, mainCurrency, exchangeRates),
    0
  );

  // 戶口預覽 Modal（內含近五筆交易）
  function AccountPreviewModal({ open, account, onClose, onEdit, onDelete, transactions, categories, mainCurrency, exchangeRates }) {
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
        <div>主幣種換算：{formatCurrency(toMainCurrency(Number(account.balance), account.currency, mainCurrency, exchangeRates), mainCurrency)}</div>
        <div>貨幣：{account.currency}</div>
        {account.note && <div>備註：{account.note}</div>}
        <div style={{color:"#888", fontSize:13, marginTop:10}}>建立時間：{account.createdAt?.slice(0,10)}</div>
        <div style={{margin:"18px 0 8px 0", fontWeight:500}}>最近交易記錄</div>
        {recentTx.length === 0
          ? <div style={{color:"#888", fontSize:13}}>暫無交易</div>
          : recentTx.map(tx => {
              const cat = categories.find(c=>c.id===tx.categoryId);
              return (
                <div key={tx.id} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #eee",
                  padding: "6px 0"
                }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>
                      {cat?.name || "未分類"}
                    </div>
                    <div style={{ fontSize: 12, color: "#888" }}>
                      {tx.date} {tx.note && "・" + tx.note}
                    </div>
                  </div>
                  <div style={{
                    fontWeight: 600,
                    color: tx.type === "income" ? "#2ecc71" : "#e74c3c"
                  }}>
                    {tx.type === "income" ? "+" : "-"}
                    {formatCurrency(tx.amount, tx.currency || account.currency)}
                  </div>
                </div>
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

  return (
    <div className="card">
      <div className="card-header">
        <h3>戶口管理</h3>
        <button className="btn btn-primary" onClick={openAddModal}>
          <i className="fas fa-plus"></i> 新增戶口
        </button>
        <div className="view-toggle">
          <button
            className={`btn btn-sm${view === "card" ? " btn-primary" : ""}`}
            onClick={() => setView("card")}
          >
            卡片視圖
          </button>
          <button
            className={`btn btn-sm${view === "list" ? " btn-primary" : ""}`}
            onClick={() => setView("list")}
          >
            列表視圖
          </button>
        </div>
      </div>
      <div className="card-body">
        <div style={{ marginBottom: 16, color: "#888", fontSize: 13 }}>
          <b>主幣種總資產：</b>
          {formatCurrency(totalMainCurrency, mainCurrency)}
        </div>
        {view === "card" ? (
          <div className="accounts-list card-view">
            {accounts.length === 0 ? (
              <div className="empty-message">尚未設置任何戶口</div>
            ) : (
              accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="account-card"
                  tabIndex={0}
                  style={{ cursor: "pointer" }}
                  onClick={() => setPreviewAccount(acc)}
                  onKeyDown={e => (e.key === "Enter" || e.key === " ") && setPreviewAccount(acc)}
                >
                  <div className="account-card-header" style={{ background: "#3498db", color: "#fff" }}>
                    <h3>{acc.name}</h3>
                    <div className="account-type">{getAccountTypeName(acc.type)}</div>
                  </div>
                  <div className="account-card-body">
                    <div className="account-balance">
                      {formatCurrency(acc.balance, acc.currency)}
                      {" "}
                      <span style={{ fontSize: 12, color: "#888" }}>
                        ({formatCurrency(
                          toMainCurrency(Number(acc.balance), acc.currency, mainCurrency, exchangeRates),
                          mainCurrency
                        )})
                      </span>
                    </div>
                    <div className="account-currency">{acc.currency}</div>
                    {acc.note && <div className="account-note">備註：{acc.note}</div>}
                    <div className="account-actions">
                      <button className="btn-icon" onClick={e => {e.stopPropagation(); openEditModal(acc);}}>
                        <i className="fas fa-edit"></i>
                      </button>
                      <button className="btn btn-sm btn-secondary" onClick={e => {e.stopPropagation(); handleAdjust(acc);}}>
                        校正餘額
                      </button>
                      <button className="btn-icon" onClick={e => {e.stopPropagation(); handleDelete(acc);}}>
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="accounts-list list-view">
            {accounts.length === 0 ? (
              <div className="empty-message">尚未設置任何戶口</div>
            ) : (
              accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="account-list-item"
                  tabIndex={0}
                  style={{ cursor: "pointer" }}
                  onClick={() => setPreviewAccount(acc)}
                  onKeyDown={e => (e.key === "Enter" || e.key === " ") && setPreviewAccount(acc)}
                >
                  <div className="account-info">
                    <div className="account-name">{acc.name}</div>
                    <div className="account-type-currency">
                      {getAccountTypeName(acc.type)} · {acc.currency}
                    </div>
                  </div>
                  <div className="account-details">
                    <div className="account-balance">
                      {formatCurrency(acc.balance, acc.currency)}
                      {" "}
                      <span style={{ fontSize: 12, color: "#888" }}>
                        ({formatCurrency(
                          toMainCurrency(Number(acc.balance), acc.currency, mainCurrency, exchangeRates),
                          mainCurrency
                        )})
                      </span>
                    </div>
                  </div>
                  <div className="account-actions">
                    <button className="btn-icon" onClick={e => {e.stopPropagation(); openEditModal(acc);}}>
                      <i className="fas fa-edit"></i>
                    </button>
                    <button className="btn-icon" onClick={e => {e.stopPropagation(); handleDelete(acc);}}>
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      {/* 新增/編輯戶口 Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editAccount ? "編輯戶口" : "新增戶口"}
      >
        <form onSubmit={handleFormSubmit}>
          <div className="form-group">
            <label>名稱</label>
            <input
              className="form-control"
              name="name"
              value={form.name}
              onChange={handleFormChange}
              required
            />
          </div>
          <div className="form-group">
            <label>類型</label>
            <select
              className="form-control"
              name="type"
              value={form.type}
              onChange={handleFormChange}
              required
            >
              <option value="cash">現金</option>
              <option value="bank">銀行戶口</option>
              <option value="credit">信用卡</option>
              <option value="investment">投資</option>
              <option value="other">其他</option>
            </select>
          </div>
          <div className="form-group">
            <label>餘額</label>
            <input
              type="number"
              className="form-control"
              name="balance"
              value={form.balance}
              onChange={handleFormChange}
              required
            />
          </div>
          <div className="form-group">
            <label>貨幣</label>
            <select
              className="form-control"
              name="currency"
              value={form.currency}
              onChange={handleFormChange}
              required
            >
              <option value="HKD">港幣 (HKD)</option>
              <option value="USD">美元 (USD)</option>
              <option value="CNY">人民幣 (CNY)</option>
              <option value="EUR">歐元 (EUR)</option>
              <option value="GBP">英鎊 (GBP)</option>
              <option value="JPY">日圓 (JPY)</option>
            </select>
          </div>
          <div className="form-group">
            <label>備註</label>
            <input
              className="form-control"
              name="note"
              value={form.note}
              onChange={handleFormChange}
            />
          </div>
          <div className="modal-footer">
            <button type="submit" className="btn btn-primary">
              保存
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setModalOpen(false)}
            >
              取消
            </button>
          </div>
        </form>
      </Modal>
      {/* 預覽戶口 Modal */}
      <AccountPreviewModal
        open={!!previewAccount}
        account={previewAccount}
        onClose={() => setPreviewAccount(null)}
        onEdit={acc => { setEditAccount(acc); setForm({
          name: acc.name,
          type: acc.type,
          balance: acc.balance,
          currency: acc.currency,
          note: acc.note || "",
        }); setModalOpen(true); setPreviewAccount(null); }}
        onDelete={handleDelete}
        transactions={transactions}
        categories={categories}
        mainCurrency={mainCurrency}
        exchangeRates={exchangeRates}
      />
    </div>
  );
}