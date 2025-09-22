import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
  if (!playerChar || !playerChar.is_purchased)
    throw new Error("Character not owned by player");

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
