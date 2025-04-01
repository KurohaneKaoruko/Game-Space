'use client';

interface TileProps {
  value: number;
}

export default function Tile({ value }: TileProps) {
  // 获取格子背景色
  const getTileColor = (value: number) => {
    switch (value) {
      case 0: return 'bg-gray-200';
      case 2: return 'bg-blue-100';
      case 4: return 'bg-blue-200';
      case 8: return 'bg-blue-300';
      case 16: return 'bg-blue-400';
      case 32: return 'bg-blue-500';
      case 64: return 'bg-blue-600';
      case 128: return 'bg-blue-700';
      case 256: return 'bg-blue-800';
      case 512: return 'bg-blue-900';
      case 1024: return 'bg-purple-500';
      case 2048: return 'bg-purple-600';
      case 4096:  return 'bg-[#00C853] text-white';       // 荧光绿 (100%)
      case 8192:  return 'bg-[#6200EA] text-white';       // 深紫 (100%)
      case 16384: return 'bg-[#FFD600] text-black';       // 亮黄 (100%)
      // 超大数值（32768+）：金属渐变
      case 32768: return 'bg-gradient-to-br from-[#FFEB3B] to-[#FF9800] text-black'; // 黄金渐变
      case 65536: return 'bg-gradient-to-br from-[#E0E0E0] to-[#9E9E9E] text-black'; // 白银渐变
      // 终极数值特效
      default:
        return value >= 131072 
          ? 'bg-gradient-to-br from-[#FF1744] via-[#D500F9] to-[#3D5AFE] animate-pulse text-white' // 三色流光
          : 'bg-[#212121] text-white'; // 纯黑背景
    }
  };

  // 获取文本颜色
  const getTextColor = (value: number) => {
    if (value === 0) return 'text-transparent';
    if (value <= 4) return 'text-blue-900';
    return 'text-white';
  };

  // 获取文本大小，根据数字长度和屏幕尺寸调整大小
  const getTextSize = (value: number) => {
    if (value === 0) return 'text-base sm:text-lg md:text-xl';
    if (value < 100) return 'text-base sm:text-lg md:text-xl';
    if (value < 1000) return 'text-sm sm:text-base md:text-lg';
    return 'text-xs sm:text-sm md:text-base';
  };

  // 添加阴影和凸起效果
  const getShadow = (value: number) => {
    if (value === 0) return 'shadow-none';
    if (value <= 4) return 'shadow-sm';
    if (value <= 16) return 'shadow';
    if (value <= 64) return 'shadow-md';
    if (value <= 256) return 'shadow-lg';
    return 'shadow-xl';
  };

  // 添加动画效果
  const getAnimation = (value: number) => {
    if (value === 0) return '';
    return 'animate-tile-appear';
  };

  return (
    <div
      className={`
        aspect-square rounded-lg flex items-center justify-center font-bold
        ${getTileColor(value)}
        ${getTextColor(value)}
        ${getTextSize(value)}
        ${getShadow(value)}
        ${getAnimation(value)}
        transition-all duration-200
        hover:shadow-lg active:shadow-md
        border border-gray-300
      `}
    >
      {value || ''}
    </div>
  );
}
