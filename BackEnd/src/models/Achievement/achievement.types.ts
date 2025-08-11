export interface AchievementCreateInput {
  name: string;
  description: string;
  badge_icon: string;
  points_required: number;
  achievement_type: string;
}

export interface AchievementUpdateInput {
  name?: string;
  description?: string;
  badge_icon?: string;
  points_required?: number;
  achievement_type?: string;
}
