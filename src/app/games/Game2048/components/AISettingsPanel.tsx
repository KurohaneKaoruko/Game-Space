'use client';

import { useEffect, useState } from 'react';
import { useAIController, type MoveSpeed, MOVE_SPEEDS } from '../function/useAIController';
import type { AIMode } from '../function/aiEngine';
import type { Direction } from '../types';

/**
 * AI设置面板组件属性
 */
interface AISettingsPanelProps {
  /** 当前棋盘状态 */
  board: number[][];
  /** 游戏是否结束 */
  gameOver: boolean;
  /** 执行移动的回调函数（带动画） */
  onMove: (direction: Direction) => void;
  /** 直接执行移动的回调函数（跳过动画，供极速模式使用） */
  onMoveImmediate?: (direction: Direction) => void;
}

/**
 * AI模式配置
 */
interface AIModeConfig {
  id: AIMode;
  name: string;
  description: string;
}

/**
 * 速度配置
 */
interface SpeedConfig {
  id: MoveSpeed;
  name: string;
}

/** AI模式列表 */
const AI_MODES: AIModeConfig[] = [
  {
    id: 'fast',
    name: '贪心策略 (GREEDY)',
    description: '/// 优先级启发式 / 响应迅速',
  },
  {
    id: 'balanced',
    name: '博弈树 (MINIMAX)',
    description: '/// 深度搜索 / 平衡效能',
  },
  {
    id: 'optimal',
    name: '期望搜索 (EXPECTIMAX)',
    description: '/// 概率最大化 / 最优解',
  },
  {
    id: 'ntuple',
    name: '神经网络 (N-TUPLE)',
    description: '/// 机器学习评估 / 极高胜率',
  },
];

/** 速度选项列表 */
const SPEED_OPTIONS: SpeedConfig[] = [
  { id: 'turbo', name: '极速 (TURBO)' },
  { id: 'fast', name: '快 (FAST)' },
  { id: 'normal', name: '中 (NORM)' },
  { id: 'slow', name: '慢 (SLOW)' },
];

/**
 * AI设置面板组件
 * 
 * 替代原有排行榜的UI组件，提供AI控制界面。
 * 包含AI模式选择、开始/停止按钮、速度调节功能。
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
 */
export default function AISettingsPanel({ board, gameOver, onMove, onMoveImmediate }: AISettingsPanelProps) {
  const [isClient, setIsClient] = useState(false);
  
  const {
    isRunning,
    currentMode,
    currentSpeed,
    isLoadingWeights,
    weightLoadError,
    startAI,
    stopAI,
    setMode,
    setSpeed,
  } = useAIController({ board, gameOver, onMove, onMoveImmediate });

  // 客户端加载检测
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <div className="p-4 space-y-4">
      {/* 标题 */}
      <div>
        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
          <span className="w-1 h-4 bg-blue-600"></span>
          AI 控制 (AI_CONTROLLER)
        </h3>
        <p className="text-[10px] text-zinc-500 font-mono mt-1 uppercase">
          {'/// INTELLIGENT_SOLVER_MODULE'}
        </p>
      </div>

      {/* AI模式选择 - Requirements: 2.1, 2.2, 2.6 */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-zinc-900 uppercase tracking-wider">算法模型 (ALGORITHM)</div>
        <div className="space-y-2">
          {AI_MODES.map((mode) => {
            const isSelected = currentMode === mode.id;
            const isNTupleLoading = mode.id === 'ntuple' && isLoadingWeights;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setMode(mode.id)}
                disabled={isNTupleLoading}
                className={`
                  w-full p-2 text-left transition-all duration-200 border relative group
                  ${isSelected
                    ? 'bg-white border-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.1)]'
                    : 'bg-zinc-50 border-zinc-200 hover:border-blue-400 hover:bg-white'
                  }
                  ${isNTupleLoading ? 'opacity-50 cursor-wait' : ''}
                `}
              >
                {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600"></div>}
                <div className="flex items-center justify-between pl-2">
                  <span className={`text-xs font-bold font-mono uppercase ${isSelected ? 'text-blue-700' : 'text-zinc-700'}`}>
                    {mode.name}
                    {isNTupleLoading && ' [LOADING...]'}
                  </span>
                  {isSelected && !isNTupleLoading && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse shadow-sm"></div>
                  )}
                </div>
                <p className={`text-[10px] font-mono mt-0.5 pl-2 ${isSelected ? 'text-blue-600/80' : 'text-zinc-400'}`}>
                  {mode.description}
                </p>
              </button>
            );
          })}
        </div>
        
        {/* 权重加载错误提示 */}
        {weightLoadError && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200">
            <p className="text-[10px] font-mono text-red-600 uppercase">
              [ERROR]: {weightLoadError}
            </p>
          </div>
        )}
      </div>

      {/* 速度调节 - Requirements: 2.7 */}
      <div className="space-y-2 pt-3 border-t border-zinc-200">
        <label className="text-xs font-bold text-zinc-900 uppercase tracking-wider block">
          处理速度 (SPEED)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {SPEED_OPTIONS.map((speed) => {
            const isSelected = currentSpeed === speed.id;
            return (
              <button
                key={speed.id}
                type="button"
                onClick={() => setSpeed(speed.id)}
                className={`
                  py-1.5 px-1 text-center text-[10px] font-bold font-mono uppercase transition-colors duration-200 border
                  ${isSelected
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
                  }
                `}
              >
                {speed.name}
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-zinc-400 font-mono text-center uppercase tracking-wider">
          {currentSpeed === 'turbo' ? '/// NO_DELAY_EXECUTION' : `/// INTERVAL: ${MOVE_SPEEDS[currentSpeed]}ms`}
        </p>
      </div>

      {/* 开始/停止按钮 - Requirements: 2.3, 2.4, 2.5 */}
      <button
        type="button"
        onClick={isRunning ? stopAI : startAI}
        disabled={gameOver && !isRunning}
        className={`
          w-full py-2.5 px-4 font-bold text-xs tracking-widest uppercase transition-all duration-200
          flex items-center justify-center space-x-2 border shadow-sm
          ${isRunning
            ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300'
            : gameOver
              ? 'bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed'
              : 'bg-blue-600 border-blue-600 text-white hover:bg-blue-500 hover:border-blue-500 hover:shadow-md'
          }
        `}
      >
        {isRunning ? (
          <>
            <span className="w-2 h-2 bg-red-600 rounded-sm animate-pulse mr-2"></span>
            <span>中止 (TERMINATE)</span>
          </>
        ) : (
          <>
            <svg className="w-3 h-3 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            <span>启动 AI (INITIALIZE)</span>
          </>
        )}
      </button>

      {/* 运行状态指示 */}
      {isRunning && (
        <div className="flex items-center justify-center text-[10px] font-mono text-blue-600 uppercase tracking-widest">
          <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-ping mr-2"></span>
          AI_CORE_RUNNING...
        </div>
      )}

      {/* 游戏结束提示 */}
      {gameOver && !isRunning && (
        <p className="text-center text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
          {'/// SYSTEM_HALTED: GAME_OVER'}
        </p>
      )}
    </div>
  );
}
