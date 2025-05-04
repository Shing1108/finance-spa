import { useFinanceStore } from "../store/financeStore";
import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "../utils/format";
import dayjs from "dayjs";
import TransactionCard from "../components/TransactionCard";
import { Line, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, ArcElement, Tooltip, Legend } from "chart.js";
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

export default function DashboardPage() {
  const { accounts, transactions, budgets, categories, settings, exchangeRates } = useFinanceStore();
  const toast = useToastStore((s) => s.addToast);
  const defaultCurrency = settings.defaultCurrency || "HKD";
  const today = dayjs();
  const currentMonth = today.month() + 1;
  const currentYear = today.year();

  // 小工具顯示狀態
  const [widgets, setWidgets] = useState(
    () => JSON.parse(localStorage.getItem("widgets") || "null") ||
    { assets: true, today: true, budget: true, trend: true, pie: true, recent: true, health: true }
  );
  useEffect(() => {
    localStorage.setItem("widgets", JSON.stringify(widgets));
  }, [widgets]);

  // ====== 預算週期與剩餘天數計算 ======
  // 取本月所有預算（可跨月，預設用第一筆 resetDay 作為本月週期起點）
  const currentMonthBudgets = budgets.filter(b => b.year === currentYear && b.month === currentMonth);
  // 若本月沒設定預算，則找下一筆未來預算
  const previewMonthBudgets = budgets.filter(b => dayjs(`${b.year}-${b.month}-01`) > today);
  const sampleBudget = currentMonthBudgets[0] || previewMonthBudgets[0];

  const resetDay = sampleBudget?.resetDay || 1;
  // 決定本期預算起迄（預設每月 resetDay ~ 下月 resetDay-1）
  let periodStart, periodEnd;
  if (today.date() >= resetDay) {
    periodStart = today.date(resetDay);
    periodEnd = today.add(1, "month").date(resetDay).subtract(1, "day");
  } else {
    periodStart = today.subtract(1, "month").date(resetDay);
    periodEnd = today.date(resetDay).subtract(1, "day");
  }

  // 找出本期所有預算
  const budgetsThisPeriod = budgets.filter(b => {
    const thisBudgetStart = dayjs(`${b.year}-${String(b.month).padStart(2, "0")}-${String(b.resetDay || 1).padStart(2, "0")}`);
    // 預算起始日落在本期起訖
    return thisBudgetStart.isSame(periodStart, "day");
  });

  const budgetTotal = budgetsThisPeriod.reduce((sum, b) => sum + Number(b.amount), 0);

  // 已用預算計算
  const budgetsUsed = budgetsThisPeriod.reduce((sum, b) => {
    const expense = transactions.filter(
      tx => tx.type === "expense" &&
      tx.categoryId === b.categoryId &&
      dayjs(tx.date).isBetween(periodStart, periodEnd, null, "[]")
    ).reduce((s, tx) => s + Number(tx.amount), 0);
    return sum + expense;
  }, 0);

  const remainingBudget = budgetTotal - budgetsUsed;
  const daysLeft = periodEnd.diff(today, "day") + 1;
  const dailyBudget = daysLeft > 0 ? remainingBudget / daysLeft : 0;

  // ======= 其他原本邏輯 =======

  // 今日交易
  const todayTx = useMemo(() => 
    transactions
      .filter(tx => dayjs(tx.date).isSame(today, "day"))
      .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
      .slice(0, 3)
  , [transactions, today]);

  // 財務健康指數（簡化版）
  const monthIncome = transactions.filter(
    tx => tx.type === "income" && dayjs(tx.date).month() + 1 === currentMonth && dayjs(tx.date).year() === currentYear
  ).reduce((s, tx) => s + Number(tx.amount), 0);
  const monthExpense = transactions.filter(
    tx => tx.type === "expense" && dayjs(tx.date).month() + 1 === currentMonth && dayjs(tx.date).year() === currentYear
  ).reduce((s, tx) => s + Number(tx.amount), 0);
  const savingsRate = monthIncome > 0 ? ((monthIncome - monthExpense) / monthIncome) : 0;
  const budgetPerformance = budgetTotal > 0 ? (budgetsUsed / budgetTotal) : 1;
  const healthScore = Math.round(
    Math.max(0, Math.min(1, savingsRate)) * 60 +
    (1 - Math.abs(1 - budgetPerformance)) * 40
  );

  // 智能預算提醒
  useEffect(() => {
    if (budgetTotal > 0 && budgetsUsed / budgetTotal >= 0.8) {
      toast("⚠️ 本期預算已達 80%，請注意控管支出", "warning");
    }
  }, [budgetTotal, budgetsUsed, toast]);

  // 收支趨勢圖資料
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

  return (
    <div>
      {/* 新增平均每日可用預算卡片 */}
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

      {/* 預算狀態 */}
      {widgets.budget && (
        <div className="card">
          <div className="card-header">預算狀態</div>
          <div className="card-body">
            {budgetTotal === 0 ? (
              <div className="empty-message">尚未設定預算</div>
            ) : (
              <div>
                <div>本月預算：{formatCurrency(budgetTotal, defaultCurrency)}</div>
                <div>已用：{formatCurrency(budgetsUsed, defaultCurrency)}</div>
                <div>剩餘：{formatCurrency(remainingBudget, defaultCurrency)}</div>
                <div style={{ background: "#e0e7ef", borderRadius: 6, height: 10, overflow: "hidden", margin: "6px 0" }}>
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

            {/* 財務健康指數 */}
            {widgets.health && (
        <div className="card">
          <div className="card-header">財務健康指數</div>
          <div className="card-body">
            <div style={{ fontSize: 38, fontWeight: "bold", color: "#2563eb" }}>{healthScore}%</div>
            <div style={{ fontSize: 15 }}>
              {healthScore >= 85 && "優秀！持續保持良好儲蓄與資產配置。"}
              {healthScore >= 70 && healthScore < 85 && "良好，持續優化支出與儲蓄。"}
              {healthScore >= 50 && healthScore < 70 && "普通，建議檢視支出，增加儲蓄。"}
              {healthScore < 50 && "請加強支出控制與儲蓄，避免財務風險。"}
            </div>
            <div style={{ marginTop: 10, color: "#888", fontSize: 13 }}>
              <b>計算方式：</b><br />
              儲蓄率(60%) + 預算執行率(40%)<br />
              儲蓄率 = (本月收入-支出)/收入；預算執行率 = 1-abs(本月已用/預算-1)
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