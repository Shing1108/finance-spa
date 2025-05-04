// hooks/useExchangeRates.js
import { useEffect } from "react";
import { useFinanceStore } from "../store/financeStore";

// 支援 base: HKD，免費 API
export function useExchangeRates(base = "HKD") {
  const setExchangeRates = useFinanceStore((s) => s.setExchangeRates);
  const lastRatesUpdate = useFinanceStore((s) => s.lastRatesUpdate);

  useEffect(() => {
    // 只要一天沒更新才抓
    if (lastRatesUpdate && Date.now() - lastRatesUpdate < 12 * 60 * 60 * 1000) return;
    fetch(`https://api.exchangerate.host/latest?base=${base}`)
      .then((res) => res.json())
      .then((data) => {
        setExchangeRates(data.rates);
      })
      .catch(() => {});
  }, [base, setExchangeRates, lastRatesUpdate]);
}