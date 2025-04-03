import { encryptData } from './encrypt';

interface Data {
    playerName: string,
    score: number,
    timestamp: number,
    gameSize: number,
    gameRecord: string
}

export async function submitScore(rawData: Data) {
    try {
        // 加密数据
        const encryptedData = await encryptData(rawData);
        
        // 生成校验和
        const checksumData = String(rawData.score) + rawData.timestamp;
        let checksum;
        // 在浏览器环境中使用btoa
        if (typeof window !== 'undefined') {
          checksum = btoa(checksumData);
        } else {
          // 在Node.js环境中使用Buffer
          checksum = Buffer.from(checksumData).toString('base64');
        }
        
        // 发送加密后的数据
        const response = await fetch('/api/game2048/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            data: encryptedData,
            checksum
          }),
        });
        
        if (!response.ok) {
          throw new Error(`提交分数失败: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.message || '提交分数失败');
        }
        
        return result;
    } catch (error) {
        console.error('提交分数错误:', error);
        throw error;
    }
}