import React, { useState } from "react";
import dayjs from "dayjs";
import clsx from "clsx";

const WEEK_DAYS = ["日", "一", "二", "三", "四", "五", "六"];

function getMonthMatrix(year, month) {
  // 取得該月 1 號是星期幾
  const firstDay = dayjs(`${year}-${month + 1}-01`);
  const startDay = firstDay.day();
  const daysInMonth = firstDay.daysInMonth();
  // 填充前置空格
  const days = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  // 填入本月日期
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  // 補齊 6 行 7 列
  while (days.length % 7 !== 0) days.push(null);
  // 拆成每週陣列
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

export default function Calendar({
  value,
  onChange,
  renderDaySummary, // (dateObj: dayjs) => ReactNode
  className = "",
}) {
  // value = dayjs物件，onChange=選擇日期事件
  const today = dayjs();
  const [currentMonth, setCurrentMonth] = useState(
    value ? value.startOf("month") : today.startOf("month")
  );

  const weeks = getMonthMatrix(
    currentMonth.year(),
    currentMonth.month()
  );

  const handlePrev = () => setCurrentMonth(m => m.subtract(1, "month"));
  const handleNext = () => setCurrentMonth(m => m.add(1, "month"));

  return (
    <div className={clsx("calendar-container", className)}>
      {/* Navigation */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 16px", background: "#2563eb", color: "#fff", borderRadius: "12px 12px 0 0"
      }}>
        <button
          className="btn btn-sm"
          style={{ background: "#1e40af", color: "#fff", minWidth: 32 }}
          onClick={handlePrev}
          aria-label="上一月"
        >
          &lt;
        </button>
        <div className="font-bold text-lg select-none" style={{ fontWeight: 600 }}>
          {currentMonth.format("YYYY 年 MM 月")}
        </div>
        <button
          className="btn btn-sm"
          style={{ background: "#1e40af", color: "#fff", minWidth: 32 }}
          onClick={handleNext}
          aria-label="下一月"
        >
          &gt;
        </button>
      </div>
      {/* Week header */}
      <div className="grid grid-cols-7" style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        background: "#e0e7ef",
        textAlign: "center",
        fontWeight: 600,
        fontSize: 13,
        color: "#2563eb"
      }}>
        {WEEK_DAYS.map(w => (
          <div key={w} style={{ padding: "6px 0" }}>{w}</div>
        ))}
      </div>
      {/* Calendar body */}
      <div className="grid grid-cols-7" style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gridAutoRows: "minmax(52px,auto)",
        background: "#f5f7fa"
      }}>
        {weeks.map((week, wi) =>
          week.map((d, di) => {
            const dateObj = d
              ? currentMonth.date(d)
              : null;
            const isToday =
              d &&
              dateObj.isSame(today, "day");
            const isSelected =
              d && value && dateObj.isSame(value, "day");
            return (
              <div
                key={`${wi}-${di}`}
                className={clsx(
                  "relative flex flex-col p-1 sm:p-2 text-xs cursor-pointer transition",
                  d
                    ? "hover:bg-blue-50"
                    : "bg-gray-100 cursor-default",
                  isToday && "border-2 border-blue-500",
                  isSelected &&
                    "ring-2 ring-blue-400 ring-inset"
                )}
                style={{
                  background: d ? "#fff" : "#f3f3f3",
                  border: isToday ? "2px solid #2563eb" : "1px solid #e5e7eb",
                  borderRadius: 8,
                  margin: 2,
                  minHeight: 50,
                  opacity: d ? 1 : 0.6
                }}
                onClick={() => d && onChange && onChange(dateObj)}
              >
                <div
                  style={{
                    fontWeight: isToday ? 700 : 500,
                    marginBottom: 2,
                    color: isToday ? "#2563eb" : "#222"
                  }}
                >
                  {d ? d : ""}
                </div>
                {/* 可自訂該天摘要內容 */}
                {d &&
                  renderDaySummary &&
                  renderDaySummary(dateObj)}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}