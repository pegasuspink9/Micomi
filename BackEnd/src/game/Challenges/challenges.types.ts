export interface SubmitChallengeServiceResult {
  isCorrect: boolean;
  attempts: number;
  fightResult: unknown;
  message: string;
  nextChallenge: unknown | null;
}

export interface CompletionRewards {
  feedbackMessage?: string | null;
  currentTotalPoints?: number;
  currentExpPoints?: number;
}

export interface SubmitChallengeControllerResult
  extends SubmitChallengeServiceResult {
  levelStatus: {
    isCompleted: boolean;
    battleWon: boolean;
    battleLost: boolean;
    canProceed: boolean;
    showFeedback: boolean;
    playerHealth: number | null;
    enemyHealth: number | null;
  };
  completionRewards?: CompletionRewards;
  nextLevel?: {
    level_id: number;
    level_number: number;
    is_unlocked: boolean;
  } | null;
}
