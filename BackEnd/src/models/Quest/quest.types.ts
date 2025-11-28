import { QuestType, QuestPeriod } from "@prisma/client";

export interface CreateQuest {
  title: string;
  description: string;
  objective_type: QuestType;
  target_value: number;
  reward_exp: number;
  reward_coins: number;
  quest_period?: QuestPeriod;
}

export interface UpdateQuest {
  title?: string;
  description?: string;
  objective_type?: QuestType;
  target_value?: number;
  reward_exp?: number;
  reward_coins?: number;
  quest_period?: QuestPeriod;
}
