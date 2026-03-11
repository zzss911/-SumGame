export type GameMode = 'classic' | 'time';

export interface BlockData {
  id: string;
  value: number;
  row: number;
  col: number;
  isRemoving?: boolean;
}

export interface GameState {
  grid: BlockData[];
  target: number;
  score: number;
  highScore: number;
  gameOver: boolean;
  selectedIds: string[];
  mode: GameMode;
  timeLeft: number;
  level: number;
}

export const GRID_COLS = 6;
export const GRID_ROWS = 10;
export const INITIAL_ROWS = 4;
export const MAX_TARGET = 30;
export const MIN_TARGET = 10;
