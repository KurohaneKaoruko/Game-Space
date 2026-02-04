import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { AISpeed, SnakeAIControllerReturn } from '../function/useAIController';
import type { AIStrategy } from '../function/aiEngine';
import { CustomScriptExecutor } from '../function/customScript';

import type { SnakeState } from '../types';

export type SnakeAIControlsProps = {
  ai: SnakeAIControllerReturn;
  status: SnakeState['status'];
  onStartAI: () => void;
};

const STRATEGY_LABELS: Record<AIStrategy, string> = {
  greedy: '贪婪 (弱)',
  safe: '保守 (中)',
  strong: '生存 (强)',
  hamiltonian: 'Hamilton (最优)',
  custom: '自定义脚本',
};

export default function SnakeAIControls(props: SnakeAIControlsProps) {
  const { ai, status, onStartAI } = props;
  const [showEditor, setShowEditor] = useState(false);
  const [tempScript, setTempScript] = useState(CustomScriptExecutor.getDefaultScript());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Initialize script from AI controller or default
  useEffect(() => {
    if (ai.customScript) {
      setTempScript(ai.customScript);
    }
  }, []);

  const handleSaveScript = () => {
    ai.setCustomScript(tempScript);
    setShowEditor(false);
    ai.setStrategy('custom');
  };

  const editorModal = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden border border-zinc-200 flex flex-col h-[80vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-amber-500 shadow-amber-500/20 shadow-lg"></div>
                    <span className="text-sm font-bold text-zinc-700 font-mono uppercase tracking-wide">自定义 AI 脚本 (JavaScript)</span>
                </div>
                <button 
                    onClick={() => setShowEditor(false)} 
                    className="p-2 -mr-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-all"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div className="flex-1 bg-[#1e1e1e] p-0 overflow-hidden relative">
                <textarea
                    value={tempScript}
                    onChange={(e) => setTempScript(e.target.value)}
                    className="w-full h-full bg-transparent text-zinc-100 font-mono text-sm p-6 resize-none focus:outline-none leading-relaxed"
                    spellCheck={false}
                />
            </div>
            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-between items-center gap-4">
                <div className="text-[10px] text-zinc-400 font-mono">
                    可用对象: <span className="text-zinc-600 font-bold">state</span>, <span className="text-zinc-600 font-bold">utils</span>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setTempScript(CustomScriptExecutor.getDefaultScript())}
                        className="px-4 py-2 text-xs font-bold text-zinc-500 uppercase hover:text-zinc-800 transition-colors border border-zinc-200 rounded-lg hover:bg-white hover:border-zinc-300"
                    >
                        恢复默认
                    </button>
                    <button 
                        onClick={handleSaveScript}
                        className="px-6 py-2 bg-zinc-900 text-white text-xs font-bold tracking-widest uppercase rounded-lg hover:bg-zinc-800 shadow-lg shadow-zinc-900/10 transition-all active:scale-95"
                    >
                        保存并运行
                    </button>
                </div>
            </div>
        </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Strategy Selector */}
      <div>
        <div className="grid grid-cols-2 gap-1.5 mb-1.5">
          {(['greedy', 'safe', 'strong', 'hamiltonian'] as const).map((s) => (
            <button
              key={s}
              onClick={() => ai.setStrategy(s)}
              className={`text-[9px] font-mono font-bold uppercase py-2.5 rounded-md transition-all duration-200 border ${
                ai.strategy === s
                  ? 'bg-blue-50 text-blue-600 shadow-sm border-blue-100'
                  : 'bg-white text-zinc-400 border-zinc-100 hover:text-zinc-600 hover:border-zinc-200'
              }`}
            >
              {s === 'hamiltonian' ? 'Hamilton' : STRATEGY_LABELS[s]}
            </button>
          ))}
        </div>
        
        {/* Custom Strategy Button */}
        <button
            onClick={() => {
                ai.setStrategy('custom');
                setShowEditor(true);
            }}
            className={`w-full py-2.5 text-[10px] font-mono font-bold uppercase rounded-md transition-all border ${
                ai.strategy === 'custom'
                ? 'bg-amber-50 text-amber-600 border-amber-200 shadow-sm'
                : 'bg-white text-zinc-400 border-zinc-100 hover:bg-zinc-50 hover:text-zinc-600'
            }`}
        >
            {STRATEGY_LABELS['custom']}
        </button>
      </div>

      {/* Code Editor Modal/Overlay via Portal */}
      {showEditor && mounted && createPortal(editorModal, document.body)}

      {/* Speed Control */}
      <div className="bg-zinc-50/50 p-1.5 rounded-lg border border-zinc-100">
        <div className="flex justify-between items-center gap-2">
            <span className="text-[9px] font-bold text-zinc-400 font-mono uppercase shrink-0 px-1">速度</span>
            <div className="flex gap-1 flex-1">
                {(['slow', 'normal', 'fast', 'turbo'] as const).map((s) => (
                    <button
                    key={s}
                    onClick={() => ai.setSpeed(s)}
                    className={`flex-1 text-[8px] font-mono font-bold uppercase py-1.5 rounded transition-all duration-200 ${
                        ai.speed === s
                        ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200'
                        : 'text-zinc-400 hover:text-zinc-600'
                    }`}
                    >
                    {s}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* Telemetry */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-zinc-900 p-2 rounded-md border border-zinc-800 shadow-inner flex flex-col justify-between h-14 relative overflow-hidden">
            <div className="text-[8px] text-zinc-500 font-mono uppercase font-bold">当前策略</div>
            <div className="text-[10px] text-emerald-400 font-mono truncate tracking-wide relative z-10">
                {ai.lastMove?.strategy ? `>${ai.lastMove.strategy}` : '>待机'}
            </div>
            {ai.strategy === 'custom' && ai.lastMove?.strategy && ai.lastMove.strategy !== 'custom' && (
                <div className="absolute inset-0 bg-red-900/90 flex items-center justify-center text-[8px] text-red-200 font-bold animate-pulse">
                    ⚠️ 脚本无效 (已回退)
                </div>
            )}
        </div>
        <div className="bg-zinc-900 p-2 rounded-md border border-zinc-800 shadow-inner flex flex-col justify-between h-14">
            <div className="text-[8px] text-zinc-500 font-mono uppercase font-bold">路径节点</div>
            <div className="text-[10px] text-blue-400 font-mono tracking-wide">
                {ai.lastMove?.pathLength ? `[${ai.lastMove.pathLength}]` : '[-]'}
            </div>
        </div>
      </div>

      {/* Main Action Button */}
      <button
        onClick={ai.isRunning ? ai.stop : onStartAI}
        className={`w-full py-3 text-xs font-bold tracking-[0.1em] uppercase transition-all rounded-lg shadow-lg active:scale-[0.98] ${
          ai.isRunning
            ? 'bg-red-500 text-white shadow-red-500/20 hover:bg-red-600'
            : 'bg-blue-600 text-white shadow-blue-600/20 hover:bg-blue-700'
        }`}
      >
        {ai.isRunning 
            ? '停止 AI 运行' 
            : status === 'game_over' 
                ? '复活并启动 AI' 
                : status === 'paused'
                    ? '继续并启动 AI'
                    : '启动 AI 托管'
        }
      </button>
    </div>
  );
}

