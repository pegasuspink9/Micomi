import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface AvatarOption {
  id: number;
  url: string;
}

const AVATAR_LIST: AvatarOption[] = [
  {
    id: 1,
    url: "https://micomi-assets.me/Player%20Avatars/original-32a59694e59c7e9536e5a32d105292c7.webp",
  },
  {
    id: 2,
    url: "https://micomi-assets.me/Player%20Avatars/niedlich-astronaut-gamer-halten-joystick-mit-kopfhoerer-karikatur-vektor-symbol-abbildung-wissenschaft-techno_138676-6590.avif",
  },
  {
    id: 3,
    url: "https://micomi-assets.me/Player%20Avatars/gaming-mascot-logo-vector-59845947.avif",
  },
  {
    id: 4,
    url: "https://micomi-assets.me/Player%20Avatars/cute-astronaut-playing-vr-game-with-controller-cartoon-vector-icon-illustration-science-technology_138676-13977.avif",
  },
  {
    id: 5,
    url: "https://micomi-assets.me/Player%20Avatars/a-man-wearing-headphones-and-sunglasses-is-wearing-a-hoodie-free-vector.jpg",
  },
  {
    id: 6,
    url: "https://micomi-assets.me/Player%20Avatars/8300_8_03.jpg",
  },
  {
    id: 7,
    url: "https://micomi-assets.me/Player%20Avatars/2169.jpg",
  },
];

export const getAllAvatars = () => {
  return AVATAR_LIST;
};

export const updatePlayerAvatarById = async (
  playerId: number,
  avatarId: number
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
