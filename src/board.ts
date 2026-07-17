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