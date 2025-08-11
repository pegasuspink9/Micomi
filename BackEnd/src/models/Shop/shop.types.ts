import { PotionType } from "@prisma/client";

export interface ShopCreateInput {
  potion_type?: PotionType;
  potion_description?: string;
  potion_price?: number;
  potion_health_boost?: number;
  character_id?: number | null;
  character_price?: number;
  is_active?: boolean;
}

export interface ShopUpdateInput {
  potion_type?: PotionType;
  potion_description?: string;
  potion_price?: number;
  potion_health_boost?: number;
  character_id?: number | null;
  character_price?: number;
  is_active?: boolean;
}

export interface InventoryItem {
  type: "potion" | "character";
  name: string;
  quantity?: number;
  healthBoost?: number;
  character_id?: number | null;
  is_purchased?: boolean;
  is_selected?: boolean;
}
