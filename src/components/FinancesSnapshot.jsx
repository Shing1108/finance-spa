import { useFinanceStore } from "../store/financeStore";
import { useDayManagerStore } from "../store/dayManagerStore";
import { formatCurrency } from "../utils/format";

export default function FinancesSnapshot() {
  const { accounts, transactions, settings, exchangeRates } = useFinanceStore();
  const currentDate = useDayManagerStore(s => s.currentDate); // 必須用 dayManagerStore 的 currentDate

  const defaultCurrency = settings.defaultCurrency || "HKD";
  const totalAssets = accounts.reduce(
    (sum, acc) =>
      sum +
      (acc.currency === defaultCurrency
        ? Number(acc.balance)
        : (Number(acc.balance) * (exchangeRates[defaultCurrency] || 1) / (exchangeRates[acc.currency] || 1))
      ),
    0
  );

  // 「今日」是以 currentDate 為基準
  const todayTx = transactions.filter((tx) => tx.date === currentDate);
  const todayIncome = todayTx.filter(tx => tx.type === "income").reduce((s, tx) => s + Number(tx.amount), 0);
  const todayExpense = todayTx.filter(tx => tx.type === "expense").reduce((s, tx) => s + Number(tx.amount), 0);

  return (
    <div className="finances-snapshot">
      <div className="snapshot-item blue-item">
        <div className="snapshot-label">總資產</div>
        <div className="snapshot-value">{formatCurrency(totalAssets, defaultCurrency)}</div>
      </div>
      <div className="snapshot-item red-item">
        <div className="snapshot-label">今日支出</div>
        <div className="snapshot-value">{formatCurrency(todayExpense, defaultCurrency)}</div>
      </div>
      <div className="snapshot-item green-item">
        <div className="snapshot-label">今日收入</div>
        <div className="snapshot-value">{formatCurrency(todayIncome, defaultCurrency)}</div>
      </div>
    </div>
  );
}