import { planKey } from './data.js';

export function isDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function readPlan() {
  const result = { items: {}, order: [], warning: '' };
  try {
    const text = localStorage.getItem(planKey);
    if (text === null) return result;
    const saved = JSON.parse(text);
    if (!saved || saved.version !== 1 || !saved.items
      || typeof saved.items !== 'object' || Array.isArray(saved.items)
      || !Array.isArray(saved.order)) {
      throw new Error('Неизвестный формат плана');
    }
    let rejected = 0;
    for (const id of saved.order) {
      const item = Object.hasOwn(saved.items, id) ? saved.items[id] : null;
      const correctId = typeof id === 'string' && /^job-[a-zA-Z0-9-]{1,80}$/.test(id);
      const correctTask = item
        && typeof item.label === 'string'
        && item.label.trim().length > 0
        && item.label.length <= 90
        && isDate(item.deadline)
        && typeof item.finished === 'boolean';
      if (!correctId || !correctTask || Object.hasOwn(result.items, id)) {
        rejected += 1;
        continue;
      }
      result.items[id] = { label: item.label.trim(), deadline: item.deadline, finished: item.finished };
      result.order.push(id);
    }
    if (rejected) result.warning = 'Не восстановлено записей: ' + rejected + '.';
  } catch (error) {
    console.warn('Не удалось открыть план репетиций:', error);
    result.warning = 'Сохранённый план повреждён или недоступен. Можно добавить новые задачи.';
  }
  return result;
}

export function writePlan(items, order) {
  try {
    localStorage.setItem(planKey, JSON.stringify({ version: 1, items, order }));
    return '';
  } catch (error) {
    console.warn('Не удалось записать план репетиций:', error);
    return 'Браузер не сохранил изменения. До закрытия страницы можно продолжать работу.';
  }
}
