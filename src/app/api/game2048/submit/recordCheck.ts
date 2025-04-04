import { createHash } from 'crypto';

interface GameRecordItem {
  board: string;
  score: number;
  hash: string;
}

// 计算游戏盘面的哈希值
function calculateBoardHash(prevRecord: GameRecordItem | null = null) {
  if (!prevRecord) {
    // 初始记录，只用当前盘面计算
    return createHash('sha256').update('GAME_2048_RECORD').digest('hex');
  }
  // 使用上一个记录的完整信息和当前盘面计算
  return createHash('sha256').update(JSON.stringify(prevRecord)).digest('hex');
}

// 验证游戏记录的正确性
export function recordCheck(size: number, score: number, record: GameRecordItem[]) {
  // 验证基本游戏记录
  if (!Array.isArray(record)) {
    return false;
  }

  // 检查游戏记录的哈希链
  try {
    // 检查记录长度
    if (record.length < 2) { // 至少需要初始状态和一次移动
      return false;
    }

    let oldBoardSum = 0;
    let realScore = 0;
    let diff_2 = 0;
    let diff_4 = 0;
    let diff_8 = 0;

    // 验证哈希链
    for (let i = 0; i < record.length; i++) {
      const currentBoard = record[i].board;
      const currentHash = record[i].hash;
      const addscore = record[i].score;
      const prevRecord = record[i-1];
      
      // 验证当前哈希是否正确
      const expectedHash = calculateBoardHash(prevRecord);
      if (currentHash !== expectedHash) {
        return false;
      }

      // 求和
      const boardArray = JSON.parse(currentBoard);
      const boardSum = boardArray.reduce((sum: number, row: number[]) => {
        return sum + row.reduce((rowSum: number, cell: number) => rowSum + cell, 0);
      }, 0);
      
      // 验证新增分数是否合理
      if (addscore % 4 !== 0 || addscore > boardSum) {
        return false;
      }

      // 当前求和与上一次的差值是否合理
      const diff = boardSum - oldBoardSum;
      if (size < 8 && (diff % 2 !== 0 || diff > 8)) {
        return false;
      }
      // 2*2不会新增4以上的数字
      if (size == 2 && diff > 4) {
        return false;
      }

      if (diff === 2) {
        diff_2++;
      } else if (diff === 4) {
        diff_4++;
      } else if (diff === 8) {
        diff_8++;
      }

      oldBoardSum = boardSum;
      realScore += addscore;
    }

    // 校验分数真实性
    if (realScore !== score) {
      return false;
    }

    if (record.length >= 20) {
      // 20步后，4和8的数量不能超过2的数量
      // 避免修改前端代码导致的异常分数
      if (diff_4 > diff_2 ||
          diff_8 > diff_4 ||
          diff_8 > diff_2) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('验证游戏记录时出错:', error);
    return false;
  }
}
