import { useFinanceStore } from "../store/financeStore";
import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "../utils/format";
import dayjs from "dayjs";
import TransactionCard from "../components/TransactionCard";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { useToastStore } from "../store/toastStore";
import AnalyticsAIWidget from "../components/AnalyticsAIWidget";
import BalanceForecastWidget from "../components/BalanceForecastWidget";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, ArcElement, Tooltip, Legend);

const WIDGETS = [
  { key: "today", label: "今日交易" },
  { key: "budget", label: "預算狀態" },
  { key: "health", label: "財務健康指數" },
  { key: "trend", label: "收支趨勢圖" },
  { key: "pie", label: "本月支出圓餅圖" },
  { key: "forecast", label: "結餘預測" },
  { key: "ai", label: "AI 智能分析" },
];

// 計算預算週期（支援跨年）
function getBudgetPeriod(today, resetDay = 1) {
  if (today.date() >= resetDay) {
    // 本月 resetDay ~ 下月 resetDay-1
    const periodStart = today.date(resetDay);
    const periodEnd = today.add(1, "month").date(resetDay).subtract(1, "day");
    return { periodStart, periodEnd };
  } else {
    // 上月 resetDay ~ 本月 resetDay-1
    const periodStart = today.subtract(1, "month").date(resetDay);
    const periodEnd = today.date(resetDay).subtract(1, "day");
    return { periodStart, periodEnd };
  }
}

// 計算單一預算的已用金額（支援主幣種轉換）
function getBudgetExpense(budget, txList, mainCurrency, exchangeRates) {
  const start = dayjs(`${budget.year}-${String(budget.month).padStart(2, "0")}-${String(budget.resetDay || 1).padStart(2, "0")}`);
  const end = start.add(1, "month").subtract(1, "day");
  return txList
    .filter(
      (tx) =>
        tx.type === "expense" &&
        tx.categoryId === budget.categoryId &&
        dayjs(tx.date).isBetween(start, end, null, "[]")
    )
    .reduce(
      (sum, tx) =>
        sum +
        (tx.currency === mainCurrency
          ? Number(tx.amount)
          : (Number(tx.amount) * (exchangeRates[mainCurrency] || 1) / (exchangeRates[tx.currency] || 1))
        ),
      0
    );
}

export default function DashboardPage() {
  const { accounts, transactions, budgets, categories, settings, exchangeRates } = useFinanceStore();
  const toast = useToastStore((s) => s.addToast);
  const defaultCurrency = settings.defaultCurrency || "HKD";
  const today = dayjs();
  const currentMonth = today.month() + 1;
  const currentYear = today.year();

  // 儀表板可顯示的小工具
  const [widgets, setWidgets] = useState(
    () => JSON.parse(localStorage.getItem("widgets") || "null") ||
    { assets: true, today: true, budget: true, trend: true, pie: true, recent: true, health: true }
  );
  useEffect(() => {
    localStorage.setItem("widgets", JSON.stringify(widgets));
  }, [widgets]);

  // 取本月預算週期設定
  const currentMonthBudgets = budgets.filter(b => b.year === currentYear && b.month === currentMonth);
  const previewMonthBudgets = budgets.filter(b => dayjs(`${b.year}-${b.month}-01`) > today);
  const sampleBudget = currentMonthBudgets[0] || previewMonthBudgets[0];
  const resetDay = sampleBudget?.resetDay || 1;
  const { periodStart, periodEnd } = getBudgetPeriod(today, resetDay);

  // 本期所有預算（以起始日為依據）
  const budgetsThisPeriod = budgets.filter(b => {
    const thisBudgetStart = dayjs(`${b.year}-${String(b.month).padStart(2, "0")}-${String(b.resetDay || 1).padStart(2, "0")}`);
    return thisBudgetStart.isSame(periodStart, "day");
  });

  // 計算每項預算的已用金額
  const budgetsWithUsed = budgetsThisPeriod.map(budget => {
    const used = getBudgetExpense(budget, transactions, defaultCurrency, exchangeRates);
    return { ...budget, used };
  });

  // 總預算與總已用
  const budgetTotal = budgetsWithUsed.reduce((sum, b) => sum + Number(b.amount), 0);
  const budgetsUsed = budgetsWithUsed.reduce((sum, b) => sum + Number(b.used), 0);
  const remainingBudget = budgetTotal - budgetsUsed;
  const daysLeft = periodEnd.diff(today, "day") + 1;
  const dailyBudget = daysLeft > 0 ? remainingBudget / daysLeft : 0;

  // 今日交易
  const todayTx = useMemo(() =>
    transactions
      .filter(tx => dayjs(tx.date).isSame(today, "day"))
      .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
      .slice(0, 3)
    , [transactions, today]);

  // 財務基本數據
  const monthIncome = transactions.filter(
    tx => tx.type === "income" && dayjs(tx.date).month() + 1 === currentMonth && dayjs(tx.date).year() === currentYear
  ).reduce((s, tx) => s + Number(tx.amount), 0);
  const monthExpense = transactions.filter(
    tx => tx.type === "expense" && dayjs(tx.date).month() + 1 === currentMonth && dayjs(tx.date).year() === currentYear
  ).reduce((s, tx) => s + Number(tx.amount), 0);

  // 資產計算
  const totalAssets = accounts.reduce(
    (sum, acc) =>
      sum +
      (acc.currency === defaultCurrency
        ? Number(acc.balance)
        : (Number(acc.balance) * (exchangeRates[defaultCurrency] || 1) / (exchangeRates[acc.currency] || 1))
      ),
    0
  );

  // 收支趨勢圖資料（近6月）
  const months = Array.from({ length: 6 }, (_, i) => dayjs().subtract(5 - i, "month").format("YYYY-MM"));
  const trendStats = months.map(m => {
    const txs = transactions.filter(tx => tx.date && tx.date.startsWith(m));
    const income = txs.filter(tx => tx.type === "income").reduce((s, tx) => s + Number(tx.amount), 0);
    const expense = txs.filter(tx => tx.type === "expense").reduce((s, tx) => s + Number(tx.amount), 0);
    return { month: m, income, expense, balance: income - expense };
  });

  // 本月支出圓餅圖
  const monthExpenseTx = transactions.filter(
    tx => tx.type === "expense" && dayjs(tx.date).month() + 1 === currentMonth && dayjs(tx.date).year() === currentYear
  );
  const expenseByCategory = {};
  monthExpenseTx.forEach(tx => {
    const cat = categories.find(c => c.id === tx.categoryId);
    if (!cat) return;
    if (!expenseByCategory[cat.name]) expenseByCategory[cat.name] = { sum: 0, color: cat.color };
    expenseByCategory[cat.name].sum += Number(tx.amount);
  });

  // ===== 超級強化財務健康指數 =====
  // 1. 預算執行率（30分）
  const budgetScore = (() => {
    if (budgetTotal === 0) return 30; // 無預算視為滿分
    const ratio = budgetsUsed / budgetTotal;
    if (ratio <= 1) return 30 - Math.round((ratio - 0.7) * 30);
    return Math.max(10, 30 - (ratio - 1) * 60);
  })();

  // 2. 儲蓄率（20分）
  const savingsRate = monthIncome > 0 ? ((monthIncome - monthExpense) / monthIncome) : 0;
  const savingsScore = Math.max(0, Math.min(20, Math.round(savingsRate * 20)));

  // 3. 資產增長（15分）
  const lastMonthAssets = totalAssets - (monthIncome - monthExpense);
  const assetGrowth = (totalAssets - lastMonthAssets) / (lastMonthAssets || 1);
  const assetScore = assetGrowth >= 0 ? Math.min(15, Math.round(assetGrowth * 30)) : 0;

  // 4. 現金流穩定度（15分）
  const positiveMonths = trendStats.filter(t => t.balance >= 0).length;
  const cashFlowScore = Math.round((positiveMonths / trendStats.length) * 15);

  // 5. 超支警示（10分）
  const overBudgetCount = budgetsWithUsed.filter(b => b.used > b.amount).length;
  const overBudgetScore = overBudgetCount === 0 ? 10 : Math.max(0, 10 - overBudgetCount * 3);

  // 6. 支出異常（10分）
  let warningScore = 10;
  for (const cat of categories) {
    const sums = months.slice(0, -1).map(m =>
      transactions.filter(tx => tx.type === "expense" && tx.categoryId === cat.id && tx.date.startsWith(m))
        .reduce((sum, tx) => sum + Number(tx.amount), 0)
    );
    const avg = sums.reduce((a, b) => a + b, 0) / (sums.length || 1);
    const thisMonth = monthExpenseTx.filter(tx => tx.categoryId === cat.id).reduce((a, b) => a + Number(b.amount), 0);
    if (avg > 0 && thisMonth > avg * 1.5) warningScore -= 3;
  }
  warningScore = Math.max(0, warningScore);

  const healthScore = Math.max(0, Math.min(100, Math.round(
    budgetScore + savingsScore + assetScore + cashFlowScore + overBudgetScore + warningScore
  )));

  // 預算提醒
  useEffect(() => {
    if (budgetTotal > 0 && budgetsUsed / budgetTotal >= 0.8) {
      toast("⚠️ 本期預算已達 80%，請注意控管支出", "warning");
    }
  }, [budgetTotal, budgetsUsed, toast]);

  return (
    <div>
      {/* 每日可用預算卡片 */}
      <div className="card">
        <div className="card-header">每日可用預算（至下次預算重設）</div>
        <div className="card-body">
          {budgetTotal === 0 ? (
            <div className="empty-message">尚未設定預算</div>
          ) : (
            <>
              <div>本期預算：{formatCurrency(budgetTotal, defaultCurrency)}</div>
              <div>已用：{formatCurrency(budgetsUsed, defaultCurrency)}</div>
              <div>剩餘預算：{formatCurrency(remainingBudget, defaultCurrency)}</div>
              <div>距離下次預算重設：{daysLeft} 天（{periodEnd.format("YYYY-MM-DD")}）</div>
              <div style={{ fontWeight: 700, color: "#2563eb", fontSize: 20 }}>
                每天可用：約 {formatCurrency(dailyBudget, defaultCurrency)}
              </div>
              <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>
                （本期起訖日：{periodStart.format("YYYY-MM-DD")} ~ {periodEnd.format("YYYY-MM-DD")}，每月{resetDay}號重設）
              </div>
            </>
          )}
        </div>
      </div>

      {/* 預算狀態（每一項預算細節） */}
      {widgets.budget && (
        <div className="card">
          <div className="card-header">預算狀態</div>
          <div className="card-body">
            {budgetsWithUsed.length === 0 ? (
              <div className="empty-message">尚未設定預算</div>
            ) : (
              <div>
                {budgetsWithUsed.map(b =>
                  <div key={b.id} style={{marginBottom:8}}>
                    <b>{categories.find(c=>c.id===b.categoryId)?.name || "未分類"}</b>
                    ：{formatCurrency(b.used, defaultCurrency)} / {formatCurrency(b.amount, defaultCurrency)}
                    （{Math.round((b.used / b.amount) * 100)}%）
                    {b.used > b.amount && <span style={{color:"#e74c3c"}}>（超支！）</span>}
                  </div>
                )}
                <div style={{ background: "#e0e7ef", borderRadius: 6, height: 10, overflow: "hidden", margin: "10px 0" }}>
                  <div style={{
                    width: Math.min(100, Math.floor((budgetsUsed / budgetTotal) * 100)) + '%',
                    height: "100%",
                    background: budgetsUsed / budgetTotal >= 0.8 ? "#e74c3c" : "#3498db"
                  }}></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 今日交易 */}
      {widgets.today && (
        <div className="card">
          <div className="card-header">今日交易</div>
          <div className="card-body">
            {todayTx.length === 0 ? (
              <div className="empty-message">今日尚無交易記錄</div>
            ) : (
              todayTx.map(tx => {
                const cat = categories.find(c => c.id === tx.categoryId);
                const acc = accounts?.find(a => a.id === tx.accountId);
                return (
                  <TransactionCard
                    key={tx.id}
                    tx={tx}
                    category={cat}
                    account={acc}
                  />
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 超級強化財務健康指數 */}
      {widgets.health && (
        <div className="card">
          <div className="card-header">超級財務健康指數</div>
          <div className="card-body">
            <div style={{ fontSize: 40, fontWeight: "bold", color: "#2563eb" }}>{healthScore}分</div>
            <ul style={{ fontSize: 15 }}>
              <li>預算執行率：{Math.round(budgetScore)}/30</li>
              <li>儲蓄率：{Math.round(savingsScore)}/20</li>
              <li>資產增長：{Math.round(assetScore)}/15</li>
              <li>現金流穩定度：{Math.round(cashFlowScore)}/15</li>
              <li>超支警示：{Math.round(overBudgetScore)}/10</li>
              <li>支出異常：{Math.round(warningScore)}/10</li>
            </ul>
            <div style={{ color: "#888", fontSize: 13, marginTop: 4 }}>
              指數依據多個財務維度綜合計算（預算、儲蓄、資產、現金流、異常），分數越高代表財務越健康。
            </div>
            <div style={{ color: "#888", fontSize: 14, marginTop: 4 }}>
              <b>
                {healthScore >= 90 && "極健康，財務極強壯！"}
                {healthScore >= 70 && healthScore < 90 && "健康良好，繼續保持！"}
                {healthScore >= 50 && healthScore < 70 && "普通，建議檢討支出與儲蓄。"}
                {healthScore >= 30 && healthScore < 50 && "偏弱，注意預算與現金流。"}
                {healthScore < 30 && "高風險，需加強財務管理！"}
              </b>
            </div>
          </div>
        </div>
      )}

      {/* 收支趨勢圖 */}
      {widgets.trend && (
        <div className="card">
          <div className="card-header">收支趨勢圖（近6月）</div>
          <div className="card-body">
            <Line
              data={{
                labels: trendStats.map(t => t.month),
                datasets: [
                  {
                    label: "收入",
                    data: trendStats.map(t => t.income),
                    borderColor: "#2ecc71",
                    backgroundColor: "rgba(46,204,113,0.2)",
                  },
                  {
                    label: "支出",
                    data: trendStats.map(t => t.expense),
                    borderColor: "#e74c3c",
                    backgroundColor: "rgba(231,76,60,0.2)",
                  },
                  {
                    label: "結餘",
                    data: trendStats.map(t => t.balance),
                    borderColor: "#2563eb",
                    backgroundColor: "rgba(37,99,235,0.15)",
                  }
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: true },
                  tooltip: { enabled: true },
                },
                scales: {
                  y: { beginAtZero: true }
                }
              }}
              height={220}
            />
          </div>
        </div>
      )}

      {/* 支出圓餅圖 */}
      {widgets.pie && (
        <div className="card">
          <div className="card-header">本月支出分類分布</div>
          <div className="card-body">
            {Object.keys(expenseByCategory).length === 0 ? (
              <div className="empty-message">本月尚無支出</div>
            ) : (
              <Doughnut
                data={{
                  labels: Object.keys(expenseByCategory),
                  datasets: [
                    {
                      data: Object.values(expenseByCategory).map((d) => d.sum),
                      backgroundColor: Object.values(expenseByCategory).map((d) => d.color),
                    },
                  ],
                }}
                options={{
                  plugins: {
                    legend: { position: "bottom" },
                    tooltip: {
                      callbacks: {
                        label: function (context) {
                          return `${context.label}: ${formatCurrency(context.parsed, defaultCurrency)}`;
                        }
                      }
                    }
                  }
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* 結餘預測與 AI 分析 */}
      {widgets.forecast && <BalanceForecastWidget />}
      {widgets.ai && <AnalyticsAIWidget />}

      {/* 小工具自訂 */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header" style={{ display: "flex", justifyContent: "space-between" }}>
          儀表板顯示小工具
          <div>
            {WIDGETS.map(w => (
              <label key={w.key} style={{ marginRight: 12, fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={widgets[w.key]}
                  onChange={e => setWidgets(ws => ({ ...ws, [w.key]: e.target.checked }))}
                  style={{ marginRight: 4 }}
                />
                {w.label}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}