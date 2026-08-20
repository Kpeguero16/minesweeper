export type CellState = 'hidden' | 'revealed' | 'flagged';

export type Cell = {
  mine: boolean;
  adjacent: number;
  state: CellState;
}

export type GameStatus = 'ready' | 'playing' | 'won' | 'lost';

export type Game = {
  cells: Cell[];
  width: number;
  height: number;
  mineCount: number;
  status: GameStatus;
  hitIndex: number | null;
}

export const PRESETS = {
  beginner: {width: 9, height: 9, mines: 10},
  intermediate: {width: 16, height: 16, mines: 40},
  expert: {width: 30, height: 16, mines: 99},
} as const;

export type DifficultyName = keyof typeof PRESETS;

export function createGame(width: number, height: number, mineCount: number): Game {
  const cellArray: Cell[] =  Array.from({length: width * height}, ()=> ({
    mine: false,
    adjacent: 0,
    state: 'hidden'
  }));

  const gameBoard: Game = {
    cells: cellArray,
    width: width,
    height: height,
    mineCount: mineCount,
    status: 'ready',
    hitIndex: null
  }

  return gameBoard;
}

export function neighbors(game: Game, i: number): number[] {
  const x = i % game.width;
  const y = Math.floor(i / game.width);
  const result = [];
  for (let dy = -1; dy <= 1; dy++){
    for (let dx = -1; dx <= 1; dx++){
      if(dx === 0 && dy === 0){continue;}
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < game.width && ny >= 0 && ny < game.height){
        result.push(ny * game.width + nx)
      }
    }
  }
  return result;
}

function placeMines(game: Game, safeIndex: number): void {
  let forbidden = new Set([safeIndex, ...neighbors(game, safeIndex)]);
  if (game.cells.length - forbidden.size < game.mineCount) {
    forbidden = new Set([safeIndex]);
  }
  let remaining = game.mineCount;
  while(remaining > 0){
    const r = Math.floor(Math.random() * game.cells.length);
    if (!forbidden.has(r)){
      game.cells[r].mine = true;
      forbidden.add(r);
      remaining-=1;
    }
  }
  for(let i = 0; i < game.cells.length; i++){
    if(game.cells[i].mine === false){
      game.cells[i].adjacent = neighbors(game, i).filter((n) => game.cells[n].mine).length;
    }
  }
}

export function reveal(game: Game, i: number):void {
  if (game.status === 'won' || game.status === 'lost') return;

  if (game.status === 'ready'){
    placeMines(game, i);
    game.status = 'playing'
  }

  if(game.cells[i].state !== 'hidden') return;
  
  if(game.cells[i].mine){
    game.cells[i].state = 'revealed';
    game.hitIndex = i;
    game.status = 'lost';
    for (let m = 0; m < game.cells.length; m++){
      if (game.cells[m].mine){
        game.cells[m].state = 'revealed';
      }
    }
    return;
  }
  
  const stack = [i];
  while (stack.length > 0) {
    const j = stack.pop()!;
    const cell = game.cells[j];
    if (cell.state !== 'hidden') continue;
    cell.state = 'revealed';
    if (cell.adjacent === 0) {
      stack.push(...neighbors(game, j));
    }
  }
  checkWin(game);
}

export function toggleFlag(game: Game, i: number):void {
  if (game.status === 'won' || game.status === 'lost') return;
  const cell = game.cells[i];
  if(cell.state === 'hidden'){
    cell.state = 'flagged';
  }
  else if (cell.state === 'flagged'){
    cell.state = 'hidden';
  }
}

function checkWin(game: Game): void {
  if (game.cells.every((c) => c.mine || c.state === 'revealed')) {
    game.status = 'won';
  }
}

export function chord(game: Game, i: number): void {
  if (game.status === 'won' || game.status === 'lost') return;
  const cell = game.cells[i];
  if (cell.state !== 'revealed') return;
  const flaggedNeighbors = neighbors(game, i).filter((n) => game.cells[n].state === 'flagged').length;
  if (flaggedNeighbors === cell.adjacent) {
    neighbors(game, i).forEach((n) => {
      if (game.cells[n].state === 'hidden') {
        reveal(game, n);
      }
    });
  }
}