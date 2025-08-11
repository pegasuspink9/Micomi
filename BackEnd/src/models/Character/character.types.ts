export interface CharacterCreateInput {
  character_name: string;
  avatar_image: string;
  character_type: string;
  health: number;
  weapon_name: string;
  weapon_skill: string;
  character_damage: number;
}

export interface CharacterUpdateInput {
  character_name?: string;
  avatar_image?: string;
  character_type?: string;
  health?: number;
  weapon_name?: string;
  weapon_skill?: string;
  character_damage?: number;
}
