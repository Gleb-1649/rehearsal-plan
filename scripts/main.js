
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





