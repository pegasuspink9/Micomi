import { PrismaClient } from "@prisma/client";
import { SocialProfileResponse } from "./social.types";
import { getPlayerProfile } from "../Player/player.service";

const prisma = new PrismaClient() as any;

const normalizeFriendPair = (firstPlayerId: number, secondPlayerId: number) => {
  return firstPlayerId < secondPlayerId
    ? [firstPlayerId, secondPlayerId]
    : [secondPlayerId, firstPlayerId];
};

const getFriendCount = async (playerId: number) => {
  return prisma.friend.count({
    where: {
      OR: [{ player_one_id: playerId }, { player_two_id: playerId }],
    },
  });
};

export const sendFriendRequest = async (senderId: number, playerId: number) => {
  if (senderId === playerId) {
    throw new Error("You cannot send a friend request to yourself.");
  }

  const receiver = await prisma.player.findUnique({
    where: { player_id: playerId },
    select: { player_id: true },
  });

  if (!receiver) {
    throw new Error("Target player not found.");
  }

  const [playerOneId, playerTwoId] = normalizeFriendPair(senderId, playerId);
  const existingFriendship = await prisma.friend.findUnique({
    where: {
      player_one_id_player_two_id: {
        player_one_id: playerOneId,
        player_two_id: playerTwoId,
      },
    },
  });

  if (existingFriendship) {
    throw new Error("You are already friends with this player.");
  }

  const [existingDirect, existingReverse] = await Promise.all([
    prisma.friendRequest.findUnique({
      where: {
        sender_id_receiver_id: {
          sender_id: senderId,
          receiver_id: playerId,
        },
      },
    }),
    prisma.friendRequest.findUnique({
      where: {
        sender_id_receiver_id: {
          sender_id: playerId,
          receiver_id: senderId,
        },
      },
    }),
  ]);

  if (existingDirect?.status === "pending") {
    throw new Error("Friend request already sent.");
  }

  if (existingReverse?.status === "pending") {
    throw new Error("This player has already sent you a friend request.");
  }

  return prisma.friendRequest.upsert({
    where: {
      sender_id_receiver_id: {
        sender_id: senderId,
        receiver_id: playerId,
      },
    },
    create: {
      sender_id: senderId,
      receiver_id: playerId,
      status: "pending",
    },
    update: {
      status: "pending",
      responded_at: null,
      created_at: new Date(),
    },
    include: {
      sender: {
        select: {
          player_id: true,
          username: true,
          player_name: true,
          player_avatar: true,
        },
      },
      receiver: {
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

export const acceptFriendRequest = async (
  requestId: number,
  playerId: number,
) => {
  const request = await prisma.friendRequest.findFirst({
    where: {
      friend_request_id: requestId,
      receiver_id: playerId,
      status: "pending",
    },
  });

  if (!request) {
    throw new Error("Friend request not found or already handled.");
  }

  const [playerOneId, playerTwoId] = normalizeFriendPair(
    request.sender_id,
    request.receiver_id,
  );

  return prisma.$transaction(async (tx: any) => {
    const updatedRequest = await tx.friendRequest.update({
      where: { friend_request_id: requestId },
      data: {
        status: "accepted",
        responded_at: new Date(),
      },
    });

    await tx.friend.upsert({
      where: {
        player_one_id_player_two_id: {
          player_one_id: playerOneId,
          player_two_id: playerTwoId,
        },
      },
      create: {
        player_one_id: playerOneId,
        player_two_id: playerTwoId,
      },
      update: {},
    });

    return updatedRequest;
  });
};

export const declineFriendRequest = async (
  requestId: number,
  playerId: number,
) => {
  const request = await prisma.friendRequest.findFirst({
    where: {
      friend_request_id: requestId,
      receiver_id: playerId,
      status: "pending",
    },
  });

  if (!request) {
    throw new Error("Friend request not found or already handled.");
  }

  return prisma.friendRequest.update({
    where: { friend_request_id: requestId },
    data: {
      status: "declined",
      responded_at: new Date(),
    },
  });
};

export const getIncomingFriendRequests = async (playerId: number) => {
  return prisma.friendRequest.findMany({
    where: {
      receiver_id: playerId,
      status: "pending",
    },
    include: {
      sender: {
        select: {
          player_id: true,
          player_name: true,
          username: true,
          player_avatar: true,
          level: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });
};

export const getFriends = async (playerId: number) => {
  const friendships = await prisma.friend.findMany({
    where: {
      OR: [{ player_one_id: playerId }, { player_two_id: playerId }],
    },
    include: {
      playerOne: {
        select: {
          player_id: true,
          player_name: true,
          username: true,
          player_avatar: true,
          level: true,
          last_active: true,
        },
      },
      playerTwo: {
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

  return friendships.map((friendship: any) => {
    const friend =
      friendship.player_one_id === playerId
        ? friendship.playerTwo
        : friendship.playerOne;

    return {
      friendship_id: friendship.friend_id,
      became_friends_at: friendship.created_at,
      friend,
    };
  });
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

  const [isFriend, outgoingPending, incomingPending] = await Promise.all([
    prisma.friend.count({
      where: {
        OR: [
          { player_one_id: viewerId, player_two_id: targetPlayerId },
          { player_one_id: targetPlayerId, player_two_id: viewerId },
        ],
      },
    }),
    prisma.friendRequest.findFirst({
      where: {
        sender_id: viewerId,
        receiver_id: targetPlayerId,
        status: "pending",
      },
      select: { friend_request_id: true },
    }),
    prisma.friendRequest.findFirst({
      where: {
        sender_id: targetPlayerId,
        receiver_id: viewerId,
        status: "pending",
      },
      select: { friend_request_id: true },
    }),
  ]);

  let relationStatus: SocialProfileResponse["relation_status"] = "none";

  if (isFriend > 0) {
    relationStatus = "friend";
  } else if (outgoingPending) {
    relationStatus = "outgoing_pending";
  } else if (incomingPending) {
    relationStatus = "incoming_pending";
  }

  return {
    ...publicProfile,
    relation_status: relationStatus,
  };
};
