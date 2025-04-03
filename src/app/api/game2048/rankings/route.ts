import { NextResponse } from 'next/server'
import { getTopScores } from "@/lib/mongodb2048";

async function getRankings(size: number) {
  // 获取前10名最高分
  const rankings = await getTopScores(size)
    
  // 转换为前端需要的格式
  const formattedRankings = rankings.map((item, index) => ({
    id: index + 1,
    name: item.playerName,
    score: item.score,
  }));

  return formattedRankings
}


export async function POST(request: Request) {
  const data = await request.json()
  const gameSize = data.size;

  try {
    const rankings = await getRankings(gameSize);
    return NextResponse.json(rankings);
  } catch (error) {
    return NextResponse.json(
      { error: '获取排行榜失败' },
      { status: 500 }
    )
  }
}