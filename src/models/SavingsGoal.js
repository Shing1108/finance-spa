export class SavingsGoal {
    constructor(data = {}) {
      this.id = data.id || crypto.randomUUID();
      this.name = data.name || '';
      this.targetAmount = parseFloat(data.targetAmount || 0);
      this.currentAmount = parseFloat(data.currentAmount || 0);
      this.currency = data.currency || 'HKD';
      this.deadline = data.deadline || '';
      this.note = data.note || '';
      this.accountId = data.accountId ?? null;
      this.createdAt = data.createdAt || new Date().toISOString();
      this.updatedAt = data.updatedAt || new Date().toISOString();
      this.completed = data.completed || false;
    }
    toJSON() { return { ...this }; }
  }