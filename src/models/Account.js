// models/Account.js
export class Account {
  constructor(data = {}) {
    this.id = data.id || crypto.randomUUID();
    this.name = data.name || '';
    this.type = data.type || 'cash';
    this.initialBalance =
      typeof data.initialBalance === "number"
        ? data.initialBalance
        : typeof data.balance === "number"
          ? data.balance
          : parseFloat(data.balance ?? 0);
    this.balance = this.initialBalance;
    this.currency = data.currency || 'HKD';
    this.note = data.note || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.order = data.order || 0;
  }
  toJSON() { return { ...this }; }
}