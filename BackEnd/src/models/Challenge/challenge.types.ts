import { Prisma } from "@prisma/client";

export interface ChallengeCreateInput {
  level_id: number;
  challenge_type: string;
  correct_answer: Prisma.InputJsonValue;
  points_reward: number;
  coins_reward: number;
  guide?: string;
  options?: Prisma.InputJsonValue;
}

export interface ChallengeUpdateInput {
  level_id?: number;
  challenge_type?: string;
  correct_answer?: Prisma.InputJsonValue;
  points_reward?: number;
  coins_reward?: number;
  guide?: string;
  options?: Prisma.InputJsonValue;
}
