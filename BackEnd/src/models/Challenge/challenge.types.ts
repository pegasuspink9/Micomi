export interface ChallengeCreateInput {
  level_id: number;
  challenge_type: string;
  title: string;
  description: string;
  correct_answer: string;
  hint: string;
  points_reward: number;
  coins_reward: number;
  guide?: string;
  test_cases?: string;
}

export interface ChallengeUpdateInput {
  level_id?: number;
  challenge_type?: string;
  title?: string;
  description?: string;
  correct_answer?: string;
  hint?: string;
  points_reward?: number;
  coins_reward?: number;
  guide?: string;
  test_cases?: string;
}
