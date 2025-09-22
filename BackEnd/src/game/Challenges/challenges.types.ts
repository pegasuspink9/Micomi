export interface FightResult {
  status: string;
  charHealth: number;
  enemyHealth: number;
  enemyMaxHealth: number;
  attackType: string | null;
  damage: number;
  timer: string;
  energy: number;
  timeToNextEnergyRestore: string | null;
}

export interface SubmitChallengeServiceResult {
  isCorrect: boolean;
  attempts: number;
  fightResult: FightResult;
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
  levelStatus: LevelStatus;
  completionRewards?: CompletionRewards;
  nextLevel?: {
    level_id: number;
    level_number: number;
    is_unlocked: boolean;
  } | null;
}

export interface LevelStatus {
  isCompleted: boolean;
  battleWon: boolean;
  battleLost: boolean;
  canProceed: boolean;
  showFeedback: boolean;
  playerHealth: number;
  enemyHealth: number;
  enemyMaxHealth: number;
  playerMaxHealth: number;
}
