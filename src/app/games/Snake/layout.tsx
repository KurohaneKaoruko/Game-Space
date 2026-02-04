import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Snake AI',
  description: '贪吃蛇游戏 + AI 玩家',
};

export default function SnakeLayout({ children }: { children: React.ReactNode }) {
  return children;
}

