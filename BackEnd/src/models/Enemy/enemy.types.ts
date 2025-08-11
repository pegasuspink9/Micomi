export interface EnemyCreateInput {
  level_id: number;
  enemy_name: string;
  enemy_description: string;
  enemy_difficulty: string;
  enemy_avatar: string;
  enemy_skills: string;
  enemy_health: number;
  enemy_damage: number;
}

export interface EnemyUpdateInput {
  level_id?: number;
  enemy_name?: string;
  enemy_description?: string;
  enemy_difficulty?: string;
  enemy_avatar?: string;
  enemy_skills?: string;
  enemy_health?: number;
  enemy_damage?: number;
}
