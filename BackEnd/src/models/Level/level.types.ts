import { DifficultyLevel } from "@prisma/client";

export interface LevelCreateInput {
  map_id: number;
  level_number: number;
  level_type: DifficultyLevel;
  content: string;
  points_reward: number;
  feedback_message: string;
}

export interface LevelUpdateInput {
  level_id?: number;
  map_id?: number;
  level_number?: number;
  level_type: DifficultyLevel;
  content?: string;
  points_reward?: number;
  feedback_message?: string;
}
