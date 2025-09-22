import { QuestType } from "@prisma/client";

export interface CreateQuestDto {
  title: string;
  description: string;
  objective_type: QuestType;
  target_value: number;
  reward_exp: number;
  reward_coins: number;
}

export interface UpdateQuestDto {
  title?: string;
  description?: string;
  objective_type?: QuestType;
  target_value?: number;
  reward_exp?: number;
  reward_coins?: number;
  is_template?: boolean;
}
