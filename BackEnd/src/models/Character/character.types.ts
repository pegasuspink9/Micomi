import { Prisma } from "@prisma/client";

export interface CharacterCreateInput {
  character_name: string;
  character_type: string;
  health: number;
  weapon_name: string;
  weapon_skill: string;
  character_damage: Prisma.InputJsonValue;

  avatar_image: string;
  character_hurt?: string;
  character_dies?: string;
  character_attack?: string;
  character_run?: string;

  character_avatar?: string;
  hero_lottie?: string;
  character_image_dispaly?: string;

  user_coins?: number;

  character_attacks?: Prisma.InputJsonValue; //["basic_attack", "second_attack", "special_attack"] animation links
}

export interface CharacterUpdateInput {
  character_name?: string;
  character_type?: string;
  health?: number;
  weapon_name?: string;
  weapon_skill?: string;
  character_damage?: Prisma.InputJsonValue;

  avatar_image: string;
  character_hurt?: string;
  character_dies?: string;
  character_attack?: string;

  character_avatar?: string;
  hero_lottie?: string;
  character_image_dispaly?: string;

  user_coins?: number;

  character_attacks?: Prisma.InputJsonValue;
}
