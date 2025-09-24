import { DifficultyLevel } from "@prisma/client";

export interface LevelCreateInput {
  map_id: number;
  level_number: number;
  level_type: string;
  level_difficulty: DifficultyLevel;
  level_title?: string;
  content: string;
  feedback_message: string;
}

export interface LevelUpdateInput {
  level_id?: number;
  map_id?: number;
  level_number?: number;
  level_type?: string;
  level_difficulty?: DifficultyLevel;
  level_title?: string;
  content?: string;
  feedback_message?: string;
}
