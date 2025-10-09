import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getLeaderboard = async (limit = 10) => {
  const rows = await prisma.$queryRawUnsafe<any[]>(`
    SELECT player_id, username, exp_points,
           RANK() OVER (ORDER BY exp_points DESC) AS rank
    FROM "Player"
    ORDER BY exp_points DESC
    LIMIT ${limit};
  `);

  return rows.map((r) => ({
    player_id: Number(r.player_id),
    username: r.username,
    exp_points: Number(r.exp_points),
    rank: Number(r.rank),
  }));
};

export const getPlayerRank = async (playerId: number) => {
  const rows = await prisma.$queryRawUnsafe<any[]>(`
    SELECT player_id, username, exp_points, rank FROM (
      SELECT player_id, username, exp_points,
             RANK() OVER (ORDER BY exp_points DESC) AS rank
      FROM "Player"
    ) ranked
    WHERE player_id = ${playerId};
  `);

  if (rows.length === 0) return null;

  const r = rows[0];
  return {
    player_id: Number(r.player_id),
    username: r.username,
    exp_points: Number(r.exp_points),
    rank: Number(r.rank),
  };
};
