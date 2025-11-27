import { prisma } from "../../../prisma/client";

export const selectCharacter = async (
  playerId: number,
  characterShopId: number
) => {
  const characterShop = await prisma.characterShop.findUnique({
    where: {
      character_shop_id: characterShopId,
    },
    select: {
      character_id: true,
    },
  });

  if (!characterShop) {
    throw new Error("Character shop item not found");
  }

  const characterId = characterShop.character_id;

  const playerChar = await prisma.playerCharacter.findUnique({
    where: {
      player_id_character_id: {
        player_id: playerId,
        character_id: characterId,
      },
    },
  });

  if (!playerChar || !playerChar.is_purchased) {
    throw new Error("Character not owned by player");
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
