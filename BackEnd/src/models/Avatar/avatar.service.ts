import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface AvatarOption {
  id: number;
  url: string;
}

const AVATAR_LIST: AvatarOption[] = [
  {
    id: 1,
    url: "https://micomi-assets.me/Player%20Avatars%20Final/Avatar_1.png",
  },
  {
    id: 2,
    url: "https://micomi-assets.me/Player%20Avatars%20Final/Avatar_2.png",
  },
  {
    id: 3,
    url: "https://micomi-assets.me/Player%20Avatars%20Final/Avatar_3.png",
  },
  {
    id: 4,
    url: "https://micomi-assets.me/Player%20Avatars%20Final/Avatar_4.png",
  },
  {
    id: 5,
    url: "https://micomi-assets.me/Player%20Avatars%20Final/Avatar_5.png",
  },
  {
    id: 6,
    url: "https://micomi-assets.me/Player%20Avatars%20Final/Avatar_8.png",
  },
  {
    id: 7,
    url: "https://micomi-assets.me/Player%20Avatars%20Final/Avatar_11.png",
  },
  {
    id: 8,
    url: "https://micomi-assets.me/Player%20Avatars%20Final/Avatar_14.png",
  },
];

export const getAllAvatars = () => {
  return AVATAR_LIST;
};

export const updatePlayerAvatarById = async (
  playerId: number,
  avatarId: number,
) => {
  const selectedAvatar = AVATAR_LIST.find((avatar) => avatar.id === avatarId);

  if (!selectedAvatar) {
    throw new Error(`Avatar with ID ${avatarId} not found.`);
  }

  const updatedPlayer = await prisma.player.update({
    where: { player_id: playerId },
    data: {
      player_avatar: selectedAvatar.url,
    },
    select: {
      player_id: true,
      username: true,
      player_avatar: true,
    },
  });

  return updatedPlayer;
};
