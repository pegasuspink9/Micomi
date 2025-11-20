import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getLeaderboard = async (limit = 10, playerId?: number) => {
  const topRows = await prisma.$queryRawUnsafe<any[]>(`
    SELECT 
      player_id, 
      username, 
      exp_points,
      RANK() OVER (ORDER BY exp_points DESC) AS rank
    FROM "Player"
    ORDER BY exp_points DESC
    LIMIT ${limit};
  `);

  const topPlayers = topRows.map((r) => ({
    player_id: Number(r.player_id),
    username: r.username,
    exp_points: Number(r.exp_points),
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
    exp_points: null,
    rank: null,
  };

  return {
    leaderboard: [
      ...topPlayers,
      separator,
      {
        player_id: playerRankData.player_id,
        username: playerRankData.username,
        exp_points: playerRankData.exp_points,
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
      exp_points: true,
    },
  });

  if (!player) return null;

  const higherRankedCount = await prisma.player.count({
    where: {
      exp_points: { gt: player.exp_points },
    },
  });

  const rank = higherRankedCount + 1;

  return {
    player_id: player.player_id,
    username: player.username,
    exp_points: player.exp_points,
    rank: rank,
  };
};
