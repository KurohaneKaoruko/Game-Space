import { saveScore } from "@/lib/mongodb2048";

export async function dataSave(playerName: string, score: number, timestamp: number, size: number) {
    const date = new Date(timestamp).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
  
    try {
      return await saveScore({ playerName, score, date, size })
    } catch (error) {
      console.error('保存分数失败:', error);
      return false;
    }
  }
  