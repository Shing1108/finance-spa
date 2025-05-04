import { create } from "zustand";
let toastId = 0;
export const useToastStore = create((set) => ({
  toasts: [],
  addToast: (message, type = "info", duration = 3200) => {
    const id = ++toastId;
    set((s) => ({
      toasts: [...s.toasts, { id, message, type }],
    }));
    setTimeout(() => {
      set((s) => ({
        toasts: s.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  },
}));