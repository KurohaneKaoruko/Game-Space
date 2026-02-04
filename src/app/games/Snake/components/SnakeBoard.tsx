import { useMemo } from 'react';
import type { Point, SnakeStatus } from '../types';
import { computeFinalScore } from '../function/scoring';

function keyOf(p: Point): string {
  return `${p.x},${p.y}`;
}

export type SnakeBoardProps = {
  width: number;
  height: number;
  snake: Point[];
  food: Point;
  tick: number;
  status: SnakeStatus;
  onRestart?: () => void;
};

export default function SnakeBoard(props: SnakeBoardProps) {
  const { width, height, snake, food, tick, status, onRestart } = props;

  const { snakeSet, headKey, foodKey } = useMemo(() => {
    const s = new Set<string>();
    for (const p of snake) s.add(keyOf(p));
    return {
      snakeSet: s,
      headKey: snake.length > 0 ? keyOf(snake[0]) : '',
      foodKey: keyOf(food),
    };
  }, [snake, food]);

  const cellCount = width * height;
  const cells = useMemo(() => Array.from({ length: cellCount }, (_, i) => i), [cellCount]);
  const finalScore = computeFinalScore({ length: snake.length, steps: tick });
  const didFinish = status === 'game_over' || status === 'passed';

  return (
    <div className="w-full flex justify-center py-4">
      <div className="relative w-[360px] h-[360px] sm:w-[480px] sm:h-[480px] bg-white border border-zinc-300 shadow-2xl rounded-sm overflow-hidden ring-4 ring-zinc-100">
        <div
          className="absolute inset-0 grid bg-zinc-50/50"
          style={{
            gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${height}, minmax(0, 1fr))`,
          }}
        >
          {cells.map((i) => {
            const x = i % width;
            const y = Math.floor(i / width);
            const k = `${x},${y}`;
            const isHead = k === headKey;
            const isSnake = snakeSet.has(k);
            const isFood = k === foodKey;

            let className = 'border border-zinc-200/30 transition-all duration-100';
            
            if (isSnake) {
                className += isHead ? ' bg-blue-600 z-10 rounded-sm' : ' bg-zinc-700 rounded-[1px]';
            }
            if (isFood) {
                className += ' bg-emerald-500 rounded-full scale-75 shadow-sm animate-pulse';
            }
            
            return <div key={k} className={className} />;
          })}
        </div>

        {didFinish ? (
          <div className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300 z-20">
            <div className="bg-white border border-zinc-200 p-8 text-center shadow-2xl rounded-xl max-w-[260px] transform scale-100 animate-in zoom-in-95 duration-300">
              <div className="text-[10px] font-bold text-zinc-400 tracking-[0.2em] mb-3 uppercase">{status === 'passed' ? 'Cleared' : 'Game Over'}</div>
              <div className="text-3xl font-black text-zinc-900 mb-6 tracking-tight">{status === 'passed' ? '挑战成功' : '挑战失败'}</div>
              <div className="grid grid-cols-3 gap-2 mb-6">
                <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-2">
                  <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">长度</div>
                  <div className="text-sm font-black text-zinc-900 font-mono">{snake.length}</div>
                </div>
                <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-2">
                  <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">步数</div>
                  <div className="text-sm font-black text-zinc-900 font-mono">{tick}</div>
                </div>
                <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-2">
                  <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">分数</div>
                  <div className="text-sm font-black text-zinc-900 font-mono">{finalScore}</div>
                </div>
              </div>
              {onRestart && (
                <button 
                  onClick={onRestart}
                  className="w-full px-6 py-4 bg-zinc-900 text-white text-xs font-bold tracking-widest uppercase hover:bg-zinc-800 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-zinc-900/20 rounded-lg"
                >
                  {status === 'passed' ? '再来一局' : '再试一次'}
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
