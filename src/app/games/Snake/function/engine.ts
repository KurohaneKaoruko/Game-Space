import type { Direction, Point, SnakeState } from '../types';

export type RNG = () => number;

export function isOpposite(a: Direction, b: Direction): boolean {
  return (
    (a === 'Up' && b === 'Down') ||
    (a === 'Down' && b === 'Up') ||
    (a === 'Left' && b === 'Right') ||
    (a === 'Right' && b === 'Left')
  );
}

export function movePoint(p: Point, dir: Direction): Point {
  if (dir === 'Up') return { x: p.x, y: p.y - 1 };
  if (dir === 'Down') return { x: p.x, y: p.y + 1 };
  if (dir === 'Left') return { x: p.x - 1, y: p.y };
  return { x: p.x + 1, y: p.y };
}

export function samePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

export function inBounds(p: Point, width: number, height: number): boolean {
  return p.x >= 0 && p.x < width && p.y >= 0 && p.y < height;
}

export function snakeOccupies(snake: Point[], p: Point): boolean {
  for (let i = 0; i < snake.length; i++) {
    if (samePoint(snake[i], p)) return true;
  }
  return false;
}

export function createFood(width: number, height: number, snake: Point[], rng: RNG): Point {
  const free: Point[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = { x, y };
      if (!snakeOccupies(snake, p)) free.push(p);
    }
  }
  if (free.length === 0) return { x: 0, y: 0 };
  const idx = Math.floor(rng() * free.length) % free.length;
  return free[idx];
}

export function createInitialState(settings: { width: number; height: number }, rng: RNG = Math.random): SnakeState {
  const width = Math.max(5, Math.floor(settings.width));
  const height = Math.max(5, Math.floor(settings.height));
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);

  const snake: Point[] = [
    { x: cx, y: cy },
    { x: cx - 1, y: cy },
  ];

  // For initial state (SSR hydration safety), we use a deterministic "random" food
  // Or simply place it at a fixed safe spot if we want to avoid RNG issues during hydration.
  // Ideally, components should use useEffect to randomize, but here we can just pick a safe spot.
  // Let's use a simple deterministic fallback if we suspect hydration issues, 
  // but better yet, let's just use the provided rng (which defaults to Math.random).
  // The user's error suggests server/client mismatch.
  // We can fix this by forcing food to be at (0,0) or similar initially, then randomizing on mount.
  // OR, we just make sure the initial render is deterministic.
  
  // To fix hydration error: Initial food is ALWAYS at a fixed location (e.g. 0,0 or corner).
  // The actual game start will re-randomize it?
  // No, let's just put it at a fixed safe spot (e.g. top-left corner, if not occupied).
  // Snake is at center. (0,0) is safe.
  
  const food = { x: 0, y: 0 }; 

  return {
    width,
    height,
    snake,
    direction: 'Right',
    pendingDirection: 'Right',
    food,
    score: 0,
    tick: 0,
    status: 'running',
  };
}

export function withDirection(state: SnakeState, next: Direction): SnakeState {
  if (isOpposite(state.direction, next)) return state;
  if (state.pendingDirection === next) return state;
  return { ...state, pendingDirection: next };
}

export function stepSnake(state: SnakeState, rng: RNG = Math.random): SnakeState {
  if (state.status !== 'running') return state;

  const dir = state.pendingDirection;
  const head = state.snake[0];
  const nextHead = movePoint(head, dir);

  if (!inBounds(nextHead, state.width, state.height)) {
    return { ...state, status: 'game_over' };
  }

  // Self-collision check: must check against the *current* snake body.
  // Note: If we don't eat, the tail will move away, so hitting the current tail is safe?
  // Actually, standard snake rules say you can't hit your own body.
  // If we move into a cell occupied by the body (except possibly the tail if it moves), it's a hit.
  // Strictly speaking: 
  //   Next body = [nextHead, body[0], body[1], ... body[n-1]] (if not eating)
  //   Collision if nextHead is in [body[0], ... body[n-1]]
  //   Wait, body[n-1] is the current tail. If not eating, it disappears.
  //   So we check nextHead against body[0]...body[n-2].
  
  //   If eating:
  //   Next body = [nextHead, body[0], ... body[n]]
  //   Collision if nextHead is in body.
  
  const willEat = samePoint(nextHead, state.food);
  
  // Check collision with *current* snake body
  // We iterate through the body.
  // If we are NOT eating, the last segment (tail) will be removed, so hitting it is safe.
  // If we ARE eating, the tail stays, so hitting it is fatal (though rare to hit tail directly after eating unless len=2 loop?)
  
  const ignoreTail = !willEat;
  for (let i = 0; i < state.snake.length; i++) {
    if (ignoreTail && i === state.snake.length - 1) continue;
    if (samePoint(state.snake[i], nextHead)) {
       // Collision!
       // Special case: Reverse gear? (Head hits neck).
       // This is prevented by `withDirection` logic usually, but AI might force it?
       // `stepSnake` uses `state.pendingDirection` which should be valid.
       return { ...state, status: 'game_over' };
    }
  }

  const nextSnake = [nextHead, ...state.snake];
  if (!willEat) nextSnake.pop();

  // Redundant check removed since we checked above more accurately
  // for (let i = 1; i < nextSnake.length; i++) { ... }

  if (willEat && nextSnake.length >= state.width * state.height) {
    return {
      ...state,
      snake: nextSnake,
      direction: dir,
      pendingDirection: dir,
      food: { x: -1, y: -1 },
      score: state.score + 1,
      tick: state.tick + 1,
      status: 'passed',
    };
  }

  const nextFood = willEat ? createFood(state.width, state.height, nextSnake, rng) : state.food;
  const nextScore = willEat ? state.score + 1 : state.score;

  return {
    ...state,
    snake: nextSnake,
    direction: dir,
    pendingDirection: dir,
    food: nextFood,
    score: nextScore,
    tick: state.tick + 1,
  };
}

export function togglePause(state: SnakeState): SnakeState {
  if (state.status === 'game_over' || state.status === 'passed') return state;
  return { ...state, status: state.status === 'paused' ? 'running' : 'paused' };
}

export function validNextDirections(state: SnakeState): Direction[] {
  if (state.status !== 'running') return [];
  const dirs: Direction[] = ['Up', 'Down', 'Left', 'Right'];
  const out: Direction[] = [];
  
  // Logic must match stepSnake's collision detection
  const head = state.snake[0];
  
  for (const d of dirs) {
    if (isOpposite(state.direction, d)) continue;
    const nh = movePoint(head, d);
    if (!inBounds(nh, state.width, state.height)) continue;
    
    const willEat = samePoint(nh, state.food);
    const ignoreTail = !willEat;
    
    let hit = false;
    // Check collision against CURRENT snake body
    for (let i = 0; i < state.snake.length; i++) {
        if (ignoreTail && i === state.snake.length - 1) continue;
        if (samePoint(state.snake[i], nh)) {
            hit = true;
            break;
        }
    }
    
    if (!hit) out.push(d);
  }
  return out;
}
