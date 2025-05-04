import { useFinanceStore } from "../store/financeStore";
import { useDayManagerStore } from "../store/dayManagerStore";
import { formatCurrency } from "../utils/format";
import dayjs from "dayjs";

export default function FinancesSnapshot() {
  const { accounts, transactions, settings, exchangeRates } = useFinanceStore();
  const currentDate = useDayManagerStore(s => s.currentDate); // 關鍵：取用 dayManagerStore 的 currentDate

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

  // 用 currentDate 做為「今日」基準
  const todayTx = transactions.filter((tx) => dayjs(tx.date).format("YYYY-MM-DD") === currentDate);
  const todayIncome = todayTx.filter(tx => tx.type === "income").reduce((s, tx) => s + Number(tx.amount), 0);
  const todayExpense = todayTx.filter(tx => tx.type === "expense").reduce((s, tx) => s + Number(tx.amount), 0);

  return (
    <div className="finances-snapshot finances-snapshot-fixed">
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