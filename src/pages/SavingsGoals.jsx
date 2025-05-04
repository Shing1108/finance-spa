import { useFinanceStore } from "../store/financeStore";
import { useState } from "react";
import { Modal } from "../components/Modal";
import dayjs from "dayjs";
import { formatCurrency } from "../utils/format";

function toMainCurrency(amount, currency, mainCurrency, exchangeRates) {
  if (currency === mainCurrency) return amount;
  const fromRate = exchangeRates[currency];
  const toRate = exchangeRates[mainCurrency];
  if (!fromRate || !toRate) return amount;
  return amount * (toRate / fromRate);
}

export default function SavingsGoalsPage() {
  const {
    savingsGoals,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    accounts,
    settings,
    exchangeRates,
  } = useFinanceStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editGoal, setEditGoal] = useState(null);

  const defaultCurrency = settings?.defaultCurrency || "HKD";
  const [form, setForm] = useState({
    name: "",
    targetAmount: "",
    currency: defaultCurrency,
    currentAmount: "",
    deadline: "",
    note: "",
    accountId: "",
  });

  function openAddModal() {
    setEditGoal(null);
    setForm({
      name: "",
      targetAmount: "",
      currency: defaultCurrency,
      currentAmount: "",
      deadline: "",
      note: "",
      accountId: "",
    });
    setModalOpen(true);
  }

  function openEditModal(goal) {
    setEditGoal(goal);
    setForm({ ...goal });
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
    if (!form.name || isNaN(form.targetAmount)) return;
    if (editGoal) {
      updateSavingsGoal(editGoal.id, form);
    } else {
      addSavingsGoal(form);
    }
    setModalOpen(false);
  }

  function handleDelete(goal) {
    if (window.confirm(`確定要刪除儲蓄目標「${goal.name}」嗎？`)) {
      deleteSavingsGoal(goal.id);
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3>儲蓄目標</h3>
        <button className="btn btn-primary" onClick={openAddModal}>
          <i className="fas fa-plus" /> 新增儲蓄目標
        </button>
      </div>
      <div className="card-body">
        {/* 新增/編輯模態框 */}
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editGoal ? "編輯儲蓄目標" : "新增儲蓄目標"}>
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
              <label>目標金額</label>
              <input
                type="number"
                className="form-control"
                name="targetAmount"
                value={form.targetAmount}
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
              <label>當前金額</label>
              <input
                type="number"
                className="form-control"
                name="currentAmount"
                value={form.currentAmount}
                onChange={handleFormChange}
              />
            </div>
            <div className="form-group">
              <label>目標日期</label>
              <input
                type="date"
                className="form-control"
                name="deadline"
                value={form.deadline}
                onChange={handleFormChange}
              />
            </div>
            <div className="form-group">
              <label>連結戶口</label>
              <select
                className="form-control"
                name="accountId"
                value={form.accountId}
                onChange={handleFormChange}
              >
                <option value="">不連結戶口</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency})
                  </option>
                ))}
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

        {/* 目標列表 */}
        <div className="savings-goals-list">
          {savingsGoals.length === 0 ? (
            <div className="empty-message">尚未設置儲蓄目標</div>
          ) : (
            savingsGoals.map((g) => {
              const progress = g.targetAmount > 0 ? Math.min(100, (g.currentAmount / g.targetAmount) * 100) : 0;
              // 主幣種顯示
              const currentMain = toMainCurrency(Number(g.currentAmount), g.currency, defaultCurrency, exchangeRates);
              const targetMain = toMainCurrency(Number(g.targetAmount), g.currency, defaultCurrency, exchangeRates);
              return (
                <div key={g.id} className="savings-goal-card">
                  <div className="savings-goal-header">
                    <span className="savings-goal-title">{g.name}</span>
                    <span className="savings-goal-target">
                      目標：{formatCurrency(g.targetAmount, g.currency)}
                      <span style={{ fontSize: 12, color: "#888", marginLeft: 4 }}>
                        ({formatCurrency(targetMain, defaultCurrency)})
                      </span>
                    </span>
                  </div>
                  <div className="savings-goal-progress-bar">
                    <div className="savings-goal-progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="savings-goal-stats">
                    <span>
                      進度：{formatCurrency(g.currentAmount, g.currency)}
                      <span style={{ fontSize: 12, color: "#888", marginLeft: 4 }}>
                        ({formatCurrency(currentMain, defaultCurrency)})（{Math.round(progress)}%）
                      </span>
                    </span>
                    {g.deadline && (
                      <span className="savings-goal-deadline">
                        目標日：{g.deadline}（{getDeadlineStatus(g.deadline)})
                      </span>
                    )}
                  </div>
                  {g.accountId && (
                    <div className="savings-goal-note">
                      連結戶口：{accounts.find((a) => a.id === g.accountId)?.name}
                    </div>
                  )}
                  {g.note && (
                    <div className="savings-goal-note">備註：{g.note}</div>
                  )}
                  <div className="savings-goal-actions">
                    <button className="btn-icon" onClick={() => openEditModal(g)}>
                      <i className="fas fa-edit" />
                    </button>
                    <button className="btn-icon" onClick={() => handleDelete(g)}>
                      <i className="fas fa-trash-alt" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function getDeadlineStatus(deadline) {
  const today = dayjs().startOf("day");
  const goalDay = dayjs(deadline);
  if (goalDay.isSame(today, "day")) return "就是今天";
  if (goalDay.isAfter(today)) return `還有 ${goalDay.diff(today, "day")} 天`;
  return `已超過 ${today.diff(goalDay, "day")} 天`;
}