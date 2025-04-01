'use client';

import Link from 'next/link';
import { useGame2048 } from './useGame2048';
import GameBoard from './components/GameBoard';
import GameStatus from './components/GameStatus';
import GameOver from './components/GameOver';
import GameRules from './components/GameRules';
import GameSettings from './components/GameSettings';
import { useEffect, useState } from 'react';

export default function Game2048Page() {
  const {
    board,
    score,
    gameOver,
    size,
    highScore,
    onSizeChange,
    onRestart
  } = useGame2048();

  const [isMobile, setIsMobile] = useState(true);

  // 监听窗口尺寸变化
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 添加meta标签确保移动设备的正确缩放
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    document.head.appendChild(meta);

    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-4 px-4 flex flex-col">
      <div className="w-full max-w-screen-xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <Link 
            href="/" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            返回首页
          </Link>
        </div>
        
        <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-6">
          {/* 游戏主区域 */}
          <div className="lg:flex-1 bg-white rounded-xl shadow-md overflow-hidden mb-4 lg:mb-0 p-4 pl-8 pr-8">
            <h1 className="text-2xl font-bold text-center text-gray-800 mb-1">2048 游戏</h1>
            <p className="text-center text-gray-600 mb-3 text-sm">
              {isMobile 
                ? "向上、下、左、右滑动来移动方块" 
                : "使用键盘方向键来移动方块"}
            </p>
            
            <div className="flex flex-col lg:flex-row lg:space-x-6">
              {/* 左侧状态区域 */}
              <div className="lg:w-32 flex-shrink-0 space-y-3">
                <GameStatus score={score} highScore={highScore} onRestart={onRestart} />
                <GameSettings size={size} onSizeChange={onSizeChange} />
              </div>
              
              {/* 游戏棋盘 */}
              <div className="flex-1">
                <GameBoard board={board} />
              </div>
            </div>
            
            {gameOver && (
              <GameOver score={score} onRestart={onRestart} />
            )}
          </div>
          
          {/* 右侧规则和信息区域 */}
          <div className="lg:w-80 xl:w-96 bg-white rounded-xl shadow-md overflow-hidden">
            <GameRules />
            
            <div className="hidden lg:block p-4 border-t border-gray-100">
              <h3 className="text-base font-semibold mb-2 text-gray-800 flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                小贴士
              </h3>
              <div className="space-y-1.5 text-gray-600 text-sm">
                <p>• 尝试将大数字保持在一个角落</p>
                <p>• 不要让小数字分散太远</p>
                <p>• 提前规划你的移动路径</p>
                <p>• 当你接近胜利时要格外小心</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
