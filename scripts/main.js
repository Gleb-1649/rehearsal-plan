import { views, dateOrders } from './data.js';
import { isDate, readPlan, writePlan } from './storage.js';

function make(tag, text = '') {
  const node = document.createElement(tag);
  node.textContent = text;
  return node;
}

document.title = 'План репетиций';
const encoding = make('meta');
encoding.setAttribute('charset', 'UTF-8');
const screen = make('meta');
screen.name = 'viewport';
screen.content = 'width=device-width, initial-scale=1';
const stylesheet = make('link');
stylesheet.rel = 'stylesheet';
stylesheet.href = 'styles/main.css';
const icon = make('link');
icon.rel = 'icon';
icon.href = 'images/favicon.svg';
document.head.append(encoding, screen, stylesheet, icon);

const masthead = make('header');
masthead.className = 'masthead';
const title = make('h1', 'План репетиций');
const subtitle = make('p', 'Партии, упражнения и подготовка к выступлениям');
masthead.append(title, subtitle);
const main = make('main');
const top = make('div');
top.className = 'top-line';
const progress = make('p', 'Записей пока нет');
const addButton = make('button', 'Новая задача');
addButton.id = 'new-task';
addButton.type = 'button';
addButton.disabled = true;
top.append(progress, addButton);
const notice = make('p');
notice.id = 'notice';
notice.setAttribute('role', 'status');
const diskNotice = make('p');
diskNotice.className = 'disk-notice';
diskNotice.setAttribute('role', 'status');
const board = make('section');
board.setAttribute('aria-labelledby', 'board-title');
const boardTitle = make('h2', 'Задачи');
boardTitle.id = 'board-title';
boardTitle.tabIndex = -1;
const cards = make('ul');
cards.className = 'cards';
const nothing = make('p', 'Добавьте задачу, например: разобрать партию к пятнице.');
nothing.className = 'nothing';
board.append(boardTitle, cards, nothing);
main.append(top, notice, diskNotice, board);
document.body.append(masthead, main, make('footer', 'Одна задача — один понятный шаг.'));

let items = {};
let sequence = [];
let currentId = null;
addButton.disabled = false;
const dialog = make('dialog');
const editor = make('form');
const editorTitle = make('h2', 'Новая задача');
editorTitle.id = 'editor-title';
dialog.setAttribute('aria-labelledby', editorTitle.id);
function editorField(text, id, type) {
  const wrapper = make('div');
  wrapper.className = 'editor-field';
  const label = make('label', text);
  label.htmlFor = id;
  const control = make('input');
  control.type = type;
  control.id = id;
  control.name = id;
  control.required = true;
  wrapper.append(label, control);
  editor.append(wrapper);
  return control;
}
editor.append(editorTitle);
const taskName = editorField('Задача', 'name-input', 'text');
taskName.maxLength = 90;
const deadline = editorField('Дата', 'deadline-input', 'date');
const saveButton = make('button', 'Записать');
saveButton.type = 'submit';
const closeButton = make('button', 'Закрыть без сохранения');
closeButton.type = 'button';
closeButton.className = 'secondary';
editor.append(saveButton, closeButton);
dialog.append(editor);
document.body.append(dialog);

function openEditor(id = null) {
  currentId = id;
  editor.reset();
  taskName.setCustomValidity('');
  deadline.setCustomValidity('');
  editorTitle.textContent = id ? 'Изменить задачу' : 'Новая задача';
  if (id) {
    taskName.value = items[id].label;
    deadline.value = items[id].deadline;
  }
  dialog.showModal();
  taskName.focus();
}
addButton.addEventListener('click', () => openEditor());
closeButton.addEventListener('click', () => dialog.close());
editor.addEventListener('input', event => event.target.setCustomValidity(''));
editor.addEventListener('submit', event => {
  event.preventDefault();
  taskName.value = taskName.value.trim();
  taskName.setCustomValidity(taskName.value ? '' : 'Напишите, что нужно сделать.');
  deadline.setCustomValidity(isDate(deadline.value) ? '' : 'Проверьте дату.');
  if (!editor.reportValidity()) return;
  if (currentId) {
    items[currentId].label = taskName.value;
    items[currentId].deadline = deadline.value;
  } else {
    const id = 'job-' + crypto.randomUUID();
    items[id] = { label: taskName.value, deadline: deadline.value, finished: false };
    sequence.push(id);
  }
  dialog.close();
  update();
  notice.textContent = currentId ? 'Задача изменена.' : 'Новая задача записана.';
  const editedButton = currentId ? document.getElementById('edit-' + currentId) : null;
  (editedButton || addButton).focus();
});

function actionButton(caption, action, id) {
  const button = make('button', caption);
  button.type = 'button';
  button.dataset.action = action;
  button.id = action + '-' + id;
  return button;
}

function update() {
  const writeWarning = writePlan(items, sequence);
  if (writeWarning) {
    diskNotice.textContent = loadWarning ? loadWarning + ' ' + writeWarning : writeWarning;
  } else {
    loadWarning = '';
    diskNotice.textContent = '';
  }
  paint();
}

function paint() {
  const focusedId = document.activeElement.id;
  let visible = sequence.slice();
  visible = filterIds();
  if (sorting.value === 'forward') visible.sort((a, b) => items[a].deadline.localeCompare(items[b].deadline));
  if (sorting.value === 'backward') visible.sort((a, b) => items[b].deadline.localeCompare(items[a].deadline));
  cards.replaceChildren();
  for (const id of visible) {
    const item = items[id];
    const li = make('li');
    li.dataset.key = id;
    li.className = item.finished ? 'card finished' : 'card';
    const article = make('article');
    const label = make('h3', item.label);
    const date = make('time', item.deadline.split('-').reverse().join('.'));
    date.dateTime = item.deadline;
    const badge = make('p', item.finished ? 'Готово' : 'В работе');
    badge.className = 'badge';
    const actions = make('div');
    actions.className = 'card-actions';
    const toggle = actionButton(item.finished ? 'Вернуть в работу' : 'Готово', 'toggle', id);
    toggle.setAttribute('aria-pressed', String(item.finished));
    actions.append(toggle, actionButton('Править', 'edit', id), actionButton('Убрать', 'delete', id));
    article.append(date, label, badge, actions);
    li.append(article);
    li.draggable = canArrange();
    li.title = canArrange() ? 'Перетащите карточку на другую, чтобы поменять порядок' : '';
    cards.append(li);
  }
  const completed = sequence.filter(id => items[id].finished).length;
  progress.textContent = 'Готово ' + completed + ' из ' + sequence.length + '. На экране: ' + visible.length + '.';
  nothing.hidden = visible.length > 0;
  nothing.textContent = sequence.length ? 'Ничего не найдено. Попробуйте изменить условия.' : 'Добавьте задачу, например: разобрать партию к пятнице.';
  const focused = document.getElementById(focusedId);
  if (focused && !focused.disabled) focused.focus();
  else if (focusedId.startsWith('toggle-')) boardTitle.focus();
}

cards.addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const id = button.closest('[data-key]').dataset.key;
  if (button.dataset.action === 'edit') openEditor(id);
  if (button.dataset.action === 'toggle') {
    items[id].finished = !items[id].finished;
    update();
    notice.textContent = items[id].finished ? 'Отмечено как выполненное.' : 'Задача снова в работе.';
  }
  if (button.dataset.action === 'delete') {
    delete items[id];
    sequence = sequence.filter(key => key !== id);
    update();
    notice.textContent = 'Задача удалена.';
    boardTitle.focus();
  }
});

let selectedView = 'any';
const tabs = make('div');
tabs.className = 'tabs';
tabs.setAttribute('role', 'group');
tabs.setAttribute('aria-label', 'Состояние задач');
for (const view of views) {
  const button = make('button', view.caption);
  button.type = 'button';
  button.dataset.view = view.value;
  button.setAttribute('aria-pressed', String(view.value === selectedView));
  tabs.append(button);
}
tabs.addEventListener('click', event => {
  const button = event.target.closest('[data-view]');
  if (!button) return;
  selectedView = button.dataset.view;
  refreshTabs();
  paint();
});
function refreshTabs() {
  for (const button of tabs.children) button.setAttribute('aria-pressed', String(button.dataset.view === selectedView));
}
const tools = make('div');
tools.className = 'tools';
function toolField(caption, id, type) {
  const group = make('div');
  const label = make('label', caption);
  label.htmlFor = id;
  const input = make('input');
  input.id = id;
  input.type = type;
  group.append(label, input);
  tools.append(group);
  return input;
}
const query = toolField('Поиск по названию', 'query', 'search');
const start = toolField('С даты', 'start-date', 'date');
const finish = toolField('По дату', 'finish-date', 'date');
const rangeMessage = make('p');
rangeMessage.className = 'range-message';
rangeMessage.setAttribute('role', 'status');
const clear = make('button', 'Очистить фильтры');
clear.type = 'button';
clear.className = 'secondary';
tools.append(clear);
clear.addEventListener('click', () => {
  query.value = '';
  start.value = '';
  finish.value = '';
  selectedView = 'any';
  refreshTabs();
  sorting.value = 'own';
  paint();
});
tools.addEventListener('input', paint);
tools.addEventListener('change', paint);
main.insertBefore(tabs, board);
main.insertBefore(tools, board);
main.insertBefore(rangeMessage, board);

function filterIds() {
  const invalidRange = start.value && finish.value && start.value > finish.value;
  rangeMessage.textContent = invalidRange ? 'Начало периода позже конца. Исправьте даты.' : '';
  if (invalidRange) return [];
  const needle = query.value.trim().toLocaleLowerCase('ru');
  return sequence.filter(id => {
    const item = items[id];
    if (selectedView === 'finished' && !item.finished) return false;
    if (selectedView === 'waiting' && item.finished) return false;
    if (start.value && item.deadline < start.value) return false;
    if (finish.value && item.deadline > finish.value) return false;
    return item.label.toLocaleLowerCase('ru').includes(needle);
  });
}
const saved = readPlan();
items = saved.items;
sequence = saved.order;
let loadWarning = saved.warning;
diskNotice.textContent = loadWarning;

const sortGroup = make('div');
const sortLabel = make('label', 'Расположение');
sortLabel.htmlFor = 'arrangement';
const sorting = make('select');
sorting.id = 'arrangement';
for (const entry of dateOrders) {
  const option = make('option', entry.caption);
  option.value = entry.value;
  sorting.append(option);
}
sortGroup.append(sortLabel, sorting);
tools.insertBefore(sortGroup, clear);
const hint = make('p', 'Порядок меняется перетаскиванием карточек, когда выбран «Как расставил я» и очищены фильтры.');
hint.className = 'arrange-hint';
board.insertBefore(hint, cards);
let dragging = null;

function canArrange() {
  return sorting.value === 'own'
    && selectedView === 'any'
    && !query.value.trim()
    && !start.value
    && !finish.value;
}

function arrange(id, anchor, after) {
  if (!canArrange() || id === anchor || !sequence.includes(id) || !sequence.includes(anchor)) return;
  sequence.splice(sequence.indexOf(id), 1);
  sequence.splice(sequence.indexOf(anchor) + (after ? 1 : 0), 0, id);
  update();
  notice.textContent = 'Карточки расставлены в новом порядке.';
  document.getElementById('edit-' + id).focus();
}

cards.addEventListener('dragstart', event => {
  const card = event.target.closest('[data-key]');
  if (!card || !canArrange()) { event.preventDefault(); return; }
  dragging = card.dataset.key;
  event.dataTransfer.setData('text/plain', dragging);
  event.dataTransfer.effectAllowed = 'move';
  card.classList.add('dragging');
});
cards.addEventListener('dragover', event => {
  const card = event.target.closest('[data-key]');
  if (!card || !dragging || !canArrange()) return;
  event.preventDefault();
  for (const child of cards.children) child.classList.toggle('drop-target', child === card);
});
cards.addEventListener('drop', event => {
  event.preventDefault();
  const target = event.target.closest('[data-key]');
  if (!target || !dragging || event.dataTransfer.getData('text/plain') !== dragging) return;
  const rect = target.getBoundingClientRect();
  arrange(dragging, target.dataset.key, event.clientX > rect.left + rect.width / 2);
  dragging = null;
  clearDragStyles();
});
function clearDragStyles() {
  for (const card of cards.children) card.classList.remove('dragging', 'drop-target');
}
cards.addEventListener('dragend', () => { dragging = null; clearDragStyles(); });


paint();
