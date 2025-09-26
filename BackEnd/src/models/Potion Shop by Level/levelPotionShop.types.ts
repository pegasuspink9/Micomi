import { Prisma } from "@prisma/client";

export interface LevelPotionShopCreateInput {
  level_id: number;
  potions_avail: Prisma.InputJsonValue;
  health_quantity: number;
  strong_quantity: number;
  freeze_quantity: number;
  hint_quantity: number;
}

export interface LevelPotionShopUpdateInput {
  level_id?: number;
  potions_avail?: Prisma.InputJsonValue;
  health_quantity?: number;
  strong_quantity?: number;
  freeze_quantity?: number;
  hint_quantity?: number;
}
