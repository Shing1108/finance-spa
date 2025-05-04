import React, { useState, useEffect } from "react";
import { useFinanceStore } from "../store/financeStore";
import dayjs from "dayjs";
import TransactionPreviewModal from "../components/TransactionPreviewModal";
import TransactionCard from "../components/TransactionCard";
import { Modal } from "../components/Modal";

export default function TransactionsPage() {
  const {
    transactions,
    categories,
    accounts,
    addTransaction,
    updateTransaction,
    addNoteSuggestion,
    noteSuggestions,
  } = useFinanceStore();

  const [form, setForm] = useState({
    type: "expense",
    date: dayjs().format("YYYY-MM-DD"),
    categoryId: "",
    accountId: "",
    amount: "",
    note: "",
  });
  const [previewTx, setPreviewTx] = useState(null);
  const [editTx, setEditTx] = useState(null);

  // 搜尋條件 state
  const [searchType, setSearchType] = useState("");
  const [searchCategory, setSearchCategory] = useState("");
  const [searchAccount, setSearchAccount] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchDateFrom, setSearchDateFrom] = useState("");
  const [searchDateTo, setSearchDateTo] = useState("");
  const [searchAmountMin, setSearchAmountMin] = useState("");
  const [searchAmountMax, setSearchAmountMax] = useState("");

  // 分頁 state
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // 根據所選 type 過濾分類
  const filteredCategories = categories.filter((cat) => cat.type === form.type);

  // 預設分類和戶口
  useEffect(() => {
    if (
      filteredCategories.length > 0 &&
      !filteredCategories.find((c) => c.id === form.categoryId)
    ) {
      setForm((f) => ({ ...f, categoryId: filteredCategories[0].id }));
    }
    if (
      accounts.length > 0 &&
      !accounts.find((a) => a.id === form.accountId)
    ) {
      setForm((f) => ({ ...f, accountId: accounts[0].id }));
    }
    // eslint-disable-next-line
  }, [form.type, categories.length, accounts.length]);

  const currentNoteSuggestions = noteSuggestions[form.categoryId] || [];

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || !form.categoryId || !form.accountId) return;
    addTransaction({
      ...form,
      amount: parseFloat(form.amount),
      createdAt: new Date().toISOString(),
      id: Math.random().toString(36).slice(2),
    });
    if (form.note && form.categoryId) addNoteSuggestion(form.categoryId, form.note);
    setForm((f) => ({ ...f, amount: "", note: "" }));
  };

  // 編輯相關
  const handleEdit = (tx) => {
    setPreviewTx(null);
    setEditTx(tx);
  };
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditTx((tx) => ({ ...tx, [name]: value }));
  };
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editTx) return;
    updateTransaction(editTx.id, {
      ...editTx,
      amount: parseFloat(editTx.amount),
    });
    setEditTx(null);
  };

  // 搜尋條件重設
  const handleResetSearch = () => {
    setSearchType("");
    setSearchCategory("");
    setSearchAccount("");
    setSearchKeyword("");
    setSearchDateFrom("");
    setSearchDateTo("");
    setSearchAmountMin("");
    setSearchAmountMax("");
  };

  // 綜合過濾
  const filteredTxs = transactions.filter((tx) => {
    if (searchType && tx.type !== searchType) return false;
    if (searchCategory && tx.categoryId !== searchCategory) return false;
    if (searchAccount && tx.accountId !== searchAccount) return false;
    if (
      searchKeyword &&
      !(
        (tx.note && tx.note.includes(searchKeyword)) ||
        (tx.amount && String(tx.amount).includes(searchKeyword)) ||
        (tx.id && tx.id.includes(searchKeyword))
      )
    )
      return false;
    if (
      searchDateFrom &&
      dayjs(tx.date).isBefore(dayjs(searchDateFrom), "day")
    )
      return false;
    if (
      searchDateTo &&
      dayjs(tx.date).isAfter(dayjs(searchDateTo), "day")
    )
      return false;
    if (
      searchAmountMin &&
      Number(tx.amount) < Number(searchAmountMin)
    )
      return false;
    if (
      searchAmountMax &&
      Number(tx.amount) > Number(searchAmountMax)
    )
      return false;
    return true;
  });

  // 分頁運算
  const pageCount = Math.ceil(filteredTxs.length / pageSize);
  const pagedTxs = filteredTxs
    .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
    .slice((page - 1) * pageSize, page * pageSize);

  // 搜尋條件或資料變動時自動跳回第一頁
  useEffect(() => {
    setPage(1);
  }, [
    searchType,
    searchCategory,
    searchAccount,
    searchKeyword,
    searchDateFrom,
    searchDateTo,
    searchAmountMin,
    searchAmountMax,
    transactions.length,
  ]);

  return (
    <div className="card">
      <div className="card-header">
        <h3>新增交易</h3>
      </div>
      <div className="card-body">
        {/* 新增表單 */}
        <form onSubmit={handleSubmit} style={{ marginBottom: 12 }}>
          <div className="form-group">
            <label>類型</label>
            <select
              name="type"
              className="form-control"
              value={form.type}
              onChange={handleFormChange}
              required
            >
              <option value="income">收入</option>
              <option value="expense">支出</option>
              <option value="transfer">轉賬</option>
            </select>
          </div>
          <div className="form-group">
            <label>日期</label>
            <input
              type="date"
              name="date"
              className="form-control"
              value={form.date}
              onChange={handleFormChange}
              required
            />
          </div>
          <div className="form-group">
            <label>分類</label>
            <select
              name="categoryId"
              className="form-control"
              value={form.categoryId}
              onChange={handleFormChange}
              required
            >
              {filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>戶口</label>
            <select
              name="accountId"
              className="form-control"
              value={form.accountId}
              onChange={handleFormChange}
              required
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}（{acc.currency}）
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>金額</label>
            <input
              type="number"
              name="amount"
              className="form-control"
              value={form.amount}
              onChange={handleFormChange}
              required
              min="0"
              step="0.01"
            />
          </div>
          <div className="form-group">
            <label>備註</label>
            <input
              name="note"
              className="form-control"
              value={form.note}
              onChange={handleFormChange}
              autoComplete="off"
              placeholder="可輸入新備註，或點下方快速選擇"
            />
            {currentNoteSuggestions.length > 0 && (
              <div className="quick-note-buttons">
                {currentNoteSuggestions.map((sug, idx) => (
                  <button
                    type="button"
                    className="quick-note-btn"
                    key={idx}
                    onClick={() =>
                      setForm((f) => ({ ...f, note: sug }))
                    }
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button type="submit" className="btn btn-primary">
            新增
          </button>
        </form>
        <br></br><br></br>
        <h3 className="mb-2">交易記錄</h3>
        <br></br>
        <hr className="my-6" />
        <br></br>

        <div className="search-bar">
  <div className="search-item">
    <select value={searchType} onChange={e => setSearchType(e.target.value)} placeholder="類型">
      <option value="">全部類型</option>
      <option value="income">收入</option>
      <option value="expense">支出</option>
      <option value="transfer">轉賬</option>
    </select>
  </div>
  <div className="search-item">
    <select value={searchCategory} onChange={e => setSearchCategory(e.target.value)} placeholder="分類">
      <option value="">全部分類</option>
      {categories.map(cat => (
        <option key={cat.id} value={cat.id}>{cat.name}</option>
      ))}
    </select>
  </div>
  <div className="search-item">
    <select value={searchAccount} onChange={e => setSearchAccount(e.target.value)} placeholder="戶口">
      <option value="">全部戶口</option>
      {accounts.map(acc => (
        <option key={acc.id} value={acc.id}>{acc.name}</option>
      ))}
    </select>
  </div>
  <div className="search-item">
    <input type="text" value={searchKeyword} onChange={e => setSearchKeyword(e.target.value)} placeholder="關鍵字" />
  </div>
  <div className="search-item">
    <input type="date" value={searchDateFrom} onChange={e => setSearchDateFrom(e.target.value)} placeholder="開始日期" />
  </div>
  <div className="search-item">
    <input type="date" value={searchDateTo} onChange={e => setSearchDateTo(e.target.value)} placeholder="結束日期" />
  </div>
  <div className="search-item">
    <input type="number" value={searchAmountMin} onChange={e => setSearchAmountMin(e.target.value)} placeholder="金額下限" min="0" />
  </div>
  <div className="search-item">
    <input type="number" value={searchAmountMax} onChange={e => setSearchAmountMax(e.target.value)} placeholder="金額上限" min="0" />
  </div>
  <button type="button" className="reset-btn" onClick={handleResetSearch}>重設</button>
</div>
        {/* ====== 搜尋條件表單 End ====== */}

        {/* 編輯表單 Modal */}
        <Modal
          open={!!editTx}
          onClose={() => setEditTx(null)}
          title="編輯交易"
        >
          {editTx && (
            <form className="modal-body" onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>類型</label>
                <select
                  name="type"
                  className="form-control"
                  value={editTx.type}
                  onChange={handleEditChange}
                  required
                >
                  <option value="income">收入</option>
                  <option value="expense">支出</option>
                  <option value="transfer">轉賬</option>
                </select>
              </div>
              <div className="form-group">
                <label>日期</label>
                <input
                  type="date"
                  name="date"
                  className="form-control"
                  value={editTx.date}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>分類</label>
                <select
                  name="categoryId"
                  className="form-control"
                  value={editTx.categoryId}
                  onChange={handleEditChange}
                  required
                >
                  {categories
                    .filter((cat) => cat.type === editTx.type)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="form-group">
                <label>戶口</label>
                <select
                  name="accountId"
                  className="form-control"
                  value={editTx.accountId}
                  onChange={handleEditChange}
                  required
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}（{acc.currency}）
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>金額</label>
                <input
                  type="number"
                  name="amount"
                  className="form-control"
                  value={editTx.amount}
                  onChange={handleEditChange}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>備註</label>
                <input
                  name="note"
                  className="form-control"
                  value={editTx.note}
                  onChange={handleEditChange}
                />
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">
                  保存
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditTx(null)}
                >
                  取消
                </button>
              </div>
            </form>
          )}
        </Modal>

        {/* 預覽 modal，只在未編輯時顯示 */}
        <TransactionPreviewModal
          open={!!previewTx && !editTx}
          tx={previewTx}
          onClose={() => setPreviewTx(null)}
          onEdit={handleEdit}
        />

        <hr className="my-6" />

        <div className="transactions-list">
          {pagedTxs.length === 0 ? (
            <div className="empty-message">尚無交易</div>
          ) : (
            pagedTxs.map((tx) => {
              const cat = categories.find((c) => c.id === tx.categoryId);
              const acc = accounts?.find((a) => a.id === tx.accountId);
              return (
                <TransactionCard
                  key={tx.id}
                  tx={tx}
                  category={cat}
                  account={acc}
                  onClick={() => setPreviewTx(tx)}
                />
              );
            })
          )}
        </div>
        {/* 分頁控制 */}
        {pageCount > 1 && (
          <div style={{ textAlign: "center", margin: "18px 0" }}>
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              style={{
                marginRight: 12,
                padding: "6px 14px",
                borderRadius: 4,
                border: "1px solid #444",
                background: "#222",
                color: "#fff",
              }}
            >
              上一頁
            </button>
            <span style={{ fontWeight: 500 }}>
              第 {page} / {pageCount} 頁
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === pageCount}
              style={{
                marginLeft: 12,
                padding: "6px 14px",
                borderRadius: 4,
                border: "1px solid #444",
                background: "#222",
                color: "#fff",
              }}
            >
              下一頁
            </button>
          </div>
        )}
      </div>
    </div>
  );
}