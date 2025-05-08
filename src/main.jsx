import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import { useFinanceStore } from "./store/financeStore";

// 預設啟動一定要有 data-theme="light"
if (!document.documentElement.hasAttribute('data-theme')) {
  document.documentElement.setAttribute('data-theme', 'light');
}

function ApplySettingsEffect() {
  const settings = useFinanceStore((s) => s.settings);
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }
    document.documentElement.style.fontSize =
      settings.fontSize === "small"
        ? "14px"
        : settings.fontSize === "large"
        ? "18px"
        : "16px";
  }, [settings.darkMode, settings.fontSize]);
  return null;
}

function FixInitialBalanceOnce() {
  useEffect(() => {
    // 只檢查一次
    const { accounts, updateAccount } = useFinanceStore.getState();
    let fixed = false;
    accounts.forEach(acc => {
      if (
        typeof acc.initialBalance !== "number" ||
        isNaN(acc.initialBalance) ||
        acc.initialBalance === 0
      ) {
        updateAccount(acc.id, { initialBalance: acc.balance });
        fixed = true;
      }
    });
    if (fixed) {
      alert("已自動補齊所有舊帳戶的初始餘額，請重新整理頁面！");
    }
  }, []);
  return null;
}

function Root() {
  return (
    <>
      <FixInitialBalanceOnce /> {/* <<<<<< 這裡加進來 */}
      <ApplySettingsEffect />
      <App />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);