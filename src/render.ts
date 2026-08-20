import type { Game } from './board';

const gridEl = document.querySelector<HTMLDivElement>('#grid')!;
const counterEl = document.querySelector<HTMLSpanElement>('#counter')!;
const faceEl = document.querySelector<HTMLButtonElement>('#face')!;

export function formatCounter(value: number): string {
  if (value < 0) {
    return `-${String(Math.abs(value)).padStart(2, '0')}`;
  }
  return String(value).padStart(3, '0');
}

export function updateFace(game: Game): void {
  if (game.status === 'lost') {
    faceEl.textContent = '😵';
  }
  else if (game.status === 'won') {
    faceEl.textContent = '😎';
  }
  else {
    faceEl.textContent = '🙂';
  }
}

export function initGrid(game: Game): void {
  gridEl.innerHTML = '';
  gridEl.style.gridTemplateColumns = `repeat(${game.width}, var(--cell-size))`;
  for (let i = 0; i < game.cells.length; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cell';
    btn.dataset.index = String(i);
    gridEl.appendChild(btn);
  }
}

export function render(game: Game): void {
  for (let i = 0; i < game.cells.length; i++) {
    const cell = game.cells[i];
    const btn = gridEl.children[i] as HTMLButtonElement;

    if (cell.state === 'flagged' && game.status === 'lost' && cell.mine === false) {
      btn.className = 'cell wrong';
      btn.textContent = '❌'
    }
    else if (cell.state === 'flagged') {
      btn.className = 'cell';
      btn.textContent = '🚩'
    }
    else if (cell.state === 'hidden') {
      btn.className = 'cell';
      btn.textContent = '';
    }
    else if (cell.state === 'revealed' && cell.mine === true && i === game.hitIndex) {
      btn.className = 'cell revealed hit'
      btn.textContent = '💣'
    }
    else if (cell.state === 'revealed' && cell.mine === true) {
      btn.className = 'cell revealed';
      btn.textContent = '💣'
    }
    else if (cell.adjacent > 0) {
      btn.className = `cell revealed n${cell.adjacent}`;
      btn.textContent = String(cell.adjacent);
    }
    else {
      btn.className = 'cell revealed';
      btn.textContent = '';
    }
  }
  const numberOfFlags = game.cells.filter(cell => cell.state === 'flagged').length;
  const minesLeft = game.mineCount - numberOfFlags;
  counterEl.textContent = formatCounter(minesLeft);

  updateFace(game);
}