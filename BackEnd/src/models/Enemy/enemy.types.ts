export interface EnemyCreateInput {
  enemy_name: string;
  enemy_description: string;
  enemy_difficulty: string;
  enemy_map: string;
  enemy_skills: string;
  enemy_health: number;
  enemy_damage: number;

  enemy_avatar?: string;
  enemy_attack?: string;
  enemy_dies?: string;

  enemy_coins?: number;
}

export interface EnemyUpdateInput {
  enemy_name?: string;
  enemy_description?: string;
  enemy_difficulty?: string;
  enemy_map?: string;
  enemy_skills?: string;
  enemy_health?: number;
  enemy_damage?: number;

  enemy_avatar?: string;
  enemy_attack?: string;
  enemy_dies?: string;

  enemy_coins?: number;
}
