import { useFinanceStore } from "./financeStore";

export function seedDefaultData() {
  const { categories, addCategory } = useFinanceStore.getState();
  if (categories.length === 0) {
    [
      { name: "薪資", type: "income", icon: "money-bill-wave", color: "#4CAF50" },
      { name: "獎金", type: "income", icon: "gift", color: "#9C27B0" },
      { name: "投資收益", type: "income", icon: "chart-line", color: "#2196F3" },
      { name: "利息", type: "income", icon: "percentage", color: "#3F51B5" },
      { name: "租金", type: "income", icon: "home", color: "#009688" },
      { name: "其他收入", type: "income", icon: "plus-circle", color: "#FF9800" },
      { name: "餐飲", type: "expense", icon: "utensils", color: "#F44336" },
      { name: "交通", type: "expense", icon: "bus", color: "#FF9800" },
      { name: "購物", type: "expense", icon: "shopping-bag", color: "#E91E63" },
      { name: "住房", type: "expense", icon: "home", color: "#795548" },
      { name: "娛樂", type: "expense", icon: "film", color: "#9C27B0" },
      { name: "醫療", type: "expense", icon: "hospital", color: "#2196F3" },
      { name: "教育", type: "expense", icon: "book", color: "#3F51B5" },
      { name: "通訊", type: "expense", icon: "mobile-alt", color: "#009688" },
      { name: "服裝", type: "expense", icon: "tshirt", color: "#673AB7" },
      { name: "保險", type: "expense", icon: "shield-alt", color: "#607D8B" },
      { name: "其他支出", type: "expense", icon: "minus-circle", color: "#FF5722" }
    ].forEach(addCategory);
  }
}