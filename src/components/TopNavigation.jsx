export default function TopNavigation({ activeTab, onTabChange }) {
  const tabs = [
    { icon: <i className="fas fa-home"></i>, label: "儀表板" },
    { icon: <i className="fas fa-wallet"></i>, label: "戶口" },
    { icon: <i className="fas fa-exchange-alt"></i>, label: "記帳" },
    { icon: <i className="fas fa-chart-pie"></i>, label: "預算" },
    { icon: <i className="fas fa-tags"></i>, label: "類別" },
    { icon: <i className="fas fa-chart-line"></i>, label: "統計" },
    { icon: <i className="fas fa-bullseye"></i>, label: "目標" },
    { icon: <i className="fas fa-chart-bar"></i>, label: "分析" },
    { icon: <i className="fas fa-sync-alt"></i>, label: "同步" },
  ];
  return (
    <nav className="top-navigation top-area-fixed">
      <ul className="nav-tabs nav-tabs-full">
        {tabs.map((tab, idx) => (
          <li
            key={tab.label}
            className={idx === activeTab ? "active" : ""}
            onClick={() => onTabChange(idx)}
          >
            <span>{tab.icon}</span>
            <span style={{ marginTop: 2 }}>{tab.label}</span>
          </li>
        ))}
      </ul>
    </nav>
  );
}