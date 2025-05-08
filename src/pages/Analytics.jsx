import React, { useState } from "react";
import { useFinanceStore } from "../store/financeStore";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(isBetween);

import Calendar from "../components/Calendar";
import { formatCurrency } from "../utils/format";
import TransactionCard from "../components/TransactionCard";

import { Line } from "react-chartjs-2";

// 工具
function getMonthList(from, to) {
  const list = [];
  let d = from.startOf("month");
  while (d.isBefore(to, "month") || d.isSame(to, "month")) {
    list.push(d.format("YYYY-MM"));
    d = d.add(1, "month");
  }
  return list;
}
function getRecentMonths(n = 12) {
  const now = dayjs();
  const arr = [];
  for (let i = n - 1; i >= 0; i--) {
    arr.push(now.subtract(i, "month").format("YYYY-MM"));
  }
  return arr;
}

export default function AnalyticsPage() {
  const { transactions, categories, accounts, settings } = useFinanceStore();
  const defaultCurrency = settings.defaultCurrency || "HKD";
  const [selectedDate, setSelectedDate] = useState(null);

  // 1. 交易日曆
  const now = dayjs();
  const monthStart = now.startOf("month");
  const monthEnd = now.endOf("month");
  const thisMonthTxs = transactions.filter(tx =>
    dayjs(tx.date).isBetween(monthStart, monthEnd, null, "[]")
  );

  // 2. 本月收支
  const monthIncome = thisMonthTxs.filter(tx => tx.type === "income").reduce((s, tx) => s + Number(tx.amount), 0);
  const monthExpense = thisMonthTxs.filter(tx => tx.type === "expense").reduce((s, tx) => s + Number(tx.amount), 0);

  // 3. 支出類別分布
  const expenseByCategory = {};
  thisMonthTxs.filter(tx => tx.type === "expense").forEach(tx => {
    const cid = tx.categoryId || "uncat";
    if (!expenseByCategory[cid]) expenseByCategory[cid] = 0;
    expenseByCategory[cid] += Number(tx.amount);
  });

  // 4. 當日交易
  const dayTxs = selectedDate
    ? transactions.filter(tx => tx.date === selectedDate.format("YYYY-MM-DD"))
    : [];

  // 5. 長期趨勢分析
  const months = getRecentMonths(12);
  const monthlyStats = months.map(m => {
    const txs = transactions.filter(tx => tx.date && tx.date.startsWith(m));
    const income = txs.filter(tx => tx.type === "income").reduce((s, tx) => s + Number(tx.amount), 0);
    const expense = txs.filter(tx => tx.type === "expense").reduce((s, tx) => s + Number(tx.amount), 0);
    return { month: m, income, expense, balance: income - expense };
  });

  // 6. 支出組成變化（堆疊條）
  const allCats = categories.length
    ? categories
    : [{ id: "uncat", name: "未分類" }];
  const monthlyCategoryStack = months.map(m => {
    const txs = transactions.filter(tx => tx.date && tx.date.startsWith(m) && tx.type === "expense");
    const byCat = {};
    allCats.forEach(cat => (byCat[cat.id] = 0));
    txs.forEach(tx => {
      const cid = tx.categoryId || "uncat";
      byCat[cid] = (byCat[cid] || 0) + Number(tx.amount);
    });
    return { month: m, ...byCat };
  });

  // 7. 支出排行榜
  const expenseRank = thisMonthTxs
    .filter(tx => tx.type === "expense")
    .map(tx => ({
      ...tx,
      category: categories.find(c => c.id === tx.categoryId)
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // 8. 高頻消費排行榜
  const noteCount = {};
  thisMonthTxs
    .filter(tx => tx.type === "expense" && tx.note)
    .forEach(tx => {
      noteCount[tx.note] = (noteCount[tx.note] || 0) + 1;
    });
  const highFreqNotes = Object.entries(noteCount)
    .sort((a, b) => b[1] - a[1])
    .filter(([note, count]) => count > 1)
    .slice(0, 5);

  // 9. 預算預警
  // 假設你有 budgets 這個 store
  // 可根據預算進度和本月消費速度預測超支
  // 這裡僅給出進度條和警示

  // 10. 儲蓄率與財富累積率
  const savingsRate = monthIncome > 0 ? ((monthIncome - monthExpense) / monthIncome) : 0;

  // 11. 現金流分析（每月結餘）
  // 用上面 monthlyStats

  // 12. 週期性支出偵測（找出備註/類別重複的支出）
  const recurring = {};
  transactions
    .filter(tx => tx.type === "expense" && tx.note)
    .forEach(tx => {
      recurring[tx.note] = recurring[tx.note] || [];
      recurring[tx.note].push(tx.date);
    });
  const recurringItems = Object.entries(recurring)
    .filter(([note, dates]) => dates.length >= 3)
    .slice(0, 5);

  // 13. 異常消費偵測（本月某類消費比過去12月平均高出50%）
  const categoryWarning = [];
  allCats.forEach(cat => {
    const sumPrev = months
      .slice(0, -1)
      .reduce((s, m) => {
        const txs = transactions.filter(tx => tx.date && tx.date.startsWith(m) && tx.type === "expense" && (tx.categoryId || "uncat") === cat.id);
        return s + txs.reduce((s2, tx) => s2 + Number(tx.amount), 0);
      }, 0);
    const avgPrev = sumPrev / (months.length - 1 || 1);
    const thisMonth = expenseByCategory[cat.id] || 0;
    if (avgPrev > 0 && thisMonth > avgPrev * 1.5) {
      categoryWarning.push({ cat: cat.name, avg: avgPrev, now: thisMonth });
    }
  });

  // 14. 年度分析
  const years = Array.from(
    new Set(transactions.map(tx => tx.date?.slice(0, 4)).filter(Boolean))
  );
  const yearStats = years.map(y => {
    const txs = transactions.filter(tx => tx.date && tx.date.startsWith(y));
    const income = txs.filter(tx => tx.type === "income").reduce((s, tx) => s + Number(tx.amount), 0);
    const expense = txs.filter(tx => tx.type === "expense").reduce((s, tx) => s + Number(tx.amount), 0);
    return { year: y, income, expense, balance: income - expense };
  });

  // 15. 資產結構
  const assetsByAccount = accounts.map(acc => ({
    name: acc.name,
    amount: Number(acc.balance),
    currency: acc.currency,
  }));

  // 取得本月每日收支統計
const daysInMonth = now.daysInMonth();
const dailyStats = Array.from({ length: daysInMonth }, (_, i) => {
  const date = now.startOf("month").add(i, "day").format("YYYY-MM-DD");
  const txs = transactions.filter(tx => tx.date === date);
  const income = txs.filter(tx => tx.type === "income").reduce((s, tx) => s + Number(tx.amount), 0);
  const expense = txs.filter(tx => tx.type === "expense").reduce((s, tx) => s + Number(tx.amount), 0);
  return { date, income, expense, balance: income - expense };
});

  return (
    <div>
      {/* 1. 交易日曆 */}
      <div className="card">
        <div className="card-header">交易日曆</div>
        <div className="card-body">
          <Calendar
            value={selectedDate || now}
            onChange={setSelectedDate}
            renderDaySummary={dateObj => {
              const txs = transactions.filter(
                tx => tx.date === dateObj.format("YYYY-MM-DD")
              );
              if (!txs.length) return null;
              const income = txs.filter(tx => tx.type === "income").reduce((s, tx) => s + Number(tx.amount), 0);
              const expense = txs.filter(tx => tx.type === "expense").reduce((s, tx) => s + Number(tx.amount), 0);
              return (
                <div className="date-summary">
                  {income > 0 && <div className="income">+{formatCurrency(income, defaultCurrency)}</div>}
                  {expense > 0 && <div className="expense">-{formatCurrency(expense, defaultCurrency)}</div>}
                </div>
              );
            }}
          />
          {/* 選擇某天，彈窗顯示該日交易 */}
          {selectedDate && (
            <div className="modal active" onClick={() => setSelectedDate(null)}>
              <div
                className="modal-content"
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: 400 }}
              >
                <div className="modal-header">
                  <h3>{selectedDate.format("YYYY-MM-DD")} 交易記錄</h3>
                  <button className="close-button" onClick={() => setSelectedDate(null)}>×</button>
                </div>
                <div className="modal-body">
                  {dayTxs.length === 0 ? (
                    <div className="empty-message">當日無交易</div>
                  ) : (
                    dayTxs.map(tx => {
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
            </div>
          )}
        </div>
      </div>

      {/* 2. 本月收支摘要 */}
      <div className="card">
        <div className="card-header">本月收支摘要</div>
        <div className="card-body" style={{ display: "flex", gap: 24 }}>
          <div>
            <div style={{ fontSize: 13, color: "#888" }}>收入</div>
            <div style={{ color: "#2ecc71", fontSize: 22, fontWeight: 700 }}>
              {formatCurrency(monthIncome, defaultCurrency)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: "#888" }}>支出</div>
            <div style={{ color: "#e74c3c", fontSize: 22, fontWeight: 700 }}>
              {formatCurrency(monthExpense, defaultCurrency)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: "#888" }}>結餘</div>
            <div style={{
              color: monthIncome - monthExpense >= 0 ? "#2ecc71" : "#e74c3c",
              fontSize: 22,
              fontWeight: 700
            }}>
              {formatCurrency(monthIncome - monthExpense, defaultCurrency)}
            </div>
          </div>
        </div>
      </div>

      {/* 3. 支出類別分布 */}
      <div className="card">
        <div className="card-header">本月支出類別分布</div>
        <div className="card-body">
          {Object.keys(expenseByCategory).length === 0 ? (
            <div className="empty-message">本月尚無支出</div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {Object.entries(expenseByCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([cid, amt]) => {
                  const cat = categories.find(c => c.id === cid);
                  return (
                    <li key={cid} style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "6px 0",
                      borderBottom: "1px solid #eee"
                    }}>
                      <div>
                        <span style={{
                          display: "inline-block",
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: "#3498db",
                          marginRight: 8
                        }}></span>
                        {cat?.name || "未分類"}
                      </div>
                      <div style={{ fontWeight: 600 }}>{formatCurrency(amt, defaultCurrency)}</div>
                    </li>
                  );
                })}
            </ul>
          )}
        </div>
      </div>

      {/* 4. 長期趨勢分析 */}
      <div className="card">
        <div className="card-header">收支長期趨勢（近12月）</div>
        <div className="card-body">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 13 }}>
              <thead>
                <tr>
                  <th>月份</th>
                  <th>收入</th>
                  <th>支出</th>
                  <th>結餘</th>
                </tr>
              </thead>
              <tbody>
                {monthlyStats.map(stat => (
                  <tr key={stat.month}>
                    <td>{stat.month}</td>
                    <td style={{ color: "#2ecc71" }}>{formatCurrency(stat.income, defaultCurrency)}</td>
                    <td style={{ color: "#e74c3c" }}>{formatCurrency(stat.expense, defaultCurrency)}</td>
                    <td style={{
                      color: stat.balance >= 0 ? "#2ecc71" : "#e74c3c",
                      fontWeight: 600
                    }}>{formatCurrency(stat.balance, defaultCurrency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. 支出組成變化（堆疊條） */}
      <div className="card">
        <div className="card-header">月度支出組成變化</div>
        <div className="card-body">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 12 }}>
              <thead>
                <tr>
                  <th>月份</th>
                  {allCats.map(cat => (
                    <th key={cat.id}>{cat.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthlyCategoryStack.map(row => (
                  <tr key={row.month}>
                    <td>{row.month}</td>
                    {allCats.map(cat => (
                      <td key={cat.id} style={{ color: "#e74c3c" }}>
                        {formatCurrency(row[cat.id], defaultCurrency)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 6. 高額支出排行榜（現代化卡片） */}
      <div className="card">
        <div className="card-header">本月高額支出排行榜</div>
        <div className="card-body">
          {expenseRank.length === 0 ? (
            <div className="empty-message">本月無支出</div>
          ) : (
            <div>
              {expenseRank.map((tx, idx) => (
                <TransactionCard
                  key={tx.id || idx}
                  tx={tx}
                  category={tx.category}
                  account={accounts.find(a => a.id === tx.accountId)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 7. 高頻消費排行榜 */}
      <div className="card">
        <div className="card-header">本月高頻消費(同備註)</div>
        <div className="card-body">
          {highFreqNotes.length === 0 ? (
            <div className="empty-message">無高頻消費紀錄</div>
          ) : (
            <ul>
              {highFreqNotes.map(([note, count], idx) => (
                <li key={idx} style={{ fontSize: 14 }}>
                  <b>{note}</b> 出現 {count} 次
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 8. 儲蓄率/財富累積率 */}
      <div className="card">
        <div className="card-header">本月儲蓄率與財富累積率</div>
        <div className="card-body">
          <div style={{ fontWeight: 600 }}>
            儲蓄率（結餘/收入）：{(savingsRate * 100).toFixed(1)}%
          </div>
          <div style={{ color: "#888", fontSize: 13, marginTop: 4 }}>
            （儲蓄率越高代表每月結餘越多）
          </div>
        </div>
      </div>

      {/* 9. 現金流（近12月結餘） */}
      <div className="card">
        <div className="card-header">現金流趨勢</div>
        <div className="card-body">
          <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
            {monthlyStats.map(stat => (
              <div key={stat.month} style={{
                minWidth: 65,
                textAlign: "center"
              }}>
                <div style={{
                  fontWeight: 600,
                  color: stat.balance >= 0 ? "#2ecc71" : "#e74c3c"
                }}>{formatCurrency(stat.balance, defaultCurrency)}</div>
                <div style={{ fontSize: 11, color: "#888" }}>{stat.month}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 10. 週期性支出偵測 */}
      <div className="card">
        <div className="card-header">週期性支出偵測</div>
        <div className="card-body">
          {recurringItems.length === 0 ? (
            <div className="empty-message">暫未偵測到重複多次的週期性支出（以備註為判斷）</div>
          ) : (
            <ul>
              {recurringItems.map(([note, dates], idx) => (
                <li key={idx}>
                  <b>{note}</b> 出現 {dates.length} 次，最近：{dates.slice(-3).join(", ")}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 11. 消費異常警示 */}
      <div className="card">
        <div className="card-header">異常消費警示</div>
        <div className="card-body">
          {categoryWarning.length === 0 ? (
            <div className="empty-message">本月無明顯異常消費類別</div>
          ) : (
            <ul>
              {categoryWarning.map((item, idx) => (
                <li key={idx} style={{ color: "#f39c12", fontWeight: 600 }}>
                  {item.cat} 本月支出 {formatCurrency(item.now, defaultCurrency)}，已高於過去平均 {formatCurrency(item.avg, defaultCurrency)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 12. 年度/季節性分析 */}
      <div className="card">
        <div className="card-header">年度收支分析</div>
        <div className="card-body">
          <table style={{ width: "100%", fontSize: 13 }}>
            <thead>
              <tr>
                <th>年度</th>
                <th>收入</th>
                <th>支出</th>
                <th>結餘</th>
              </tr>
            </thead>
            <tbody>
              {yearStats.map(stat => (
                <tr key={stat.year}>
                  <td>{stat.year}</td>
                  <td style={{ color: "#2ecc71" }}>{formatCurrency(stat.income, defaultCurrency)}</td>
                  <td style={{ color: "#e74c3c" }}>{formatCurrency(stat.expense, defaultCurrency)}</td>
                  <td style={{
                    color: stat.balance >= 0 ? "#2ecc71" : "#e74c3c",
                    fontWeight: 600
                  }}>{formatCurrency(stat.balance, defaultCurrency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 13. 資產結構分析 */}
      <div className="card">
        <div className="card-header">資產結構分布</div>
        <div className="card-body">
          <ul>
            {assetsByAccount.map((acc, idx) => (
              <li key={idx}>
                <b>{acc.name}</b>：{formatCurrency(acc.amount, acc.currency)}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="card">
  <div className="card-header">本月每日收支趨勢</div>
  <div className="card-body">
    <Line
      data={{
        labels: dailyStats.map(d => parseInt(d.date.slice(-2), 10)),
        datasets: [
          {
            label: "收入",
            data: dailyStats.map(d => d.income),
            borderColor: "#2ecc71",
            backgroundColor: "rgba(46,204,113,0.15)",
          },
          {
            label: "支出",
            data: dailyStats.map(d => d.expense),
            borderColor: "#e74c3c",
            backgroundColor: "rgba(231,76,60,0.13)",
          }
        ],
      }}
      options={{
        responsive: true,
        plugins: { legend: { display: true } },
        scales: { y: { beginAtZero: true } },
      }}
      height={180}
    />
  </div>
</div>
    </div>
  );
}