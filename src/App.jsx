import Dashboard from "./Dashboard";
import { useExchangeRates } from "./hooks/useExchangeRates";

export default function App() {
  useExchangeRates("HKD");
  return <Dashboard />;
}