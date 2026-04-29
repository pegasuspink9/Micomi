import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAllThemes = async (playerId: number) => {
  const player = await prisma.player.findUnique({
    where: { player_id: playerId },
    select: {
      player_id: true,
      player_name: true,
      diamonds: true,
    },
  });

  if (!player) {
    throw new Error("Player not found.");
  }

  const allThemes = await prisma.themeShop.findMany();

  const playerThemes = await prisma.playerTheme.findMany({
    where: { player_id: playerId },
  });

  const mappedThemes = allThemes.map((theme) => {
    const ownership = playerThemes.find((pt) => pt.theme_id === theme.theme_id);
    return {
      ...theme,
      isOwned: !!ownership,
      isSelected: ownership?.is_selected || false,
    };
  });

  return {
    player_id: player.player_id,
    player_name: player.player_name,
    diamonds: player.diamonds,
    themes: mappedThemes,
  };
};

export const purchaseThemeById = async (playerId: number, themeId: number) => {
  const theme = await prisma.themeShop.findUnique({
    where: { theme_id: themeId },
  });

  if (!theme) {
    throw new Error(`Theme with ID ${themeId} not found.`);
  }

  const player = await prisma.player.findUnique({
    where: { player_id: playerId },
  });

  if (!player) {
    throw new Error(`Player not found.`);
  }

  if (player.diamonds < theme.price) {
    throw new Error("Not enough diamonds to purchase this theme.");
  }

  const alreadyOwned = await prisma.playerTheme.findUnique({
    where: {
      player_id_theme_id: { player_id: playerId, theme_id: themeId },
    },
  });

  if (alreadyOwned) {
    throw new Error("You already own this theme.");
  }

  await prisma.$transaction([
    prisma.player.update({
      where: { player_id: playerId },
      data: { diamonds: { decrement: theme.price } },
    }),
    prisma.playerTheme.create({
      data: {
        player_id: playerId,
        theme_id: themeId,
        is_selected: false,
      },
    }),
  ]);

  return {
    theme_id: theme.theme_id,
    theme_name: theme.theme_name,
    theme_color: theme.theme_color,
    remaining_diamonds: player.diamonds - theme.price,
  };
};

export const selectPlayerThemeById = async (
  playerId: number,
  themeId: number,
) => {
  const ownership = await prisma.playerTheme.findUnique({
    where: {
      player_id_theme_id: { player_id: playerId, theme_id: themeId },
    },
    include: { theme: true },
  });

  if (!ownership) {
    throw new Error(`You do not own the theme with ID ${themeId}.`);
  }

  await prisma.$transaction([
    prisma.playerTheme.updateMany({
      where: { player_id: playerId },
      data: { is_selected: false },
    }),
    prisma.playerTheme.update({
      where: { player_theme_id: ownership.player_theme_id },
      data: { is_selected: true },
    }),
  ]);

  return {
    theme_id: ownership.theme_id,
    theme_name: ownership.theme.theme_name,
    theme_color: ownership.theme.theme_color,
    is_selected: true,
  };
};
