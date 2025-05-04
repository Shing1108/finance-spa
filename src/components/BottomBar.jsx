import { useDayManagerStore } from "../store/dayManagerStore";
import { useToastStore } from "../store/toastStore";

export default function BottomBar({ onSetting }) {
  const startNewDay = useDayManagerStore((s) => s.startNewDay);
  const addToast = useToastStore((s) => s.addToast);

  function handleStartNewDay() {
    // startNewDay() 回傳 true 表示成功執行
    const result = startNewDay();
    if (result) {
      addToast("新的一天已開始！", "success");
    }
    // 如果已經是今天或取消會自帶提示
  }

  return (
    <div className="app-actions">
      <button id="settingsButton" className="snapshot-btn" onClick={onSetting}>
        <i className="fas fa-cog"></i>
      </button>
      <button
        id="startNewDayButton"
        className="snapshot-btn primary-btn"
        onClick={handleStartNewDay}
      >
        <i className="fas fa-calendar-plus"></i> 開啟新的一天
      </button>
    </div>
  );
}