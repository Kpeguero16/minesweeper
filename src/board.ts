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