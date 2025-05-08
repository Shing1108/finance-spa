// models/Transaction.js
import dayjs from "dayjs";
export class Transaction {
  constructor(data = {}) {
    this.id = data.id || crypto.randomUUID();
    this.type = data.type || 'expense';
    this.amount = parseFloat(data.amount || 0);
    this.originalAmount = parseFloat(data.originalAmount ?? this.amount);
    this.accountId = data.accountId || '';
    this.toAccountId = data.toAccountId || '';
    this.categoryId = data.categoryId || '';
    this.date = dayjs(data.date || new Date()).format("YYYY-MM-DD");
    this.note = data.note || '';
    this.currency = data.currency || 'HKD';
    this.originalCurrency = data.originalCurrency || this.currency;
    this.exchangeRate = parseFloat(data.exchangeRate || 1);
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }
  toJSON() { return { ...this }; }
}