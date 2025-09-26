export interface AchievementCreateInput {
  achievement_name: string;
  description: string;
  badge_icon?: string;
  conditions: string;
}

export interface AchievementUpdateInput {
  achievement_name?: string;
  description?: string;
  badge_icon?: string;
  conditions?: string;
}
