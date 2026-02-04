import { describe, expect, it } from 'vitest';
import type { SnakeState } from '../types';
import { stepSnake, withDirection } from './engine';

function makeState(patch: Partial<SnakeState>): SnakeState {
  return {
    width: 5,
    height: 5,
    snake: [
      { x: 2, y: 2 },
      { x: 1, y: 2 },
      { x: 0, y: 2 },
    ],
    direction: 'Right',
    pendingDirection: 'Right',
    food: { x: 4, y: 4 },
    score: 0,
    tick: 0,
    status: 'running',
    ...patch,
  };
}

describe('Snake engine', () => {
  it('moves forward and keeps length when not eating', () => {
    const s = makeState({});
    const n = stepSnake(s, () => 0);
    expect(n.status).toBe('running');
    expect(n.snake.length).toBe(3);
    expect(n.snake[0]).toEqual({ x: 3, y: 2 });
    expect(n.snake[2]).toEqual({ x: 1, y: 2 });
    expect(n.score).toBe(0);
  });

  it('eats food and grows', () => {
    const s = makeState({ food: { x: 3, y: 2 } });
    const n = stepSnake(s, () => 0);
    expect(n.status).toBe('running');
    expect(n.snake.length).toBe(4);
    expect(n.snake[0]).toEqual({ x: 3, y: 2 });
    expect(n.score).toBe(1);
    for (const p of n.snake) {
      expect(!(p.x === n.food.x && p.y === n.food.y)).toBe(true);
    }
  });

  it('game over when hitting wall', () => {
    const s = makeState({
      snake: [
        { x: 4, y: 2 },
        { x: 3, y: 2 },
        { x: 2, y: 2 },
      ],
      direction: 'Right',
      pendingDirection: 'Right',
    });
    const n = stepSnake(s, () => 0);
    expect(n.status).toBe('game_over');
  });

  it('game over when hitting body', () => {
    const s = makeState({
      width: 6,
      height: 6,
      snake: [
        { x: 2, y: 2 },
        { x: 1, y: 2 },
        { x: 1, y: 3 },
        { x: 2, y: 3 },
      ],
      direction: 'Left',
      pendingDirection: 'Left',
      food: { x: 5, y: 5 },
    });
    const n = stepSnake(s, () => 0);
    expect(n.status).toBe('game_over');
  });

  it('ignores opposite direction change', () => {
    const s = makeState({ direction: 'Right', pendingDirection: 'Right' });
    const n = withDirection(s, 'Left');
    expect(n.pendingDirection).toBe('Right');
  });
});

