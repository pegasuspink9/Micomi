import { prisma } from "../../../prisma/client";

const DEFAULT_CHARACTER_ID = 4;

export const ensureDefaultCharacter = async (playerId: number) => {
  const selectedCharacter = await prisma.playerCharacter.findFirst({
    where: {
      player_id: playerId,
      is_selected: true,
    },
  });

  if (!selectedCharacter) {
    const defaultChar = await prisma.playerCharacter.findUnique({
      where: {
        player_id_character_id: {
          player_id: playerId,
          character_id: DEFAULT_CHARACTER_ID,
        },
      },
    });

    if (defaultChar) {
      await prisma.playerCharacter.update({
        where: { player_character_id: defaultChar.player_character_id },
        data: { is_selected: true },
      });
    } else {
      await prisma.playerCharacter.create({
        data: {
          player_id: playerId,
          character_id: DEFAULT_CHARACTER_ID,
          is_purchased: true,
          is_selected: true,
        },
      });
    }

    console.log(`Assigned default character to player ${playerId}`);
  }
};

export const selectCharacter = async (
  playerId: number,
  characterId: number
) => {
  const playerChar = await prisma.playerCharacter.findUnique({
    where: {
      player_id_character_id: {
        player_id: playerId,
        character_id: characterId,
      },
    },
  });

  if (!playerChar || !playerChar.is_purchased) {
    return { message: "Character not owned by player" };
  }

  await prisma.playerCharacter.updateMany({
    where: { player_id: playerId },
    data: { is_selected: false },
  });

  await prisma.playerCharacter.update({
    where: { player_character_id: playerChar.player_character_id },
    data: { is_selected: true },
  });

  return { message: "Character selected" };
};
