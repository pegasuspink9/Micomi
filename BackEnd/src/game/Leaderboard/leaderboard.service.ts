import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getLeaderboard = async (limit = 10) => {
  const topRows = await prisma.$queryRawUnsafe<any[]>(`
    SELECT 
      player_id, 
      username, 
      total_points,
      player_avatar,
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
    player_avatar: r.player_avatar,
  }));

  return topPlayers;
};

export const getPlayerRank = async (playerId: number) => {
  const player = await prisma.player.findUnique({
    where: { player_id: playerId },
    select: {
      player_id: true,
      username: true,
      total_points: true,
      player_avatar: true,
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
    player_avatar: player.player_avatar, // Return here
    rank: rank,
  };
};
