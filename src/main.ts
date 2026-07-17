import './style.css';
import { createGame } from './board';
import { initGrid, render } from './render';

let game = createGame(9, 9, 10);

initGrid(game);
render(game);