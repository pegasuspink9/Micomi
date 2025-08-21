import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const updateLeaderboard = async (
  playerId: number,
  pointsEarned: number
) => {
  const player = await prisma.player.update({
    where: { player_id: playerId },
    data: { total_points: { increment: pointsEarned } },
    select: { total_points: true },
  });

  await prisma.leaderboard.upsert({
    where: { player_id: playerId },
    update: { total_points: player.total_points },
    create: {
      player_id: playerId,
      total_points: player.total_points,
      rank: 0,
    },
  });

  await recalculateRanks();
};

export const recalculateRanks = async () => {
  const leaderboard = await prisma.leaderboard.findMany({
    orderBy: { total_points: "desc" },
  });

  for (let i = 0; i < leaderboard.length; i++) {
    await prisma.leaderboard.update({
      where: { leaderboard_id: leaderboard[i].leaderboard_id },
      data: { rank: i + 1 },
    });
  }
};

export const getLeaderboard = async (limit = 10) => {
  return prisma.leaderboard.findMany({
    orderBy: { total_points: "desc" },
    take: limit,
    include: { player: { select: { username: true } } },
  });
};
