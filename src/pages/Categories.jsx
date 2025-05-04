import { useFinanceStore } from "../store/financeStore";
import { useState, useMemo } from "react";
import { Modal } from "../components/Modal";

// dnd-kit
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  TouchSensor
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// 可拖曳分類卡片（僅在左側把手可拖，其餘區域可點擊）
function SortableCategoryCard({ cat, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: cat.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: "default",
    position: "relative", // 讓拖曳把手能定位
    userSelect: "none"
  };
  return (
    <div ref={setNodeRef} style={style} className="category-card">
      {/* 拖曳把手（僅此區塊可拖曳） */}
      <div
        style={{
          position: "absolute",
          left: 12,
          top: 20,
          zIndex: 2,
          cursor: "grab",
          fontSize: 20,
          color: "#888",
          background: "none"
        }}
        {...attributes}
        {...listeners}
        onClick={e => e.stopPropagation()}
        aria-label="拖曳排序"
        tabIndex={0}
      >
        <i className="fas fa-grip-vertical"></i>
      </div>
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
    icon: "tag",
    color: "#4CAF50",
    order: 0,
  });

  // 只顯示當前類型
  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === tab).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [categories, tab]
  );

  // dnd-kit 感測器
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor)
  );
  

  // 拖曳排序完成
  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = filteredCategories.findIndex(c => c.id === active.id);
    const newIndex = filteredCategories.findIndex(c => c.id === over.id);
    const newOrderArray = arrayMove(filteredCategories, oldIndex, newIndex);

    // 直接依新順序更新 order
    newOrderArray.forEach((cat, idx) => {
      updateCategory(cat.id, { order: idx });
    });
  }

  function openAddModal(type) {
    setEditCat(null);
    setForm({
      name: "",
      type,
      icon: "tag",
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
      // 新增時 order 設為當前最後
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredCategories.map(c => c.id)} strategy={verticalListSortingStrategy}>
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
          </SortableContext>
        </DndContext>
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editCat ? "編輯類別" : "新增類別"}>
        <form onSubmit={handleFormSubmit}>
          <div className="form-group">
            <label>名稱</label>
            <input className="form-control" name="name" value={form.name} onChange={handleFormChange} required />
          </div>
          <div className="form-group">
            <label>圖標(FontAwesome 名稱)</label>
            <input className="form-control" name="icon" value={form.icon} onChange={handleFormChange} required />
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