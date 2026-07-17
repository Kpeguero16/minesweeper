import './style.css';
import { createGame } from './board';
import { initGrid, render } from './render';

let game = createGame(9, 9, 10);

initGrid(game);
render(game);

const gridEl = document.querySelector<HTMLDivElement>('#grid')!;

/** Which cell did this event land on? null if it hit a border/gap. */
function cellIndexFromEvent(e: Event): number | null {
  const btn = (e.target as HTMLElement).closest('button[data-index]');
  if (!btn) return null;
  return Number((btn as HTMLElement).dataset.index);
}

gridEl.addEventListener('click', (e) => {
  const i = cellIndexFromEvent(e);
  if (i === null) return;
});