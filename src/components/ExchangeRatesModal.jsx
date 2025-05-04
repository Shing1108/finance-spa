import { useState } from "react";
import { useFinanceStore } from "../store/financeStore";

const CURRENCIES = [
  { code: "HKD", name: "港幣" },
  { code: "USD", name: "美元" },
  { code: "CNY", name: "人民幣" },
  { code: "EUR", name: "歐元" },
  { code: "GBP", name: "英鎊" },
  { code: "JPY", name: "日元" },
];

export default function ExchangeRatesModal({ onClose }) {
  const { settings, setExchangeRates } = useFinanceStore();
  const [rates, setRates] = useState({ ...settings.exchangeRates });

  function handleRateChange(code, value) {
    setRates((prev) => ({
      ...prev,
      [code]: value.replace(/[^0-9.]/g, ""),
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    // 只保留有值的貨幣
    const cleanRates = {};
    for (const c of CURRENCIES) {
      const v = parseFloat(rates[c.code]);
      if (!isNaN(v) && v > 0) cleanRates[c.code] = v;
    }
    setExchangeRates(cleanRates);
    onClose();
  }

  return (
    <div className="modal active">
      <div className="modal-content">
        <div className="modal-header">
          <h3>匯率與貨幣管理</h3>
          <span className="close-button" onClick={onClose}>&times;</span>
        </div>
        <form className="modal-body" onSubmit={handleSubmit}>
          {CURRENCIES.map((c) => (
            <div className="form-group" key={c.code}>
              <label>
                {c.name}（{c.code}）對 HKD 匯率
              </label>
              <input
                className="form-control"
                type="number"
                min="0"
                step="any"
                value={rates[c.code] ?? ""}
                onChange={(e) => handleRateChange(c.code, e.target.value)}
                placeholder={`請輸入 1${c.code} 等於多少 HKD`}
              />
            </div>
          ))}
          <div className="modal-footer">
            <button className="btn btn-primary" type="submit">保存</button>
            <button className="btn btn-secondary" type="button" onClick={onClose}>
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}