import { Prisma } from "@prisma/client";

export interface ChallengeDTO {
  challenge_id: number;
  challenge_type: string;
  title: string;
  description: string;
  correct_answer: any;
  hint: string;
  points_reward: number;
  coins_reward: number;
  guide?: string | null;
  test_cases?: Prisma.InputJsonValue | null;

  timeLimit: number;
  timeRemaining: number;
  timer: string;
}
