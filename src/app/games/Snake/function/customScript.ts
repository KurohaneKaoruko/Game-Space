import type { Direction, SnakeState } from '../types';
import { movePoint, samePoint, isOpposite } from './engine';

export const DirectionValues = {
  Up: 'Up',
  Down: 'Down',
  Left: 'Left',
  Right: 'Right',
} as const;

export type CustomScriptContext = {
  state: SnakeState;
  utils: {
    movePoint: typeof movePoint;
    samePoint: typeof samePoint;
    isOpposite: typeof isOpposite;
    Direction: typeof DirectionValues;
  };
};

export class CustomScriptExecutor {
  private static DEFAULT_SCRIPT = `
// Available variables:
// state: SnakeState { width, height, snake[], food, direction, score... }
// utils: { movePoint, samePoint, isOpposite }

// Must return a direction string: 'Up' | 'Down' | 'Left' | 'Right'

function think(state, utils) {
  const head = state.snake[0];
  const food = state.food;
  const currentDir = state.direction;
  
  // 1. Determine desired directions towards food
  const preferred = [];
  if (food.x > head.x) preferred.push('Right');
  if (food.x < head.x) preferred.push('Left');
  if (food.y > head.y) preferred.push('Down');
  if (food.y < head.y) preferred.push('Up');
  
  // 2. Pick the first preferred direction that isn't a 180-degree turn
  for (const d of preferred) {
    if (!utils.isOpposite(currentDir, d)) {
      return d;
    }
  }
  
  // 3. If all preferred moves are 180 turns (e.g. food is directly behind),
  // pick any valid direction to turn around
  const all = ['Up', 'Down', 'Left', 'Right'];
  for (const d of all) {
    if (!utils.isOpposite(currentDir, d)) {
      return d;
    }
  }
  
  return 'Right';
}

return think(state, utils);
`.trim();

  static getDefaultScript(): string {
    return this.DEFAULT_SCRIPT;
  }

  static execute(script: string, context: CustomScriptContext): Direction | null {
    try {
      // Create a safe-ish execution environment
      // Note: This is client-side code, so security risk is low (user hacking themselves),
      // but we still wrap it to prevent crashing the app.
      
      const func = new Function('state', 'utils', script);
      const result: unknown = func(context.state, context.utils);

      if (result === 'Up' || result === 'Down' || result === 'Left' || result === 'Right') {
        return result;
      }
      return null;
    } catch (e) {
      console.error('Custom script execution failed:', e);
      return null;
    }
  }
}

// Helper to validate script syntax (basic check)
export function validateScript(script: string): { valid: boolean; error?: string } {
  try {
    new Function('state', 'utils', script);
    return { valid: true };
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : String(e);
    return { valid: false, error };
  }
}
