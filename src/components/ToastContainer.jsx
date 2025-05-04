import { useToastStore } from "../store/toastStore";

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div id="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span className="toast-message">{t.message}</span>
        </div>
      ))}
    </div>
  );
}