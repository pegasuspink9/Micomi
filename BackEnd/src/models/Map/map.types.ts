import { DifficultyLevel } from "@prisma/client";

export interface MapCreateInput {
  map_name: string;
  description: string;
  difficulty_level: DifficultyLevel;
  map_image: string;
  is_active?: boolean;
}

export interface MapUpdateInput {
  map_name?: string;
  description?: string;
  difficulty_level?: DifficultyLevel;
  map_image?: string;
  is_active?: boolean;
}
