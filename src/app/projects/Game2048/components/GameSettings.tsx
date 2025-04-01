'use client';

import { useEffect, useState } from 'react';

interface GameSettingsProps {
  size: number;
  onSizeChange: (size: number) => void;
}

export default function GameSettings({ size, onSizeChange }: GameSettingsProps) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) return null;
  
  return (
    <div className="bg-white rounded-lg p-3 shadow-sm">
      <h3 className="text-sm font-medium text-gray-900 mb-2">棋盘大小</h3>
      <select
        value={size}
        onChange={(e) => onSizeChange(Number(e.target.value))}
        aria-label="选择棋盘大小"
        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
      >
        <option value={4}>4 × 4</option>
        <option value={5}>5 × 5</option>
        <option value={6}>6 × 6</option>
      </select>
    </div>
  );
} 