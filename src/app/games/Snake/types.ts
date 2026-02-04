export type Direction = 'Up' | 'Down' | 'Left' | 'Right';

export type Point = {
  x: number;
  y: number;
};

export type SnakeStatus = 'running' | 'paused' | 'game_over';

export type SnakeState = {
  width: number;
  height: number;
  snake: Point[];
  direction: Direction;
  pendingDirection: Direction;
  food: Point;
  score: number;
  tick: number;
  status: SnakeStatus;
};

export type SnakeSettings = {
  width: number;
  height: number;
  tickMs: number;
};

