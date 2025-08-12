import { PotionType, ShopItemType } from "@prisma/client";

export interface ShopCreateInput {
  item_type: ShopItemType;
  potion_type?: PotionType | null;
  potion_description?: string | null;
  potion_price?: number | null;
  potion_health_boost?: number | null;
  character_id?: number | null;
  character_price?: number | null;
  player_id?: number | null;
  is_active?: boolean;
}

export interface ShopUpdateInput {
  item_type?: ShopItemType;
  potion_type?: PotionType | null;
  potion_description?: string | null;
  potion_price?: number | null;
  potion_health_boost?: number | null;
  character_id?: number | null;
  character_price?: number | null;
  player_id?: number | null;
  is_active?: boolean;
}

export type InventoryItem =
  | {
      type: "potion";
      name: string;
      quantity: number;
      is_selected?: boolean;
    }
  | {
      type: "character";
      name: string;
      character_id: number;
      is_purchased: boolean;
      is_selected?: boolean;
    };
