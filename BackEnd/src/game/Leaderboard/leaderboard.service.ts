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
      player_rank_name: true,
      player_rank_image: true,
      player_rank_points: true,
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
    player_rank_name: player.player_rank_name,
    player_rank_image: player.player_rank_image,
    player_rank_points: player.player_rank_points,
    rank: rank,
  };
};

export const getPvpLeaderboard = async (limit = 50) => {
  const safeLimit = Math.min(Math.max(limit, 1), 100);

  const topRows = await prisma.$queryRawUnsafe<any[]>(`
    WITH pvp_stats AS (
      SELECT
        player_id,
        COUNT(*)::int AS total_matches,
        SUM(CASE WHEN match_status = 'win' THEN 1 ELSE 0 END)::int AS wins,
        SUM(CASE WHEN match_status = 'loss' THEN 1 ELSE 0 END)::int AS losses
      FROM "PlayerVsPlayerResult"
      GROUP BY player_id
    )
    SELECT
      p.player_id,
      p.username,
      p.player_avatar,
      p.player_rank_name,
      p.player_rank_image,
      p.player_rank_points,
      COALESCE(s.total_matches, 0) AS total_matches,
      COALESCE(s.wins, 0) AS wins,
      COALESCE(s.losses, 0) AS losses,
      CASE
        WHEN COALESCE(s.total_matches, 0) = 0 THEN 0
        ELSE ROUND((COALESCE(s.wins, 0)::numeric / s.total_matches::numeric) * 100, 2)
      END AS win_rate,
      RANK() OVER (
        ORDER BY
          p.player_rank_points DESC,
          CASE
            WHEN COALESCE(s.total_matches, 0) = 0 THEN 0
            ELSE (COALESCE(s.wins, 0)::numeric / s.total_matches::numeric)
          END DESC,
          COALESCE(s.wins, 0) DESC,
          p.total_points DESC,
          p.player_id ASC
      ) AS rank
    FROM "Player" p
    LEFT JOIN pvp_stats s ON s.player_id = p.player_id
    ORDER BY
      p.player_rank_points DESC,
      CASE
        WHEN COALESCE(s.total_matches, 0) = 0 THEN 0
        ELSE (COALESCE(s.wins, 0)::numeric / s.total_matches::numeric)
      END DESC,
      COALESCE(s.wins, 0) DESC,
      p.total_points DESC,
      p.player_id ASC
    LIMIT ${safeLimit};
  `);

  return topRows.map((r) => ({
    player_id: Number(r.player_id),
    username: r.username,
    player_avatar: r.player_avatar,
    player_rank_name: r.player_rank_name,
    player_rank_image: r.player_rank_image,
    player_rank_points: Number(r.player_rank_points),
    total_matches: Number(r.total_matches),
    wins: Number(r.wins),
    losses: Number(r.losses),
    win_rate: Number(r.win_rate),
    rank: Number(r.rank),
  }));
};

export const getPvpPlayerRank = async (playerId: number) => {
  const rows = await prisma.$queryRawUnsafe<any[]>(`
    WITH pvp_stats AS (
      SELECT
        player_id,
        COUNT(*)::int AS total_matches,
        SUM(CASE WHEN match_status = 'win' THEN 1 ELSE 0 END)::int AS wins,
        SUM(CASE WHEN match_status = 'loss' THEN 1 ELSE 0 END)::int AS losses
      FROM "PlayerVsPlayerResult"
      GROUP BY player_id
    ),
    ranked AS (
      SELECT
        p.player_id,
        p.username,
        p.player_avatar,
        p.player_rank_name,
        p.player_rank_image,
        p.player_rank_points,
        COALESCE(s.total_matches, 0) AS total_matches,
        COALESCE(s.wins, 0) AS wins,
        COALESCE(s.losses, 0) AS losses,
        CASE
          WHEN COALESCE(s.total_matches, 0) = 0 THEN 0
          ELSE ROUND((COALESCE(s.wins, 0)::numeric / s.total_matches::numeric) * 100, 2)
        END AS win_rate,
        RANK() OVER (
          ORDER BY
            p.player_rank_points DESC,
            CASE
              WHEN COALESCE(s.total_matches, 0) = 0 THEN 0
              ELSE (COALESCE(s.wins, 0)::numeric / s.total_matches::numeric)
            END DESC,
            COALESCE(s.wins, 0) DESC,
            p.total_points DESC,
            p.player_id ASC
        ) AS rank
      FROM "Player" p
      LEFT JOIN pvp_stats s ON s.player_id = p.player_id
    )
    SELECT *
    FROM ranked
    WHERE player_id = ${playerId}
    LIMIT 1;
  `);

  const row = rows[0];
  if (!row) return null;

  return {
    player_id: Number(row.player_id),
    username: row.username,
    player_avatar: row.player_avatar,
    player_rank_name: row.player_rank_name,
    player_rank_image: row.player_rank_image,
    player_rank_points: Number(row.player_rank_points),
    total_matches: Number(row.total_matches),
    wins: Number(row.wins),
    losses: Number(row.losses),
    win_rate: Number(row.win_rate),
    rank: Number(row.rank),
  };
};
