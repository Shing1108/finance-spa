export default function NewDayModal({ onConfirm, onCancel }) {
  return (
    <div className="modal active">
      <div className="modal-content">
        <div className="modal-header">
          <h3>開啟新的一天</h3>
          <span className="close-button" onClick={onCancel}>&times;</span>
        </div>
        <div className="modal-body">
          <p>確定要開啟新的一天嗎？</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onConfirm}>確定</button>
          <button className="btn btn-secondary" onClick={onCancel}>取消</button>
        </div>
      </div>
    </div>
  );
}