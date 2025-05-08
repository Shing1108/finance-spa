export class Account {
  constructor(data = {}) {
    this.id = data.id || crypto.randomUUID();
    this.name = data.name || '';
    this.type = data.type || 'cash';
    // 用戶輸入的初始餘額（只在新增時設定一次）
    this.initialBalance = typeof data.initialBalance === "number"
      ? data.initialBalance
      : typeof data.balance === "number"
        ? data.balance
        : parseFloat(data.initialBalance ?? data.balance ?? 0);
    this.balance = this.initialBalance; // 實際餘額由 recalculate 決定
    this.currency = data.currency || 'HKD';
    this.note = data.note || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.order = data.order || 0;
  }
  toJSON() { return { ...this }; }
}