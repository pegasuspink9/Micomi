export interface CharacterCreateInput {
  character_name: string;
  character_type: string;
  health: number;
  weapon_name: string;
  weapon_skill: string;
  character_damage: number;

  avatar_image: string;
  character_hurt?: string;
  character_dies?: string;
  character_attack?: string;

  user_coins?: number;
}

export interface CharacterUpdateInput {
  character_name?: string;
  character_type?: string;
  health?: number;
  weapon_name?: string;
  weapon_skill?: string;
  character_damage?: number;

  avatar_image: string;
  character_hurt?: string;
  character_dies?: string;
  character_attack?: string;

  user_coins?: number;
}
