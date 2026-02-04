import { describe, expect, it } from 'vitest';
import type { SnakeState } from '../types';
import { getAIMove } from './aiEngine';
import { validNextDirections } from './engine';

function makeState(patch: Partial<SnakeState>): SnakeState {
  return {
    width: 7,
    height: 7,
    snake: [
      { x: 3, y: 3 },
      { x: 2, y: 3 },
      { x: 1, y: 3 },
    ],
    direction: 'Right',
    pendingDirection: 'Right',
    food: { x: 5, y: 3 },
    score: 0,
    tick: 0,
    status: 'running',
    ...patch,
  };
}

describe('Snake AI', () => {
  it('chooses a legal direction', () => {
    const s = makeState({});
    const move = getAIMove(s);
    const legal = validNextDirections(s);
    expect(legal.includes(move.direction)).toBe(true);
  });

  it('moves toward food in a simple straight scenario', () => {
    const s = makeState({ food: { x: 4, y: 3 } });
    const move = getAIMove(s);
    expect(move.direction).toBe('Right');
  });

  it('handles cramped states without crashing', () => {
    const s = makeState({
      width: 5,
      height: 5,
      snake: [
        { x: 2, y: 2 },
        { x: 2, y: 3 },
        { x: 1, y: 3 },
        { x: 1, y: 2 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 3, y: 1 },
        { x: 3, y: 2 },
        { x: 3, y: 3 },
      ],
      direction: 'Up',
      pendingDirection: 'Up',
      food: { x: 0, y: 0 },
    });
    const move = getAIMove(s);
    const legal = validNextDirections(s);
    if (legal.length === 0) {
      expect(move.strategy).toBe('fallback');
      expect(move.direction).toBe(s.direction);
    } else {
      expect(legal.includes(move.direction)).toBe(true);
    }
  });
});
