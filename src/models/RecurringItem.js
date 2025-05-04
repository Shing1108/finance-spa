export class RecurringItem {
    constructor(data = {}) {
      this.id = data.id || crypto.randomUUID();
      this.name = data.name || '';
      this.type = data.type || 'expense';
      this.amount = parseFloat(data.amount || 0);
      this.accountId = data.accountId || '';
      this.categoryId = data.categoryId || '';
      this.frequency = data.frequency || 'monthly';
      this.dayOfWeek = data.dayOfWeek || 1;
      this.dayOfMonth = data.dayOfMonth || 1;
      this.month = data.month || 1;
      this.note = data.note || '';
      this.active = data.active !== undefined ? data.active : true;
      this.autoProcess = data.autoProcess !== undefined ? data.autoProcess : false;
      this.createdAt = data.createdAt || new Date().toISOString();
      this.updatedAt = data.updatedAt || new Date().toISOString();
    }
    toJSON() { return { ...this }; }
  }