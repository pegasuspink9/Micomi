import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getLeaderboard = async (limit = 10, playerId?: number) => {
  const topRows = await prisma.$queryRawUnsafe<any[]>(`
    SELECT 
      player_id, 
      username, 
      total_points,
      RANK() OVER (ORDER BY total_points DESC) AS rank
    FROM "Player"
    ORDER BY total_points DESC
    LIMIT ${limit};
  `);

  const topPlayers = topRows.map((r) => ({
    player_id: Number(r.player_id),
    username: r.username,
    total_points: Number(r.total_points),
    rank: Number(r.rank),
  }));

  if (!playerId) {
    return { leaderboard: topPlayers };
  }

  const playerInTop = topPlayers.find((p) => p.player_id === playerId);

  if (playerInTop) {
    return { leaderboard: topPlayers };
  }

  const playerRankData = await getPlayerRank(playerId);

  if (!playerRankData) {
    return { leaderboard: topPlayers };
  }

  const separator = {
    player_id: null,
    username: "...",
    total_points: null,
    rank: null,
  };

  return {
    leaderboard: [
      ...topPlayers,
      separator,
      {
        player_id: playerRankData.player_id,
        username: playerRankData.username,
        total_points: playerRankData.total_points,
        rank: playerRankData.rank,
      },
    ],
  };
};

export const getPlayerRank = async (playerId: number) => {
  const player = await prisma.player.findUnique({
    where: { player_id: playerId },
    select: {
      player_id: true,
      username: true,
      total_points: true,
    },
  });

  if (!player) return null;

  const higherRankedCount = await prisma.player.count({
    where: {
      total_points: { gt: player.total_points },
    },
  });

  const rank = higherRankedCount + 1;

  return {
    player_id: player.player_id,
    username: player.username,
    total_points: player.total_points,
    rank: rank,
  };
};
