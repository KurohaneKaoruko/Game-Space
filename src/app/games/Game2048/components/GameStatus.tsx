'use client';

import { useEffect, useState } from 'react';
import GameSettings from './GameSettings';
import '../styles/GameStatus.css';

interface GameStatusProps {
  size: number;
  score: number;
  highScore?: number;
  canUndo?: boolean;
  onRestart: () => void;
  onSizeChange: (size: number) => void;
  onUndo?: () => void;
}

export default function GameStatus({ 
  size, 
  score, 
  highScore = 0, 
  canUndo = false,
  onRestart, 
  onSizeChange,
  onUndo 
}: GameStatusProps) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) return null;

  return (
    <div className="status-container flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-px bg-zinc-200 border border-zinc-200">
        <div className="bg-zinc-50 p-3 text-center">
          <p className="text-[10px] text-zinc-500 font-mono uppercase mb-1">Current_Score</p>
          <p className="text-xl font-bold text-blue-600 font-mono">{score}</p>
        </div>
        
        <div className="bg-zinc-50 p-3 text-center">
          <p className="text-[10px] text-zinc-500 font-mono uppercase mb-1">Record_High</p>
          <p className="text-xl font-bold text-purple-600 font-mono">{highScore}</p>
        </div>
      </div>

      <GameSettings size={size} onSizeChange={onSizeChange} />
      
      <div className="flex gap-2 flex-col">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className={`
            w-full py-3 px-4 border border-zinc-200 text-xs font-bold tracking-widest uppercase transition-colors
            flex items-center justify-center gap-2
            ${canUndo 
              ? 'text-amber-600 hover:bg-amber-500/10 hover:border-amber-500/30' 
              : 'text-zinc-400 cursor-not-allowed opacity-50'
            }
          `}
          title={canUndo ? 'Undo Last Move' : 'Undo Unavailable'}
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          UNDO_STEP
        </button>

        <button
          type="button"
          onClick={onRestart}
          className="w-full py-3 px-4 bg-blue-600 text-white text-xs font-bold tracking-widest uppercase hover:bg-blue-500 transition-colors shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] flex items-center justify-center gap-2"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          REBOOT_SYSTEM
        </button>
      </div>
    </div>
  );
}
