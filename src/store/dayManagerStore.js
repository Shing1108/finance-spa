// src/store/dayManagerStore.js

import { create } from 'zustand';
import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
dayjs.extend(dayOfYear);

import { useFinanceStore } from './financeStore';

// ==== 理財小貼士 ====
const tips = [
  '記得每天記錄你的支出，養成良好的理財習慣',
  '設定具體的儲蓄目標可以幫助你更有動力儲蓄',
  '審視你的訂閱服務，取消不必要的訂閱可以節省不少',
  '購物前列一個清單，避免衝動購物',
  '試著在家自己煮飯，不僅健康還能省錢',
  '利用週末規劃下週的餐點，可以節省食材成本',
  '設定自動儲蓄，讓儲蓄變成習慣',
  '投資前做好功課，分散投資可以降低風險',
  '定期檢查你的保險是否足夠，但避免過度投保',
  '善用折扣季節購物，可以省下不少錢'
];
const getDailyTip = (dateStr) => {
  const date = dayjs(dateStr);
  const dayOfYear = date.dayOfYear();
  return tips[dayOfYear % tips.length];
};

// ==== LocalStorage 工具 ====
const getFromLocalStorage = (key, defaultVal) => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultVal;
  } catch { return defaultVal; }
};
const saveToLocalStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

// ==== Store ====

export const useDayManagerStore = create((set, get) => ({
  // 狀態
  currentDate: getFromLocalStorage('currentDate', dayjs().format("YYYY-MM-DD")),
  importantDates: getFromLocalStorage('importantDates', [
    { name: '小明生日', month: 5, day: 8 }
  ]),

  // 初始化
  initDayManager: () => {
    const savedDate = getFromLocalStorage('currentDate', null);
    let currentDate;
    if (savedDate) {
      currentDate = savedDate;
    } else {
      currentDate = dayjs().format("YYYY-MM-DD");
      saveToLocalStorage('currentDate', currentDate);
    }
    set({ currentDate });
    return currentDate;
  },

  // 取得今日理財小貼士
  getTodayTip: () => getDailyTip(get().currentDate),

  // 開啟新的一天
  startNewDay: () => {
    const today = dayjs().format("YYYY-MM-DD");
    if (get().currentDate === today) {
      window.alert('已經是今天了');
      return false;
    }
    if (!window.confirm('確認要開啟新的一天嗎？')) return false;

    saveToLocalStorage('currentDate', today);
    set({ currentDate: today });
    get().showYesterdaySummary();

    // 自動 recurring
    get().checkRecurring();

    // 預算檢查
    get().checkBudgets();

    // 顯示小貼士
    get().showTodayTip();

    // 檢查重要日期
    get().checkImportantDates();

    window.alert(`新的一天 (${today}) 已開始！`);
    return true;
  },

  // 檢查 recurring 並自動產生交易
  checkRecurring: () => {
    const currentDate = get().currentDate;
    const finance = useFinanceStore.getState();
    const recurringItems = finance.recurringItems || [];
    const today = dayjs(currentDate);
    const todayItems = recurringItems.filter(item => {
      if (!item.active) return false;
      switch (item.frequency) {
        case 'daily': return true;
        case 'weekly': return today.day() === (item.dayOfWeek ?? 1); // 1=週一
        case 'monthly': return today.date() === (item.dayOfMonth ?? 1);
        case 'yearly': return (today.month() + 1) === (item.month ?? 1) && today.date() === (item.dayOfMonth ?? 1);
        default: return false;
      }
    });

    // 自動記帳
    todayItems.forEach(item => {
      if (item.autoProcess) {
        finance.addTransaction({
          type: item.type,
          amount: item.amount,
          accountId: item.accountId,
          toAccountId: item.toAccountId,
          categoryId: item.categoryId,
          date: currentDate,
          note: item.note,
          createdAt: new Date().toISOString(),
        });
      }
    });

    if (todayItems.length > 0) {
      setTimeout(() => window.alert(
        "今天有週期性項目：" +
        todayItems.map(i => i.name + (i.autoProcess ? "（已自動記帳）" : "")).join('、')
      ), 100);
    }
    return todayItems;
  },

  // 預算檢查
  checkBudgets: () => {
    const finance = useFinanceStore.getState();
    const budgets = finance.budgets || [];
    const transactions = finance.transactions || [];
    const currentDate = get().currentDate;
    const currentMonth = dayjs(currentDate).month() + 1;
    const currentYear = dayjs(currentDate).year();

    // 只檢查本月支出
    const thisMonthTx = transactions.filter(tx => {
      const txDate = dayjs(tx.date);
      return txDate.month() + 1 === currentMonth && txDate.year() === currentYear && tx.type === 'expense';
    });

    // 按類別統計
    const categoryExpenses = {};
    thisMonthTx.forEach(tx => {
      if (!categoryExpenses[tx.categoryId]) categoryExpenses[tx.categoryId] = 0;
      categoryExpenses[tx.categoryId] += Number(tx.amount);
    });

    // 預算警告
    const warningThreshold = 0.8, criticalThreshold = 0.95;
    const budgetWarnings = [];
    budgets.forEach(budget => {
      if (!categoryExpenses[budget.categoryId]) return;
      const spentPct = categoryExpenses[budget.categoryId] / budget.amount;
      if (spentPct >= criticalThreshold) {
        budgetWarnings.push({ ...budget, spent: categoryExpenses[budget.categoryId], percentage: spentPct, severity: 'critical' });
      } else if (spentPct >= warningThreshold) {
        budgetWarnings.push({ ...budget, spent: categoryExpenses[budget.categoryId], percentage: spentPct, severity: 'warning' });
      }
    });
    if (budgetWarnings.length > 0) {
      setTimeout(() => window.alert(
        "預算警告：" +
        budgetWarnings.map(w => `${w.categoryId} 已用 ${(w.percentage * 100).toFixed(0)}%`).join('、')
      ), 100);
    }
    return budgetWarnings;
  },

  // 顯示每日小貼士
  showTodayTip: () => {
    const tip = getDailyTip(get().currentDate);
    setTimeout(() => window.alert("今日理財小貼士：\n" + tip), 100);
    return tip;
  },

  // 檢查重要日期
  checkImportantDates: () => {
    const today = dayjs(get().currentDate);
    const month = today.month() + 1, day = today.date();
    const events = get().importantDates.filter(event => event.month === month && event.day === day);
    if (events.length > 0) {
      setTimeout(() => window.alert(
        "今天有重要日子：" + events.map(e => e.name).join('、')
      ), 100);
    }
    return events;
  },

  // 重要日子管理（可選功能）
  addImportantDate: (event) => {
    const importantDates = [...get().importantDates, event];
    saveToLocalStorage('importantDates', importantDates);
    set({ importantDates });
  },
  deleteImportantDate: (idx) => {
    const importantDates = [...get().importantDates];
    importantDates.splice(idx, 1);
    saveToLocalStorage('importantDates', importantDates);
    set({ importantDates });
  },
  showYesterdaySummary: () => {
    const finance = useFinanceStore.getState();
    const prevDate = dayjs(get().currentDate).subtract(1, "day").format("YYYY-MM-DD");
    const txs = finance.transactions.filter(tx => tx.date === prevDate);
    const income = txs.filter(tx => tx.type === "income").reduce((s, tx) => s + Number(tx.amount), 0);
    const expense = txs.filter(tx => tx.type === "expense").reduce((s, tx) => s + Number(tx.amount), 0);
    const count = txs.length;
    setTimeout(() => window.alert(
      `昨日(${prevDate})總結：\n收入：${income}\n支出：${expense}\n結餘：${income - expense}\n交易筆數：${count}`
    ), 100);
    return { income, expense, count };
  },
}));