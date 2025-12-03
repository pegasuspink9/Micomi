export interface AchievementCreateInput {
  achievement_name: string;
  description: string;
  badge_icon?: string;
  conditions: string;
  landscape_image?: string;
}

export interface AchievementUpdateInput {
  achievement_name?: string;
  description?: string;
  badge_icon?: string;
  conditions?: string;
  landscape_image?: string;
}
