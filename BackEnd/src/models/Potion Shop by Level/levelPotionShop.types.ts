import { Prisma } from "@prisma/client";

export interface LevelPotionShopCreateInput {
  level_id: number;
  potions_avail: Prisma.InputJsonValue;
  health_potion_price: number;
  energy_potion_price: number;
  health_quantity: number;
  energy_quantity: number;
}

export interface LevelPotionShopUpdateInput {
  level_id?: number;
  potions_avail?: Prisma.InputJsonValue;
  health_potion_price?: number;
  energy_potion_price?: number;
  health_quantity?: number;
  energy_quantity?: number;
}
