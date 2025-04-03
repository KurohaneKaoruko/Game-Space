import { saveScore } from "@/lib/mongodb2048";

export async function dataSave(playerName: string, score: number, size: number, record: string) {
    try {
      return await saveScore({ playerName, score, size, record })
    } catch (error) {
      console.error('保存分数失败:', error);
      return false;
    }
  }
  