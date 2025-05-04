// utils/mergeByUpdatedAt.js
export function mergeByUpdatedAt(localArr = [], cloudArr = []) {
    const map = {};
    [...localArr, ...cloudArr].forEach(item => {
      if (!item || !item.id) return;
      const old = map[item.id];
      if (!old || (item.updatedAt && item.updatedAt > (old.updatedAt || ""))) {
        map[item.id] = item;
      }
    });
    return Object.values(map);
  }