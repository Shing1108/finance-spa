import { useFinanceStore } from "../store/financeStore";
import { useDayManagerStore } from "../store/dayManagerStore";
import { useEffect, useState } from "react";
import { formatCurrency } from "../utils/format";
import dayjs from "dayjs";

export default function AnalyticsAIWidget() {
  const { transactions, categories, settings } = useFinanceStore();
  const currentDate = useDayManagerStore(s => s.currentDate);
  const defaultCurrency = settings.defaultCurrency || "HKD";
  const [aiAdvice, setAIAdvice] = useState("");

  useEffect(() => {
    // 本地簡易 AI 分析
    const thisMonth = dayjs(currentDate).format("YYYY-MM");
    const expenseTx = transactions.filter(
      tx => tx.type === "expense" && (tx.date || "").startsWith(thisMonth)
    );
    if (expenseTx.length === 0) return setAIAdvice("本月暫無消費分析。");

    // 最大支出類
    const byCat = {};
    expenseTx.forEach(tx => {
      byCat[tx.categoryId] = (byCat[tx.categoryId] || 0) + Number(tx.amount);
    });
    const maxCatId = Object.keys(byCat).sort((a, b) => byCat[b] - byCat[a])[0];
    const maxCat = categories.find(c => c.id === maxCatId);
    let advice = `本月最大支出類別為「${maxCat?.name || "未分類"}」，共：${formatCurrency(byCat[maxCatId], defaultCurrency)}。\n`;

    // 異常檢查
    const allMonths = Array.from({ length: 13 }, (_, i) => dayjs(currentDate).subtract(12 - i, "month").format("YYYY-MM"));
    for (const catId of Object.keys(byCat)) {
      const sums = allMonths.slice(0, -1).map(m =>
        transactions.filter(tx =>
          tx.type === "expense" && tx.categoryId === catId && (tx.date || "").startsWith(m)
        ).reduce((s, tx) => s + Number(tx.amount), 0)
      );
      const avg = sums.reduce((a, b) => a + b, 0) / (sums.length || 1);
      if (avg > 0 && byCat[catId] > avg * 1.5) {
        const catName = categories.find(c => c.id === catId)?.name || "未分類";
        advice += `⚠️「${catName}」本月支出異常（${formatCurrency(byCat[catId], defaultCurrency)}），已高於過去平均（${formatCurrency(avg, defaultCurrency)}）。\n`;
      }
    }
    setAIAdvice(advice);
  }, [transactions, categories, settings, currentDate]);

  return (
    <div className="card">
      <div className="card-header">AI 智能財務分析</div>
      <div className="card-body">
        <div style={{ whiteSpace: "pre-line", fontSize: 15 }}>{aiAdvice}</div>
      </div>
    </div>
  );
}