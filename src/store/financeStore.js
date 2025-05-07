import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Account } from "../models/Account";
import { Category } from "../models/Category";
import { Transaction } from "../models/Transaction";
import { Budget } from "../models/Budget";
import { SavingsGoal } from "../models/SavingsGoal";
import { RecurringItem } from "../models/RecurringItem";

const defaultSettings = {
  darkMode: false,
  fontSize: 'medium',
  defaultCurrency: 'HKD',
  decimalPlaces: 2,
  enableFirebaseSync: false,
  enableBudgetAlerts: true,
  alertThreshold: 80
};

// ========== 核心：重算所有帳戶餘額 ==========
function recalculateAllAccountBalances(accounts, transactions) {
  // 如果未來有 initialBalance 欄位，可改成：
  // const newAccounts = accounts.map(acc => ({ ...acc, balance: acc.initialBalance ?? 0 }));
  // 目前預設為 0
  const newAccounts = accounts.map(acc => ({ ...acc, balance: 0 }));

  transactions.forEach(tx => {
    if (tx.type === "income" && tx.accountId) {
      const acc = newAccounts.find(a => a.id === tx.accountId);
      if (acc) acc.balance += Number(tx.amount);
    }
    if (tx.type === "expense" && tx.accountId) {
      const acc = newAccounts.find(a => a.id === tx.accountId);
      if (acc) acc.balance -= Number(tx.amount);
    }
    if (tx.type === "transfer" && tx.accountId && tx.toAccountId) {
      const fromAcc = newAccounts.find(a => a.id === tx.accountId);
      const toAcc = newAccounts.find(a => a.id === tx.toAccountId);
      if (fromAcc) fromAcc.balance -= Number(tx.amount);
      if (toAcc) toAcc.balance += Number(tx.amount);
    }
  });
  return newAccounts;
}

export const useFinanceStore = create(
  persist(
    (set, get) => ({
      // 狀態
      settings: defaultSettings,
      accounts: [],
      categories: [],
      transactions: [],
      budgets: [],
      savingsGoals: [],
      recurringItems: [],
      noteSuggestions: {},
      // Actions
      setSettings: (s) => set({ settings: { ...get().settings, ...s } }),
      addAccount: (data) => set((s) => ({ accounts: [...s.accounts, new Account(data)] })),
      updateAccount: (id, data) =>
        set((s) => ({
          accounts: s.accounts.map(acc => acc.id === id ? { ...acc, ...data, updatedAt: new Date().toISOString() } : acc)
        })),
      deleteAccount: (id) => set((s) => ({
        accounts: s.accounts.filter(acc => acc.id !== id)
      })),
      addCategory: (data) => set((s) => ({ categories: [...s.categories, new Category(data)] })),
      updateCategory: (id, data) =>
        set((s) => ({
          categories: s.categories.map(cat => cat.id === id ? { ...cat, ...data, updatedAt: new Date().toISOString() } : cat)
        })),
      deleteCategory: (id) => set((s) => ({
        categories: s.categories.filter(cat => cat.id !== id)
      })),

      // ===== 交易相關（重點修正）=====
      addTransaction: (data) => set((s) => {
        const txs = [...s.transactions, new Transaction(data)];
        const newAccounts = recalculateAllAccountBalances(s.accounts, txs);
        return { transactions: txs, accounts: newAccounts };
      }),
      updateTransaction: (id, data) => set((s) => {
        const txs = s.transactions.map(tx => tx.id === id ? { ...tx, ...data, updatedAt: new Date().toISOString() } : tx);
        const newAccounts = recalculateAllAccountBalances(s.accounts, txs);
        return { transactions: txs, accounts: newAccounts };
      }),
      deleteTransaction: (id) => set((s) => {
        const txs = s.transactions.filter(tx => tx.id !== id);
        const newAccounts = recalculateAllAccountBalances(s.accounts, txs);
        return { transactions: txs, accounts: newAccounts };
      }),

      addBudget: (data) => set((s) => ({ budgets: [...s.budgets, new Budget(data)] })),
      updateBudget: (id, data) =>
        set((s) => ({
          budgets: s.budgets.map(b => b.id === id ? { ...b, ...data, updatedAt: new Date().toISOString() } : b)
        })),
      deleteBudget: (id) => set((s) => ({
        budgets: s.budgets.filter(b => b.id !== id)
      })),
      addSavingsGoal: (data) => set((s) => ({ savingsGoals: [...s.savingsGoals, new SavingsGoal(data)] })),
      updateSavingsGoal: (id, data) =>
        set((s) => ({
          savingsGoals: s.savingsGoals.map(g => g.id === id ? { ...g, ...data, updatedAt: new Date().toISOString() } : g)
        })),
      deleteSavingsGoal: (id) => set((s) => ({
        savingsGoals: s.savingsGoals.filter(g => g.id !== id)
      })),
      addRecurringItem: (data) => set((s) => ({ recurringItems: [...s.recurringItems, new RecurringItem(data)] })),
      updateRecurringItem: (id, data) =>
        set((s) => ({
          recurringItems: s.recurringItems.map(r => r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r)
        })),
      deleteRecurringItem: (id) => set((s) => ({
        recurringItems: s.recurringItems.filter(r => r.id !== id)
      })),
      // Note Suggestion
      addNoteSuggestion: (categoryId, note) =>
        set((s) => {
          const notes = s.noteSuggestions[categoryId] || [];
          if (!note || notes.includes(note)) return {};
          const newNotes = [note, ...notes].slice(0, 10);
          return {
            noteSuggestions: { ...s.noteSuggestions, [categoryId]: newNotes }
          };
        }),
      deleteNoteSuggestion: (categoryId, note) =>
        set((s) => {
          const notes = s.noteSuggestions[categoryId] || [];
          if (!note || !notes.includes(note)) return {};
          const newNotes = notes.filter(n => n !== note);
          return {
            noteSuggestions: { ...s.noteSuggestions, [categoryId]: newNotes }
          };
        }),
      // 你可以加 clearAllData 等其他 action
      clearAllData: () => set(() => ({
        settings: defaultSettings,
        accounts: [],
        categories: [],
        transactions: [],
        budgets: [],
        savingsGoals: [],
        recurringItems: [],
        noteSuggestions: {}
      })),
      setAll: (data) => set(() => ({ ...data })),

    }),
    
    {
      name: "finance-store-v2", // localStorage key
    }
  )
);