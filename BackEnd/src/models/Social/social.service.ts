import { PrismaClient } from "@prisma/client";
import { getPlayerProfile } from "../Player/player.service";
import { SocialProfileResponse } from "./social.types";

const prisma = new PrismaClient() as any;

const normalizeFollowPair = (followerId: number, followingId: number) => ({
  follower_id: followerId,
  following_id: followingId,
});

const getFollowersCount = async (playerId: number) => {
  return prisma.follow.count({
    where: { following_id: playerId },
  });
};

const getFollowingCount = async (playerId: number) => {
  return prisma.follow.count({
    where: { follower_id: playerId },
  });
};

const ensurePlayerExists = async (playerId: number) => {
  const player = await prisma.player.findUnique({
    where: { player_id: playerId },
    select: { player_id: true },
  });

  if (!player) {
    throw new Error("Target player not found.");
  }
};

const createFollow = async (followerId: number, followingId: number) => {
  if (followerId === followingId) {
    throw new Error("You cannot follow yourself.");
  }

  await ensurePlayerExists(followingId);

  return prisma.follow.upsert({
    where: {
      follower_id_following_id: normalizeFollowPair(followerId, followingId),
    },
    create: normalizeFollowPair(followerId, followingId),
    update: {},
    include: {
      follower: {
        select: {
          player_id: true,
          username: true,
          player_name: true,
          player_avatar: true,
        },
      },
      following: {
        select: {
          player_id: true,
          username: true,
          player_name: true,
          player_avatar: true,
        },
      },
    },
  });
};

export const followPlayer = async (followerId: number, followingId: number) => {
  return createFollow(followerId, followingId);
};

export const followBackPlayer = async (
  followerId: number,
  targetPlayerId: number,
) => {
  const incomingFollow = await prisma.follow.findFirst({
    where: {
      follower_id: targetPlayerId,
      following_id: followerId,
    },
  });

  if (!incomingFollow) {
    throw new Error("This player is not following you yet.");
  }

  return createFollow(followerId, targetPlayerId);
};

export const unfollowPlayer = async (
  followerId: number,
  followingId: number,
) => {
  const follow = await prisma.follow.findUnique({
    where: {
      follower_id_following_id: {
        follower_id: followerId,
        following_id: followingId,
      },
    },
  });

  if (!follow) {
    throw new Error("Follow relationship not found.");
  }

  return prisma.follow.delete({
    where: {
      follower_id_following_id: {
        follower_id: followerId,
        following_id: followingId,
      },
    },
  });
};

export const getFollowers = async (playerId: number) => {
  const followers = await prisma.follow.findMany({
    where: { following_id: playerId },
    include: {
      follower: {
        select: {
          player_id: true,
          player_name: true,
          username: true,
          player_avatar: true,
          level: true,
          last_active: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  return followers.map((follow: any) => ({
    follow_id: follow.follow_id,
    created_at: follow.created_at,
    player: follow.follower,
  }));
};

export const getFollowing = async (playerId: number) => {
  const following = await prisma.follow.findMany({
    where: { follower_id: playerId },
    include: {
      following: {
        select: {
          player_id: true,
          player_name: true,
          username: true,
          player_avatar: true,
          level: true,
          last_active: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  return following.map((follow: any) => ({
    follow_id: follow.follow_id,
    created_at: follow.created_at,
    player: follow.following,
  }));
};

export const getPublicPlayerProfile = async (
  viewerId: number,
  targetPlayerId: number,
): Promise<SocialProfileResponse> => {
  const targetProfile = await getPlayerProfile(targetPlayerId);

  if (!targetProfile) {
    throw new Error("Player not found.");
  }

  const { ownedPotions, quests, ...publicProfile } = targetProfile as any;

  if (viewerId === targetPlayerId) {
    return {
      ...publicProfile,
      relation_status: "self",
    };
  }

  const [viewerFollowsTarget, targetFollowsViewer] = await Promise.all([
    prisma.follow.findFirst({
      where: {
        follower_id: viewerId,
        following_id: targetPlayerId,
      },
      select: { follow_id: true },
    }),
    prisma.follow.findFirst({
      where: {
        follower_id: targetPlayerId,
        following_id: viewerId,
      },
      select: { follow_id: true },
    }),
  ]);

  let relationStatus: SocialProfileResponse["relation_status"] = "none";

  if (viewerFollowsTarget && targetFollowsViewer) {
    relationStatus = "mutual";
  } else if (viewerFollowsTarget) {
    relationStatus = "following";
  } else if (targetFollowsViewer) {
    relationStatus = "followed_by";
  }

  return {
    ...publicProfile,
    relation_status: relationStatus,
  };
};
