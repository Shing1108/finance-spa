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
      exchangeRates: {}, // 例如: { USD: 7.85, JPY: 0.056, ... }
      lastRatesUpdate: null,
      setAll: (data) => set(data),
      
      setExchangeRates: (rates) =>
        set({ exchangeRates: rates, lastRatesUpdate: Date.now() }),
      
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
      addTransaction: (data) => set((s) => {
        const tx = new Transaction(data);
        let newAccounts = s.accounts.slice();
        if (tx.type === "income" && tx.accountId) {
          newAccounts = newAccounts.map(acc =>
            acc.id === tx.accountId
              ? { ...acc, balance: Number(acc.balance) + Number(tx.amount) }
              : acc
          );
        }
        if (tx.type === "expense" && tx.accountId) {
          newAccounts = newAccounts.map(acc =>
            acc.id === tx.accountId
              ? { ...acc, balance: Number(acc.balance) - Number(tx.amount) }
              : acc
          );
        }
        if (tx.type === "transfer" && tx.accountId && tx.toAccountId) {
          newAccounts = newAccounts.map(acc => {
            if (acc.id === tx.accountId) {
              return { ...acc, balance: Number(acc.balance) - Number(tx.amount) };
            }
            if (acc.id === tx.toAccountId) {
              return { ...acc, balance: Number(acc.balance) + Number(tx.amount) };
            }
            return acc;
          });
        }
        return {
          transactions: [...s.transactions, tx],
          accounts: newAccounts,
        };
      }),
      updateTransaction: (id, data) =>
        set((s) => ({
          transactions: s.transactions.map(tx => tx.id === id ? { ...tx, ...data, updatedAt: new Date().toISOString() } : tx)
        })),
      deleteTransaction: (id) => set((s) => ({
        transactions: s.transactions.filter(tx => tx.id !== id)
      })),
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
    }),
    {
      name: "finance-store-v2", // localStorage key
    }
  )
);