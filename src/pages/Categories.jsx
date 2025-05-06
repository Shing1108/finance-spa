import { useFinanceStore } from "../store/financeStore";
import { useState, useMemo } from "react";
import { Modal } from "../components/Modal";

// 大量 FontAwesome icon
const ICON_LIST = [
  "tag", "home", "utensils", "shopping-bag", "shopping-cart", "tshirt", "bus", "car", "train", "bicycle", "walking", "building", "university", "hotel",
  "tooth", "vial", "pills", "briefcase-medical", "briefcase", "user-md", "graduation-cap", "book", "pen", "laptop", "mobile-alt", "desktop", "headphones",
  "gamepad", "film", "ticket-alt", "music", "coffee", "beer", "cocktail", "glass-martini", "wine-glass", "pizza-slice", "bed", "plane", "heartbeat",
  "money-bill-wave", "gift", "chart-line", "percentage", "plus-circle", "minus-circle", "coins", "wallet", "apple-alt", "paw", "camera", "cloud", "tree",
  "leaf", "donate", "chart-pie", "star", "heart"
];

// 常用顏色
const COLOR_SWATCHES = [
  "#4CAF50", "#E91E63", "#2196F3", "#FF9800", "#795548", "#9C27B0", "#009688", "#F44336", "#607D8B", "#FFEB3B", "#3F51B5", "#00BCD4"
];

// 縮小版 icon picker
function IconPicker({ value, onChange }) {
  const [showGrid, setShowGrid] = useState(false);
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ textAlign: "center", marginBottom: 6 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "#ddd",
            fontSize: 20,
            color: "#444",
            marginBottom: 4
          }}
        >
          <i className={`fas fa-${value}`} />
        </div>
      </div>
      <div style={{ textAlign: "center", marginBottom: 9 }}>
        <button
          type="button"
          style={{
            padding: "3px 12px",
            fontSize: 15,
            borderRadius: 12,
            background: "#5a636c",
            color: "#fff",
            border: "none",
            boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
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
            gridTemplateColumns: "repeat(auto-fill, 32px)",
            gap: 8,
            justifyContent: "center",
            maxHeight: 140,
            overflowY: "auto",
            margin: "6px 0"
          }}
        >
          {ICON_LIST.map(iconName => (
            <button
              key={iconName}
              type="button"
              title={iconName}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: value === iconName ? "#1976d2" : "#e0e0e0",
                border: value === iconName ? "2px solid #1976d2" : "1px solid #ccc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                color: value === iconName ? "#fff" : "#444",
                cursor: "pointer",
                outline: "none",
                transition: "all 0.15s"
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

// 顏色選擇器
function ColorPicker({ value, onChange }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 7 }}>
        {COLOR_SWATCHES.map(color => (
          <button
            key={color}
            type="button"
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              border: value === color ? "2px solid #2563eb" : "1px solid #ccc",
              background: color,
              boxShadow: value === color ? "0 0 4px #2563eb" : "none",
              cursor: "pointer",
              outline: "none"
            }}
            title={color}
            onClick={() => onChange({ target: { name: "color", value: color } })}
          />
        ))}
        {/* 保留自訂色 */}
        <label style={{ display: "inline-block", marginLeft: 6, cursor: "pointer" }}>
          <input
            type="color"
            style={{ width: 24, height: 24, border: "none", background: "none", padding: 0 }}
            value={value}
            onChange={onChange}
          />
        </label>
      </div>
    </div>
  );
}

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
    color: COLOR_SWATCHES[0],
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
      color: COLOR_SWATCHES[0],
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
            <ColorPicker value={form.color} onChange={handleFormChange} />
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