import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import { useFinanceStore } from "./store/financeStore";
window.useFinanceStore = useFinanceStore;

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

function Root() {
  return (
    <>
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