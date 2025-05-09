import { useFinanceStore } from "../store/financeStore";
import { useDayManagerStore } from "../store/dayManagerStore";
import { Doughnut, Line } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale } from "chart.js";
import dayjs from "dayjs";
import { formatCurrency } from "../utils/format";
ChartJS.register(ArcElement, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale);

function toMainCurrency(amount, currency, mainCurrency, exchangeRates) {
  if (currency === mainCurrency) return amount;
  const fromRate = exchangeRates[currency];
  const toRate = exchangeRates[mainCurrency];
  if (!fromRate || !toRate) return amount;
  return amount * (toRate / fromRate);
}

export default function StatisticsPage() {
  const { transactions, categories, settings, exchangeRates } = useFinanceStore();
  const currentDate = useDayManagerStore(s => s.currentDate);

  // 當月篩選
  const currentMonth = dayjs(currentDate).month() + 1;
  const currentYear = dayjs(currentDate).year();
  const mainCurrency = settings.defaultCurrency || "HKD";

  const incomeTx = transactions.filter(
    (tx) =>
      tx.type === "income" &&
      dayjs(tx.date).month() + 1 === currentMonth &&
      dayjs(tx.date).year() === currentYear
  );

  const expenseTx = transactions.filter(
    (tx) =>
      tx.type === "expense" &&
      dayjs(tx.date).month() + 1 === currentMonth &&
      dayjs(tx.date).year() === currentYear
  );

  // 按類別分組，並全部換算成主幣種
  function groupByCategory(txs) {
    const result = {};
    txs.forEach((tx) => {
      const cat = categories.find((c) => c.id === tx.categoryId);
      if (!cat) return;
      if (!result[cat.name]) result[cat.name] = { sum: 0, color: cat.color };
      result[cat.name].sum += toMainCurrency(Number(tx.amount), tx.currency ?? mainCurrency, mainCurrency, exchangeRates);
    });
    return result;
  }

  const incomeData = groupByCategory(incomeTx);
  const expenseData = groupByCategory(expenseTx);

  // 趨勢圖資料
  const months = Array.from({ length: 6 }, (_, i) => dayjs().subtract(5 - i, "month").format("YYYY-MM"));
  const trendStats = months.map((m) => {
    const txs = transactions.filter((tx) => tx.date && tx.date.startsWith(m));
    const income = txs.filter((tx) => tx.type === "income").reduce((s, tx) => s + toMainCurrency(Number(tx.amount), tx.currency ?? mainCurrency, mainCurrency, exchangeRates), 0);
    const expense = txs.filter((tx) => tx.type === "expense").reduce((s, tx) => s + toMainCurrency(Number(tx.amount), tx.currency ?? mainCurrency, mainCurrency, exchangeRates), 0);
    return { month: m, income, expense, balance: income - expense };
  });

  return (
    <div className="card">
      <div className="card-header">
        <h3>收支統計</h3>
      </div>
      <div className="card-body">
        <div className="statistics-container" style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 250 }}>
            <div className="font-bold mb-2">本月收入分佈（{mainCurrency}）</div>
            {Object.keys(incomeData).length === 0 ? (
              <div className="empty-message">本月尚無收入記錄</div>
            ) : (
              <Doughnut
                data={{
                  labels: Object.keys(incomeData),
                  datasets: [
                    {
                      data: Object.values(incomeData).map((d) => d.sum),
                      backgroundColor: Object.values(incomeData).map((d) => d.color),
                    },
                  ],
                }}
                options={{
                  plugins: {
                    legend: { position: "bottom" },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return `${context.label}: ${formatCurrency(context.parsed, mainCurrency)}`;
                        }
                      }
                    }
                  }
                }}
              />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 250 }}>
            <div className="font-bold mb-2">本月支出分佈（{mainCurrency}）</div>
            {Object.keys(expenseData).length === 0 ? (
              <div className="empty-message">本月尚無支出記錄</div>
            ) : (
              <Doughnut
                data={{
                  labels: Object.keys(expenseData),
                  datasets: [
                    {
                      data: Object.values(expenseData).map((d) => d.sum),
                      backgroundColor: Object.values(expenseData).map((d) => d.color),
                    },
                  ],
                }}
                options={{
                  plugins: {
                    legend: { position: "bottom" },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return `${context.label}: ${formatCurrency(context.parsed, mainCurrency)}`;
                        }
                      }
                    }
                  }
                }}
              />
            )}
          </div>
        </div>
        <div style={{ marginTop: 36 }}>
          <div className="font-bold mb-2">最近 6 月收支趨勢</div>
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
                legend: { display: true }
              },
              scales: { y: { beginAtZero: true } }
            }}
            height={220}
          />
        </div>
      </div>
    </div>
  );
}