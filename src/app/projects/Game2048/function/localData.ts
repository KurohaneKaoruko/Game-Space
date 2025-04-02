const STORAGE_KEYS = {
    SIZE: 'game2048_size',
    HIGH_SCORE_4: 'game2048_high_score_4',
    HIGH_SCORE_5: 'game2048_high_score_5',
    HIGH_SCORE_6: 'game2048_high_score_6',
    HIGH_SCORE_7: 'game2048_high_score_7',
    HIGH_SCORE_8: 'game2048_high_score_8'
};

// 确保大小是有效的数字
const getValidSize = (size: number): number => {
    return !isNaN(size) && size >= 4 && size <= 8 ? size : 4;
};

// 获取本地存储的游戏网格大小
export function getSize(): number {
    const savedSize = localStorage.getItem(STORAGE_KEYS.SIZE);
    const size = getValidSize(savedSize ? parseInt(savedSize) : 4);
    return size;
}

// 获取本地存储的历史最高分
export function getHighScore(size: number): number {
    const savedHighScore = 
        size === 4 ? localStorage.getItem(STORAGE_KEYS.HIGH_SCORE_4) :
        size === 5 ? localStorage.getItem(STORAGE_KEYS.HIGH_SCORE_5) :
        size === 6 ? localStorage.getItem(STORAGE_KEYS.HIGH_SCORE_6) :
        size === 7 ? localStorage.getItem(STORAGE_KEYS.HIGH_SCORE_7) :
        size === 8 ? localStorage.getItem(STORAGE_KEYS.HIGH_SCORE_8) :
        0;
    const highScore = savedHighScore === 'Infinity' ? Infinity : savedHighScore ? parseInt(savedHighScore) : 0;
    return highScore;
}