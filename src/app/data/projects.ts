export interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  technologies: string[];
  link?: string;
}

export const games: Project[] = [
  {
    id: 'Game2048',
    title: '2048 游戏',
    description: '经典的2048数字方块游戏，使用React和TypeScript实现。通过方向键控制，将相同数字的方块合并，达到2048获胜。',
    image: '/images/2048.png',
    technologies: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
    link: '/games/Game2048'
  },
  {
    id: 'FunctionIdle',
    title: '函数 · 指数挂机',
    description: '以微分方程 dP/dt = r·P + b 为核心的指数增长挂机游戏，支持本地存档与离线结算。',
    image: '/images/function-idle.svg',
    technologies: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
    link: '/games/FunctionIdle'
  },
]; 
