import React, { useState } from "react";
import { useFinanceStore } from "../store/financeStore";
import { Modal } from "../components/Modal";
import { formatCurrency } from "../utils/format";
import dayjs from "dayjs";

function toMainCurrency(amount, currency, mainCurrency, exchangeRates) {
  if (currency === mainCurrency) return amount;
  const fromRate = exchangeRates[currency];
  const toRate = exchangeRates[mainCurrency];
  if (!fromRate || !toRate) return amount;
  return amount * (toRate / fromRate);
}

// 響應式 hook：偵測手機
function useIsMobile(breakpoint = 600) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= breakpoint);
  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}

export default function BudgetsPage() {
  const { budgets, categories, addBudget, updateBudget, deleteBudget, settings, exchangeRates, transactions } = useFinanceStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editBudget, setEditBudget] = useState(null);
  const [form, setForm] = useState({
    categoryId: "",
    amount: "",
    period: "monthly",
    year: dayjs().year(),
    month: dayjs().month() + 1,
    quarter: Math.ceil((dayjs().month() + 1) / 3),
    resetDay: 1,
  });

  const mainCurrency = settings.defaultCurrency || "HKD";
  const isMobile = useIsMobile();

  // 取得所有有預算的年月，預設選當月
  const allMonths = Array.from(new Set(
    budgets
      .map(b => `${b.year}-${String(b.month).padStart(2, "0")}`)
  )).sort((a, b) => b.localeCompare(a));
  const [selectedMonth, setSelectedMonth] = useState(
    `${dayjs().year()}-${String(dayjs().month() + 1).padStart(2, "0")}`
  );
  // 過濾該月所有預算
  const budgetsOfMonth = budgets.filter(
    b => `${b.year}-${String(b.month).padStart(2, "0")}` === selectedMonth
  );

  function openAddModal() {
    setEditBudget(null);
    setForm({
      categoryId: "",
      amount: "",
      period: "monthly",
      year: Number(selectedMonth.split("-")[0]),
      month: Number(selectedMonth.split("-")[1]),
      quarter: Math.ceil(Number(selectedMonth.split("-")[1]) / 3),
      resetDay: 1,
    });
    setModalOpen(true);
  }
  function openEditModal(budget) {
    setEditBudget(budget);
    setForm({ ...budget });
    setModalOpen(true);
  }
  function handleFormChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }
  function handleFormSubmit(e) {
    e.preventDefault();
    if (!form.categoryId || isNaN(form.amount)) return;

    // 防止同月同類別重複
    const isDuplicate = budgets.some(b =>
      b.categoryId === form.categoryId &&
      Number(b.year) === Number(form.year) &&
      Number(b.month) === Number(form.month) &&
      b.id !== editBudget?.id
    );
    if (isDuplicate) {
      alert("同一月份與類別已存在預算，請勿重複建立！");
      return;
    }

    if (editBudget) {
      updateBudget(editBudget.id, form);
    } else {
      addBudget(form);
    }
    setModalOpen(false);
  }
  function handleDelete(budget) {
    if (window.confirm("確定要刪除此預算嗎？")) {
      deleteBudget(budget.id);
    }
  }

  function getBudgetExpense(budget) {
    const start = dayjs(`${budget.year}-${String(budget.month).padStart(2, "0")}-${String(budget.resetDay || 1).padStart(2, "0")}`);
    const end = start.add(1, "month").subtract(1, "day");
    return transactions
      .filter(
        (tx) =>
          tx.type === "expense" &&
          tx.categoryId === budget.categoryId &&
          dayjs(tx.date).isBetween(start, end, null, "[]")
      )
      .reduce(
        (sum, tx) =>
          sum +
          toMainCurrency(Number(tx.amount), tx.currency ?? mainCurrency, mainCurrency, exchangeRates),
        0
      );
  }

  return (
    <div className="card">
      <div
        className="card-header"
        style={{ flexDirection: isMobile ? "column" : "row", gap: 8 }}
      >
        <h3>預算管理</h3>
        <button
          className="btn btn-primary"
          onClick={openAddModal}
          style={{ marginTop: isMobile ? 8 : 0 }}
        >
          <i className="fa fa-plus" /> 新增預算
        </button>
      </div>

      {/* 月份查詢選單 */}
      <div style={{ margin: "8px 0 18px 0", display: "flex", gap: 8, alignItems: "center" }}>
        <span>切換月份：</span>
        <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
          {allMonths.map(m => (
            <option key={m} value={m}>
              {m.replace("-", "年") + "月"}
            </option>
          ))}
        </select>
      </div>

      <div className="card-body">
        <div className="budgets-list">
          {budgetsOfMonth.length === 0 ? (
            <div className="empty-message">此月份尚未設定預算</div>
          ) : isMobile ? (
            // ======= 手機卡片模式 =======
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {budgetsOfMonth.map((b) => {
                const used = getBudgetExpense(b);
                const cat = categories.find((c) => c.id === b.categoryId);
                return (
                  <div key={b.id} style={{
                    background: "#181a1b",
                    borderRadius: 10,
                    boxShadow: "0 2px 8px rgba(52,152,219,0.1)",
                    padding: "14px 16px",
                    color: "#eee",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    position: "relative"
                  }}>
                    <div style={{ fontWeight: 600, fontSize: 17, color: cat?.color || "#4CAF50" }}>
                      <i className="fa fa-tag" style={{ marginRight: 6 }} />
                      {cat?.name || "類別"}
                    </div>
                    <div>金額：<b style={{ color: "#fff" }}>{formatCurrency(b.amount, mainCurrency)}</b></div>
                    <div>已花：<span style={{ color: "#f39c12" }}>{formatCurrency(used, mainCurrency)}</span>
                      <span style={{ color: "#aaa", fontSize: 13 }}>（{Math.round((used / b.amount) * 100)}%）</span>
                    </div>
                    <div>重設日：{b.resetDay || 1} 號</div>
                    <div>月份：{b.year}/{String(b.month).padStart(2, "0")}</div>
                    <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                      <button className="btn btn-sm btn-primary" style={{ flex: 1 }} onClick={() => openEditModal(b)}>
                        <i className="fa fa-edit" /> 編輯
                      </button>
                      <button className="btn btn-sm btn-danger" style={{ flex: 1 }} onClick={() => handleDelete(b)}>
                        <i className="fa fa-trash-alt" /> 刪除
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // ======= 桌機表格模式 =======
            <table className="min-w-full border">
              <thead>
                <tr className="bg-gray-50 dark:bg-neutral-700">
                  <th className="px-2 py-1">類別</th>
                  <th className="px-2 py-1">金額（主幣種）</th>
                  <th className="px-2 py-1">已花金額</th>
                  <th className="px-2 py-1">重設日</th>
                  <th className="px-2 py-1">年份</th>
                  <th className="px-2 py-1">月份</th>
                  <th className="px-2 py-1">操作</th>
                </tr>
              </thead>
              <tbody>
                {budgetsOfMonth.map((b) => {
                  const used = getBudgetExpense(b);
                  return (
                    <tr key={b.id} className="border-t">
                      <td className="px-2 py-1">
                        {categories.find((c) => c.id === b.categoryId)?.name || ""}
                      </td>
                      <td className="px-2 py-1">
                        {formatCurrency(b.amount, mainCurrency)}
                      </td>
                      <td className="px-2 py-1">
                        {formatCurrency(used, mainCurrency)} ({Math.round((used / b.amount) * 100)}%)
                      </td>
                      <td className="px-2 py-1">{b.resetDay || 1}</td>
                      <td className="px-2 py-1">{b.year}</td>
                      <td className="px-2 py-1">{b.month}</td>
                      <td className="px-2 py-1">
                        <button className="btn-icon" onClick={() => openEditModal(b)}>
                          <i className="fa fa-edit" />
                        </button>
                        <button className="btn-icon" onClick={() => handleDelete(b)}>
                          <i className="fa fa-trash-alt" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editBudget ? "編輯預算" : "新增預算"}>
        <form onSubmit={handleFormSubmit}>
          <div className="form-group">
            <label>類別</label>
            <select
              name="categoryId"
              className="form-control"
              value={form.categoryId}
              onChange={handleFormChange}
              required
            >
              <option value="">選擇類別</option>
              {categories.filter((c) => c.type === "expense").map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>預算金額</label>
            <input type="number" name="amount" className="form-control"
              value={form.amount} onChange={handleFormChange} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>年份</label>
              <input type="number" name="year" className="form-control"
                value={form.year} onChange={handleFormChange} required min={2000} max={2100} />
            </div>
            <div className="form-group">
              <label>月份</label>
              <input type="number" name="month" className="form-control"
                value={form.month} onChange={handleFormChange} required min={1} max={12} />
            </div>
            <div className="form-group">
              <label>重設日（1~28，預設1）</label>
              <input type="number" name="resetDay" className="form-control"
                value={form.resetDay || 1} onChange={handleFormChange} required min={1} max={28} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="submit" className="btn btn-primary">保存</button>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>取消</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}