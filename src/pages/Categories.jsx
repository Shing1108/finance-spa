import { useFinanceStore } from "../store/financeStore";
import { useState, useMemo } from "react";
import { Modal } from "../components/Modal";

// 豐富的 FontAwesome icon 清單
const ICON_LIST = [
  "tag", "home", "utensils", "shopping-bag", "shopping-cart", "tshirt", "bus", "car", "train", "bicycle", "walking", "building", "university", "hotel",
  "tooth", "vial", "pills", "briefcase-medical", "briefcase", "user-md", "graduation-cap", "book", "pen", "laptop", "mobile-alt", "desktop", "headphones",
  "gamepad", "film", "ticket-alt", "music", "coffee", "beer", "cocktail", "glass-martini", "wine-glass", "pizza-slice", "bed", "plane", "heartbeat",
  "money-bill-wave", "gift", "chart-line", "percentage", "plus-circle", "minus-circle", "coins", "wallet", "apple-alt", "paw", "camera", "cloud", "tree",
  "leaf", "donate", "chart-pie", "star", "heart"
];

// 進階 icon picker 元件
function IconPicker({ value, onChange }) {
  const [showGrid, setShowGrid] = useState(false);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "#ddd",
            fontSize: 34,
            color: "#444",
            marginBottom: 6
          }}
        >
          <i className={`fas fa-${value}`} />
        </div>
      </div>
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <button
          type="button"
          style={{
            padding: "8px 22px",
            fontSize: 18,
            borderRadius: 18,
            background: "#5a636c",
            color: "#fff",
            border: "none",
            boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
            cursor: "pointer"
          }}
          onClick={() => setShowGrid(g => !g)}
        >
          選擇圖標
        </button>
      </div>
      {showGrid && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, 56px)",
            gap: 16,
            justifyContent: "center",
            maxHeight: 260,
            overflowY: "auto",
            margin: "8px 0"
          }}
        >
          {ICON_LIST.map(iconName => (
            <button
              key={iconName}
              type="button"
              title={iconName}
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: value === iconName ? "#1976d2" : "#e0e0e0",
                border: value === iconName ? "2px solid #1976d2" : "1px solid #ccc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 23,
                color: value === iconName ? "#fff" : "#444",
                cursor: "pointer",
                outline: "none",
                transition: "all 0.18s"
              }}
              onClick={() => {
                onChange({ target: { name: "icon", value: iconName } });
                setShowGrid(false);
              }}
            >
              <i className={`fas fa-${iconName}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// 可拖曳分類卡片（如需 dnd-kit，請自行補回）
function SortableCategoryCard({ cat, onEdit, onDelete }) {
  return (
    <div className="category-card">
      <div className="category-icon" style={{ backgroundColor: cat.color + "20", color: cat.color }}>
        <i className={`fas fa-${cat.icon}`} />
      </div>
      <div className="category-name">{cat.name}</div>
      <div className="category-actions">
        <button
          className="btn-icon"
          onClick={e => { e.stopPropagation(); onEdit(cat); }}
          aria-label="編輯"
        >
          <i className="fa fa-edit" />
        </button>
        <button
          className="btn-icon"
          onClick={e => { e.stopPropagation(); onDelete(cat); }}
          aria-label="刪除"
        >
          <i className="fa fa-trash-alt" />
        </button>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const { categories, addCategory, updateCategory, deleteCategory } = useFinanceStore();
  const [tab, setTab] = useState("income");
  const [modalOpen, setModalOpen] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [form, setForm] = useState({
    name: "",
    type: "income",
    icon: ICON_LIST[0],
    color: "#4CAF50",
    order: 0,
  });

  // 只顯示當前類型
  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === tab).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [categories, tab]
  );

  function openAddModal(type) {
    setEditCat(null);
    setForm({
      name: "",
      type,
      icon: ICON_LIST[0],
      color: "#4CAF50",
      order: filteredCategories.length,
    });
    setModalOpen(true);
  }

  function openEditModal(cat) {
    setEditCat(cat);
    setForm({ ...cat });
    setModalOpen(true);
  }

  function handleFormChange(e) {
    setForm((f) => ({
      ...f,
      [e.target.name]: e.target.value,
    }));
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    if (!form.name) return;
    if (editCat) {
      updateCategory(editCat.id, form);
    } else {
      addCategory({ ...form, order: filteredCategories.length });
    }
    setModalOpen(false);
  }

  function handleDelete(cat) {
    if (window.confirm(`確定要刪除類別「${cat.name}」嗎？`)) {
      deleteCategory(cat.id);
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3>類別管理</h3>
        <div className="tab-buttons" style={{ marginTop: 8 }}>
          <button className={`tab-button${tab === "income" ? " active" : ""}`} onClick={() => setTab("income")}>收入類別</button>
          <button className={`tab-button${tab === "expense" ? " active" : ""}`} onClick={() => setTab("expense")}>支出類別</button>
          <button className="btn btn-primary" style={{ marginLeft: 16 }} onClick={() => openAddModal(tab)}>
            <i className="fa fa-plus" /> 新增
          </button>
        </div>
      </div>
      <div className="card-body">
        <div className="categories-list card-view">
          {filteredCategories.length === 0 ? (
            <div className="empty-message">尚未設置{tab === "income" ? "收入" : "支出"}類別</div>
          ) : (
            filteredCategories.map((cat) => (
              <SortableCategoryCard
                key={cat.id}
                cat={cat}
                onEdit={openEditModal}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editCat ? "編輯類別" : "新增類別"}>
        <form onSubmit={handleFormSubmit}>
          <div className="form-group">
            <label>名稱</label>
            <input className="form-control" name="name" value={form.name} onChange={handleFormChange} required />
          </div>
          <div className="form-group">
            <label>圖標</label>
            <IconPicker value={form.icon} onChange={handleFormChange} />
          </div>
          <div className="form-group">
            <label>顏色</label>
            <input type="color" className="form-control" name="color" value={form.color} onChange={handleFormChange} />
          </div>
          <div className="modal-footer">
            <button type="submit" className="btn btn-primary">保存</button>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>取消</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}