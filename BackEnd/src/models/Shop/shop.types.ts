import { PotionType } from "@prisma/client";

export interface ShopPotionCreateInput {
  potion_type: PotionType;
  potion_name: string;
  potion_description: string;
  potion_price: number;
  potion_url?: string;
}

export interface ShopPotionUpdateInput {
  potion_type?: PotionType;
  potion_name?: string;
  potion_description?: string;
  potion_price?: number;
  potion_url?: string;
}

export interface ShopCharacterCreateInput {
  character_id: number;
  character_price: number;
}

export interface ShopCharacterUpdateInput {
  character_id?: number;
  character_price?: number;
}

//temporary
export interface isPurchasedEdit {
  is_purchased?: boolean;
  is_selected?: boolean;
}
