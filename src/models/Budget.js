export class Budget {
    constructor(data = {}) {
      this.id = data.id || crypto.randomUUID();
      this.categoryId = data.categoryId || '';
      this.amount = parseFloat(data.amount || 0);
      this.period = data.period || 'monthly';
      this.year = data.year || new Date().getFullYear();
      this.month = data.month || (new Date().getMonth() + 1);
      this.quarter = data.quarter || Math.ceil((new Date().getMonth() + 1) / 3);
      this.createdAt = data.createdAt || new Date().toISOString();
      this.updatedAt = data.updatedAt || new Date().toISOString();
    }
    toJSON() { return { ...this }; }
  }