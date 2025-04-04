'use client';

import GameTile from './GameTile';
import { useEffect, useState, useRef } from 'react';
import '../styles/GameBoard.scss';

interface GameBoardProps {
  board: number[][];
}

export default function GameBoard({ board }: GameBoardProps) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  
  // 最小滑动距离
  const minSwipeDistance = 50;
  
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // 只在游戏棋盘内阻止默认行为
      if (e.target && boardRef.current?.contains(e.target as Node)) {
        e.preventDefault();
        setTouchEnd(null);
        setTouchStart({
          x: e.targetTouches[0].clientX,
          y: e.targetTouches[0].clientY
        });
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      // 只在游戏棋盘内阻止默认行为
      if (e.target && boardRef.current?.contains(e.target as Node)) {
        e.preventDefault();
        setTouchEnd({
          x: e.targetTouches[0].clientX,
          y: e.targetTouches[0].clientY
        });
      }
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      // 只在游戏棋盘内阻止默认行为
      if (e.target && boardRef.current?.contains(e.target as Node)) {
        e.preventDefault();
        if (!touchStart || !touchEnd) return;
        
        const distanceX = touchStart.x - touchEnd.x;
        const distanceY = touchStart.y - touchEnd.y;
        const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);
        
        if (isHorizontalSwipe && Math.abs(distanceX) > minSwipeDistance) {
          if (distanceX > 0) {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
          } else {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
          }
        } else if (!isHorizontalSwipe && Math.abs(distanceY) > minSwipeDistance) {
          if (distanceY > 0) {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
          } else {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
          }
        }
      }
    };
    
    // 直接在文档级别监听触摸事件，但只对游戏棋盘内的事件进行处理
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [touchStart, touchEnd]);
  
  return (
    <div 
      ref={boardRef}
      id="game-board" 
      className="bg-gray-100 rounded-lg p-2 aspect-square max-w-[80vh] mx-auto touch-none"
    >
      <div 
        className="game-grid"
        data-size={board.length}
      >
        {board.map((row, i) =>
          row.map((value, j) => (
            <GameTile key={`${i}-${j}`} value={value} />
          ))
        )}
      </div>
    </div>
  );
} 