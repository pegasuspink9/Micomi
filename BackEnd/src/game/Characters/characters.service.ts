import { PrismaClient } from "@prisma/client";
import { InventoryItem } from "models/Shop/shop.types";

const prisma = new PrismaClient();

export async function getSelectedCharacterId(
  playerId: number
): Promise<number | null> {
  const player = await prisma.player.findUnique({
    where: { player_id: playerId },
  });
  if (!player) return null;
  const inventory: InventoryItem[] =
    (player.inventory as unknown as InventoryItem[]) || [];
  const selected = inventory.find(
    (item) => item.type === "character" && item.is_selected
  );
  return selected?.character_id || null;
}
