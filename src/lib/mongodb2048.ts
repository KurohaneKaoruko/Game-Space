import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || '';
const client = new MongoClient(uri);

export async function getTopScores(size = 4, limit = 10) {
  try {
    await client.connect();
    const database = client.db("game2048");
    const collectionName = `scores_${size}x${size}`
    const collections = await database.listCollections({name: collectionName}).toArray();
    if (collections.length === 0) {
        await database.createCollection(collectionName);
    }
    const collection = database.collection(collectionName);

    return await collection.find().sort({ score: -1 }).limit(limit).toArray();
  } finally {
    await client.close();
  }
}

export async function insertScore(scoreData: {
  playerName: string,
  score: number,
  date: string,
  size: number
}) {
  try {
    await client.connect();
    const database = client.db("game2048");
    const collectionName = `scores_${scoreData.size}x${scoreData.size}`
    const collections = await database.listCollections({name: collectionName}).toArray();
    if (collections.length === 0) {
        await database.createCollection(collectionName);
    }
    const collection = database.collection(collectionName);

    // 查找该玩家的现有记录
    const existingRecord = await collection.findOne({
      playerName: scoreData.playerName
    });

    // 如果没有记录或新分数更高,则更新记录
    if (!existingRecord || existingRecord.score < scoreData.score) {
      const scoreRecord = {
        playerName: scoreData.playerName,
        score: scoreData.score,
        date: scoreData.date,
        size: scoreData.size,
        createdAt: new Date()
      };

      // 使用 upsert 操作 - 如果记录存在则更新,不存在则插入
      await collection.updateOne(
        { playerName: scoreData.playerName },
        { $set: scoreRecord },
        { upsert: true }
      );
    }
  } finally {
    await client.close();
  }
}