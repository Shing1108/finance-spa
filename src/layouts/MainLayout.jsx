import Navbar from "../components/TopNavigation";
import ToastContainer from "../components/ToastContainer";

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-neutral-900 transition-colors">
      <Navbar />
      <main className="flex-1 p-4 max-w-3xl mx-auto w-full">{children}</main>
      <ToastContainer />
    </div>
  );
}