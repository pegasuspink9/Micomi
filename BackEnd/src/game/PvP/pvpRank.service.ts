import { PrismaClient } from "@prisma/client";

export type PvpRankName =
  | "Pixel"
  | "Byte"
  | "Sprite"
  | "Widget"
  | "Cipher"
  | "Root"
  | "Nexus";

interface RankTier {
  rank_id: number;
  name: PvpRankName;
  legacyName: string;
  minPoints: number;
  maxPoints: number | null;
  image: string;
}

const RANK_TIERS: RankTier[] = [
  {
    rank_id: 1,
    name: "Pixel",
    legacyName: "Warrior",
    minPoints: 0,
    maxPoints: 999,
    image: "https://micomi-assets.me/Pvp%20Assets/Ranks%20badge/Pixel.png",
  },
  {
    rank_id: 2,
    name: "Byte",
    legacyName: "Elite",
    minPoints: 1000,
    maxPoints: 2399,
    image: "https://micomi-assets.me/Pvp%20Assets/Ranks%20badge/Byte.png",
  },
  {
    rank_id: 3,
    name: "Sprite",
    legacyName: "Master",
    minPoints: 2400,
    maxPoints: 4299,
    image: "https://micomi-assets.me/Pvp%20Assets/Ranks%20badge/Sprite.png",
  },
  {
    rank_id: 4,
    name: "Widget",
    legacyName: "Grandmaster",
    minPoints: 4300,
    maxPoints: 6799,
    image: "https://micomi-assets.me/Pvp%20Assets/Ranks%20badge/Widget.png",
  },
  {
    rank_id: 5,
    name: "Cipher",
    legacyName: "Epic",
    minPoints: 6800,
    maxPoints: 9899,
    image: "https://micomi-assets.me/Pvp%20Assets/Ranks%20badge/Cipher.png",
  },
  {
    rank_id: 6,
    name: "Root",
    legacyName: "Legend",
    minPoints: 9900,
    maxPoints: 13599,
    image: "https://micomi-assets.me/Pvp%20Assets/Ranks%20badge/Root.png",
  },
  {
    rank_id: 7,
    name: "Nexus",
    legacyName: "Mythic",
    minPoints: 13600,
    maxPoints: null,
    image: "https://micomi-assets.me/Pvp%20Assets/Ranks%20badge/Nexus.png",
  },
];

const WIN_BASE_BY_TIER = [56, 52, 48, 44, 40, 36, 32];
const LOSS_BASE_BY_TIER = [18, 22, 26, 30, 34, 38, 42];

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const getRankTierByPoints = (points: number): RankTier => {
  const safePoints = Math.max(0, Math.floor(points));

  for (const tier of RANK_TIERS) {
    const max = tier.maxPoints;
    if (max === null) {
      return tier;
    }

    if (safePoints >= tier.minPoints && safePoints <= max) {
      return tier;
    }
  }

  return RANK_TIERS[0];
};

export const getRankProgressByPoints = (points: number) => {
  const safePoints = Math.max(0, Math.floor(points));
  const tier = getRankTierByPoints(safePoints);
  const currentTierIndex = RANK_TIERS.findIndex(
    (item) => item.name === tier.name,
  );
  const nextTier =
    currentTierIndex >= 0 && currentTierIndex < RANK_TIERS.length - 1
      ? RANK_TIERS[currentTierIndex + 1]
      : null;

  if (tier.maxPoints === null) {
    return {
      player_rank_name: tier.name,
      player_rank_image: tier.image,
      player_rank_points: safePoints,
      rank_legacy_name: tier.legacyName,
      rank_progress_current: 0,
      rank_progress_required: 0,
      next_rank_name: null,
      next_rank_image: null,
    };
  }

  const required = tier.maxPoints - tier.minPoints + 1;
  const progress = clamp(safePoints - tier.minPoints, 0, required);

  return {
    player_rank_name: tier.name,
    player_rank_image: tier.image,
    player_rank_points: safePoints,
    rank_legacy_name: tier.legacyName,
    rank_progress_current: progress,
    rank_progress_required: required,
    next_rank_name: nextTier?.name ?? null,
    next_rank_image: nextTier?.image ?? null,
  };
};

const calculateWinnerDelta = (
  winnerTierIndex: number,
  loserTierIndex: number,
  winnerMistakes: number,
): number => {
  const base =
    WIN_BASE_BY_TIER[clamp(winnerTierIndex, 0, WIN_BASE_BY_TIER.length - 1)];
  const tierDiff = loserTierIndex - winnerTierIndex;

  const upsetBonus = clamp(tierDiff * 6, -10, 18);
  const precisionBonus = clamp(12 - winnerMistakes * 3, 0, 12);

  return Math.max(12, base + upsetBonus + precisionBonus);
};

const calculateLoserDelta = (
  loserTierIndex: number,
  winnerTierIndex: number,
  loserMistakes: number,
): number => {
  const base =
    LOSS_BASE_BY_TIER[clamp(loserTierIndex, 0, LOSS_BASE_BY_TIER.length - 1)];
  const tierDiff = winnerTierIndex - loserTierIndex;

  const mismatchModifier = clamp(tierDiff * 4, -12, 10);
  const mistakePenalty = clamp(loserMistakes * 2, 0, 10);

  const grossLoss = Math.max(8, base - mismatchModifier + mistakePenalty);
  return -grossLoss;
};

export const applyPvpRankResult = async (
  prisma: PrismaClient,
  params: {
    winnerPlayerId: number;
    loserPlayerId: number;
    winnerMistakes: number;
    loserMistakes: number;
  },
) => {
  const { winnerPlayerId, loserPlayerId, winnerMistakes, loserMistakes } =
    params;

  return prisma.$transaction(async (tx) => {
    const [winner, loser] = await Promise.all([
      tx.player.findUnique({
        where: { player_id: winnerPlayerId },
        select: { player_id: true, player_rank_points: true },
      }),
      tx.player.findUnique({
        where: { player_id: loserPlayerId },
        select: { player_id: true, player_rank_points: true },
      }),
    ]);

    if (!winner || !loser) {
      throw new Error("Could not apply rank points: player not found");
    }

    const winnerPointsBefore = Math.max(0, winner.player_rank_points ?? 0);
    const loserPointsBefore = Math.max(0, loser.player_rank_points ?? 0);

    const winnerTier = getRankTierByPoints(winnerPointsBefore);
    const loserTier = getRankTierByPoints(loserPointsBefore);

    const winnerTierIndex = RANK_TIERS.findIndex(
      (tier) => tier.name === winnerTier.name,
    );
    const loserTierIndex = RANK_TIERS.findIndex(
      (tier) => tier.name === loserTier.name,
    );

    const winnerDelta = calculateWinnerDelta(
      winnerTierIndex,
      loserTierIndex,
      winnerMistakes,
    );
    const loserDelta = calculateLoserDelta(
      loserTierIndex,
      winnerTierIndex,
      loserMistakes,
    );

    const winnerPointsAfter = Math.max(0, winnerPointsBefore + winnerDelta);
    const loserPointsAfter = Math.max(0, loserPointsBefore + loserDelta);

    const winnerProgress = getRankProgressByPoints(winnerPointsAfter);
    const loserProgress = getRankProgressByPoints(loserPointsAfter);

    await Promise.all([
      tx.player.update({
        where: { player_id: winnerPlayerId },
        data: {
          player_rank_points: winnerProgress.player_rank_points,
          player_rank_name: winnerProgress.player_rank_name,
          player_rank_image: winnerProgress.player_rank_image,
        },
      }),
      tx.player.update({
        where: { player_id: loserPlayerId },
        data: {
          player_rank_points: loserProgress.player_rank_points,
          player_rank_name: loserProgress.player_rank_name,
          player_rank_image: loserProgress.player_rank_image,
        },
      }),
    ]);

    return {
      winner: {
        player_id: winnerPlayerId,
        delta: winnerDelta,
        before_points: winnerPointsBefore,
        ...winnerProgress,
      },
      loser: {
        player_id: loserPlayerId,
        delta: loserDelta,
        before_points: loserPointsBefore,
        ...loserProgress,
      },
    };
  });
};

export const getAllRankTiers = () => {
  return RANK_TIERS.map((tier) => ({
    rank_id: tier.rank_id,
    name: tier.name,
    legacyName: tier.legacyName,
    minPoints: tier.minPoints,
    maxPoints: tier.maxPoints,
    image: tier.image,
  }));
};

//yowww
