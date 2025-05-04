import { useFinanceStore } from "../store/financeStore";
import { formatCurrency } from "../utils/format";
import dayjs from "dayjs";

export default function BalanceForecastWidget() {
  const { accounts, transactions, settings, exchangeRates } = useFinanceStore();
  const defaultCurrency = settings.defaultCurrency || "HKD";
  const today = dayjs();
  const monthStart = today.startOf("month");
  const daysPast = today.diff(monthStart, "day") + 1;
  const daysLeft = today.daysInMonth() - today.date();
  const monthTx = transactions.filter(tx => dayjs(tx.date).isBetween(monthStart, today, null, "[]"));
  const net = monthTx.reduce((s, tx) =>
    s + (tx.type === "income"
      ? Number(tx.amount)
      : tx.type === "expense"
        ? -Number(tx.amount)
        : 0)
  , 0);
  const dailyNet = daysPast > 0 ? net / daysPast : 0;
  const totalAssets = accounts.reduce(
    (sum, acc) =>
      sum +
      (acc.currency === defaultCurrency
        ? Number(acc.balance)
        : (Number(acc.balance) * (exchangeRates[defaultCurrency] || 1) / (exchangeRates[acc.currency] || 1))
      ),
    0
  );
  const forecast = totalAssets + dailyNet * daysLeft;

  return (
    <div className="card">
      <div className="card-header">本月底結餘預測</div>
      <div className="card-body">
        <div>目前資產：{formatCurrency(totalAssets, defaultCurrency)}</div>
        <div>日均淨收入：{formatCurrency(dailyNet, defaultCurrency)}</div>
        <div>剩餘天數：{daysLeft}</div>
        <div style={{ fontWeight: 700, color: "#2563eb", fontSize: 20 }}>
          預測月底結餘：{formatCurrency(forecast, defaultCurrency)}
        </div>
        <small style={{ color: "#888" }}>(僅供參考，根據本月平均推算)</small>
      </div>
    </div>
  );
}