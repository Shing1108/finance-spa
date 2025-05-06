import { useState } from "react";
import FinancesSnapshot from "./components/FinancesSnapshot";
import TopNavigation from "./components/TopNavigation";
import BottomBar from "./components/BottomBar";
import SettingsModal from "./components/SettingsModal";
import NewDayModal from "./components/NewDayModal";

import DashboardPage from "./pages/DashboardPage";
import Accounts from "./pages/Accounts";
import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";
import Categories from "./pages/Categories";
import Statistics from "./pages/Statistics";
import SavingsGoals from "./pages/SavingsGoals";
import Analytics from "./pages/Analytics";
import Sync from "./pages/Sync";

const PAGES = [
  DashboardPage,
  Accounts,
  Transactions,
  Budgets,
  Categories,
  Statistics,
  SavingsGoals,
  Analytics,
  Sync,
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [showSetting, setShowSetting] = useState(false);
  const [showNewDay, setShowNewDay] = useState(false);

  const PageComponent = PAGES[activeTab];

  return (
    <div className="app-container">
        <div style={{ height: 'env(safe-area-inset-top, 0px)' }} />
      <div className="fixed-top-bg"></div>
      <FinancesSnapshot />
      <TopNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="main-content">
        <PageComponent />
      </main>
      <BottomBar
        onSetting={() => setShowSetting(true)}
        onOpenNewDay={() => setShowNewDay(true)}
      />
      {showSetting && <SettingsModal onClose={() => setShowSetting(false)} />}
      {showNewDay && (
        <NewDayModal
          onConfirm={() => { setShowNewDay(false); /* 執行新一天邏輯 */ }}
          onCancel={() => setShowNewDay(false)}
        />
      )}
    </div>
  );
}