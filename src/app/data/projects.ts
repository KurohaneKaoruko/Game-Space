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
    description: '指数增长主题的挂机小游戏：升级参数提升增长速度，支持本地存档与离线结算，并提供增长曲线可视化。',
    image: '/images/function-idle.svg',
    technologies: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
    link: '/games/FunctionIdle'
  },
  {
    id: 'PendulumSim',
    title: '混沌摆模拟',
    description: '基于约束物理与数值积分的双摆/三摆模拟：支持拖拽调参，显示轨迹与能量变化曲线。',
    image: '/images/pendulum-sim.svg',
    technologies: ['React', 'TypeScript', 'Next.js', 'Canvas'],
    link: '/games/PendulumSim'
  },
]; 

export const tools: Project[] = [
  {
    id: 'ImageStringCodec',
    title: '图片短字符串编码',
    description: '把图片编码成尽可能短的字符串，支持可选压缩（WebP/JPEG 质量可控）与解码还原下载。',
    image: '/images/image-string-codec.svg',
    technologies: ['React', 'TypeScript', 'Next.js', 'Canvas'],
    link: '/tools/ImageStringCodec'
  },
];
