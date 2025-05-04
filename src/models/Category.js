export class Category {
    constructor(data = {}) {
      this.id = data.id || crypto.randomUUID();
      this.name = data.name || '';
      this.type = data.type || 'expense';
      this.icon = data.icon || 'tag';
      this.color = data.color || '#4CAF50';
      this.order = data.order || 0;
      this.createdAt = data.createdAt || new Date().toISOString();
      this.updatedAt = data.updatedAt || new Date().toISOString();
    }
    toJSON() { return { ...this }; }
  }