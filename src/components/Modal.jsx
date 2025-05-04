import { createPortal } from "react-dom";

export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return createPortal(
    <div
      className="modal active"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content fade-in">
        <div className="modal-header">
          <h3>{title}</h3>
          <span className="close-button" onClick={onClose}>&times;</span>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}