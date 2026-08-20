import './style.css';
import { createGame, reveal, toggleFlag, chord } from './board';
import { initGrid, render } from './render';

let game = createGame(9, 9, 10);
let flagMode = false;

initGrid(game);
render(game);

const gridEl = document.querySelector<HTMLDivElement>('#grid')!;
const flagModeBtn = document.querySelector<HTMLButtonElement>('#flag-mode')!;
const faceBtn = document.querySelector<HTMLButtonElement>('#face')!;

/** Which cell did this event land on? null if it hit a border/gap. */
function cellIndexFromEvent(e: Event): number | null {
  const btn = (e.target as HTMLElement).closest('button[data-index]');
  if (!btn) return null;
  return Number((btn as HTMLElement).dataset.index);
}

function newGame(width: number, height: number, mines: number): void {
  game = createGame(width, height, mines);
  initGrid(game);
  render(game);
}

faceBtn.addEventListener('click', () => {
  newGame(9, 9, 10);
});

flagModeBtn.addEventListener('click', () => {
  flagMode = !flagMode;
  flagModeBtn.setAttribute('aria-pressed', String(flagMode));
  if (flagMode) {
    flagModeBtn.innerText = '🚩 Flag mode: on';
  } else {
    flagModeBtn.innerText = '🚩 Flag mode: off';
  }
});

gridEl.addEventListener('click', (e) => {
  const i = cellIndexFromEvent(e);
  if (i === null) return;
  if (game.cells[i].state === 'revealed') {
    chord(game, i);
  } else if (flagMode) {
    toggleFlag(game, i);
  } else {
    reveal(game, i);
  }
  render(game);
});

gridEl.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  const i = cellIndexFromEvent(e);
  if (i === null) return;
  toggleFlag(game, i);
  render(game);
});
