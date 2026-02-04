import type { SnakeState } from '../types';
import { computeFinalScore } from '../function/scoring';

export type SnakeHUDProps = {
  state: SnakeState;
};

export default function SnakeHUD(props: SnakeHUDProps) {
  const { state } = props;
  
  let statusColor = 'text-zinc-900 bg-zinc-100 border-zinc-200';
  let statusText = '游戏结束';
  if (state.status === 'running') {
    statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-100';
    statusText = '进行中';
  } else if (state.status === 'paused') {
    statusColor = 'text-amber-700 bg-amber-50 border-amber-100';
    statusText = '已暂停';
  } else if (state.status === 'passed') {
    statusColor = 'text-blue-700 bg-blue-50 border-blue-100';
    statusText = '已通关';
  } else {
    statusColor = 'text-red-700 bg-red-50 border-red-100';
    statusText = '游戏结束';
  }

  const finalScore = computeFinalScore({ length: state.snake.length, steps: state.tick });

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-50 border border-zinc-100 p-3 flex flex-col justify-between rounded-lg">
          <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-1">长度</div>
          <div className="text-2xl font-bold text-zinc-900 font-mono leading-none tracking-tighter">{state.snake.length}</div>
        </div>
        <div className="bg-zinc-50 border border-zinc-100 p-3 flex flex-col justify-between rounded-lg">
          <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-1">步数</div>
          <div className="text-2xl font-bold text-zinc-900 font-mono leading-none tracking-tighter">{state.tick}</div>
        </div>
      </div>
      {state.status !== 'running' && (
        <div className="bg-zinc-50 border border-zinc-100 p-3 flex items-center justify-between rounded-lg">
          <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">结算分数</div>
          <div className="text-xl font-bold text-zinc-900 font-mono leading-none tracking-tighter">{finalScore}</div>
        </div>
      )}
      <div className={`p-3 flex items-center justify-between rounded-lg border ${statusColor} transition-colors duration-300`}>
        <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">状态</div>
        <div className="text-xs font-bold font-mono tracking-widest flex items-center gap-2">
            {state.status === 'running' && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>}
            {statusText}
        </div>
      </div>
    </div>
  );
}
