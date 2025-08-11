export interface playerAchievementCreateInput {
  player_id: number;
  achievement_id: number;
  earned_at: Date;
}

export interface playerAchievementUpdateInput {
  player_id: number;
  achievement_id?: number;
  earned_at?: Date;
}
