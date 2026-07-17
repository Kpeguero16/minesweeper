import type { Game } from './board';

const gridEl = document.querySelector<HTMLDivElement>('#grid')!;

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
  // TO-DO
}