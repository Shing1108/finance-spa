import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Account } from "./Account";
import { Category } from "./Category";
import { Transaction } from "./Transaction";
import { Budget } from "./Budget";
import { SavingsGoal } from "./SavingsGoal";
import { RecurringItem } from "./RecurringItem";

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
      addTransaction: (data) => set((s) => ({ transactions: [...s.transactions, new Transaction(data)] })),
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