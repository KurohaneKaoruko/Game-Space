'use client';

import GameTile from './GameTile';
import { useEffect, useState } from 'react';
import '../styles/GameBoard.css';

interface GameBoardProps {
  board: number[][];
}

export default function GameBoard({ board }: GameBoardProps) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  
  // 最小滑动距离
  const minSwipeDistance = 50;
  
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      setTouchEnd(null);
      setTouchStart({
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY
      });
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      setTouchEnd({
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY
      });
    };
    
    const handleTouchEnd = () => {
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
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
        } else {
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
        }
      }
    };
    
    const boardElement = document.getElementById('game-board');
    if (boardElement) {
      boardElement.addEventListener('touchstart', handleTouchStart);
      boardElement.addEventListener('touchmove', handleTouchMove);
      boardElement.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        boardElement.removeEventListener('touchstart', handleTouchStart);
        boardElement.removeEventListener('touchmove', handleTouchMove);
        boardElement.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [touchStart, touchEnd]);
  
  return (
    <div id="game-board" className="bg-gray-100 rounded-lg p-2 aspect-square max-w-[550px] mx-auto">
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