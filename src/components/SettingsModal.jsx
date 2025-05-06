import { useFinanceStore } from "../store/financeStore";
import ExchangeRatesModal from "./ExchangeRatesModal";
import { useState } from "react";

// 輔助：全部設定項目預設值
const DEFAULT_SETTINGS = {
  darkMode: false,
  fontSize: "medium",
  enableFirebaseSync: false,
  defaultCurrency: "HKD",
  decimalPlaces: 2,
  enableBudgetAlerts: false,
  alertThreshold: 80,
};

const { clearAllData } = useFinanceStore();

export default function SettingsModal({ onClose }) {
  // 取 store 設定
  const { settings, setSettings, clearAllData } = useFinanceStore();
  const [showRates, setShowRates] = useState(false);

  // 初始化設定表單
  const [form, setForm] = useState({ ...DEFAULT_SETTINGS, ...settings });


  // 清除所有數據
  const handleClearData = () => {
    if (window.confirm("確定要清除所有數據嗎？此操作無法復原！")) {
      clearAllData();
      onClose();
      window.location.reload();
    }
  };

  // 改變設定
  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  // 保存設定
  function handleSubmit(e) {
    e.preventDefault();
    setSettings(form);
    // 深色模式即時啟用
    if (form.darkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    document.documentElement.style.fontSize = (
      form.fontSize === "small"
        ? "14px"
        : form.fontSize === "large"
        ? "18px"
        : "16px"
    );
    onClose();
  }

  return (
    <div className="modal active">
      <div className="modal-content">
        <div className="modal-header">
          <h3>應用設定</h3>
          <span className="close-button" onClick={onClose}>
            &times;
          </span>
        </div>
        <form className="modal-body" onSubmit={handleSubmit}>
          {/* 界面設定 */}
          <div className="settings-section" style={{ marginBottom: 24 }}>
            <h4>界面設定</h4>
            <div className="form-group checkbox-group">
              <input
                type="checkbox"
                id="darkMode"
                name="darkMode"
                className="form-checkbox"
                checked={form.darkMode}
                onChange={handleChange}
              />
              <label htmlFor="darkMode">深色模式</label>
            </div>
            <div className="form-group">
              <label>字體大小</label>
              <div className="radio-group">
                {["small", "medium", "large"].map((size) => (
                  <div className="radio-item" key={size}>
                    <input
                      type="radio"
                      id={`fontSize${size}`}
                      name="fontSize"
                      value={size}
                      checked={form.fontSize === size}
                      onChange={handleChange}
                    />
                    <label htmlFor={`fontSize${size}`}>
                      {size === "small" ? "小" : size === "medium" ? "中" : "大"}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="form-group checkbox-group">
              <input
                type="checkbox"
                id="enableFirebaseSync"
                name="enableFirebaseSync"
                className="form-checkbox"
                checked={form.enableFirebaseSync}
                onChange={handleChange}
              />
              <label htmlFor="enableFirebaseSync">啟用雲端同步 (Firebase)</label>
            </div>
          </div>

          {/* 貨幣設定 */}
          <div className="settings-section" style={{ marginBottom: 24 }}>
            <h4>貨幣設定</h4>
            <div className="form-group">
              <label htmlFor="defaultCurrency">預設貨幣</label>
              <select
                id="defaultCurrency"
                name="defaultCurrency"
                className="form-control"
                value={form.defaultCurrency}
                onChange={handleChange}
              >
                <option value="HKD">港幣 (HKD)</option>
                <option value="USD">美元 (USD)</option>
                <option value="CNY">人民幣 (CNY)</option>
                <option value="EUR">歐元 (EUR)</option>
                <option value="GBP">英鎊 (GBP)</option>
                <option value="JPY">日元 (JPY)</option>
              </select>
            </div>
            <div className="form-group">
              <label>小數點位數</label>
              <div className="radio-group">
                {[0, 1, 2, 3].map((dp) => (
                  <div className="radio-item" key={dp}>
                    <input
                      type="radio"
                      id={`decimal${dp}`}
                      name="decimalPlaces"
                      value={dp}
                      checked={Number(form.decimalPlaces) === dp}
                      onChange={handleChange}
                    />
                    <label htmlFor={`decimal${dp}`}>{dp}</label>
                  </div>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>匯率設定</label>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowRates(true)}
              >
                匯率與貨幣管理
              </button>
            </div>
          </div>

          {/* 通知設定 */}
          <div className="settings-section" style={{ marginBottom: 24 }}>
            <h4>通知設定</h4>
            <div className="form-group checkbox-group">
              <input
                type="checkbox"
                id="enableBudgetAlerts"
                name="enableBudgetAlerts"
                className="form-checkbox"
                checked={form.enableBudgetAlerts}
                onChange={handleChange}
              />
              <label htmlFor="enableBudgetAlerts">啟用預算提醒</label>
            </div>
            <div className="form-group">
              <label htmlFor="alertThreshold">提醒閾值 (%)</label>
              <input
                type="number"
                id="alertThreshold"
                name="alertThreshold"
                className="form-control"
                min={1}
                max={100}
                value={form.alertThreshold}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* 數據管理 */}
          <div className="settings-section">
            <h4>數據管理</h4>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleClearData}
            >
              清除所有數據
            </button>
            <small className="warning-text">
                警告：此操作無法復原
            </small>
          </div>

          <div className="modal-footer">
            <button type="submit" className="btn btn-primary" id="saveSettingsButton">
              保存設定
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              取消
            </button>
          </div>
          {showRates && <ExchangeRatesModal onClose={() => setShowRates(false)} />}
        </form>
      </div>
    </div>
  );
}