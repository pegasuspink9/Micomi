export interface FightResult {
  status: string;
  enemy: {
    enemy_id: number;
    enemy_name: string;
    enemy_idle: string | null;
    enemy_run: null;
    enemy_attack: null;
    enemy_hurt: string | null;
    enemy_dies: null;
    enemy_damage: number;
    enemy_health: number;
    enemy_max_health: number;
    enemy_attack_type?: string | null;
    enemy_special_skill?: string | null;
    enemy_avatar?: string | null;
  };
  character: {
    character_id: number;
    character_name: string;
    character_idle: string | null;
    character_run: null;
    character_attack_type: null;
    character_attack: null;
    character_hurt: null;
    character_dies: null;
    character_damage: number | number[] | null;
    character_health: number;
    character_max_health: number;
    character_avatar?: string | null;
    character_is_range?: boolean;
    character_attack_pose?: string | null;
  };
  timer: string;
  energy: number;
  timeToNextEnergyRestore: string | null;
}

export interface SubmitChallengeServiceResult {
  isCorrect: boolean;
  attempts: number;
  fightResult: FightResult | null;
  message: string;
  audio: string[];
  use_potion_audio?: string;
  nextChallenge: unknown | null;
}

export interface CompletionRewards {
  feedbackMessage?: string | null;
  totalPointsEarned?: number;
  totalExpPointsEarned?: number;
  coinsEarned?: number;
  playerOutputs?: string[] | null;
}

export interface SubmitChallengeControllerResult
  extends SubmitChallengeServiceResult {
  levelStatus?: LevelStatus;
  completionRewards?: CompletionRewards;
  nextLevel?: {
    level_id: number;
    level_number: number;
    is_unlocked: boolean;
  } | null;
  correct_answer_length?: number;
  potionType?: string;
  remainingQuantity?: number;
  appliedImmediately?: boolean;
  energy?: number;
  timeToNextEnergyRestore?: string | null;
}

export interface LevelStatus {
  isCompleted: boolean;
  showFeedback: boolean;
  playerHealth?: number;
  enemyHealth?: number;
  coinsEarned?: number;
  totalPointsEarned?: number;
  totalExpPointsEarned?: number;
  playerOutputs?: string[] | null;
}

export interface UsePotionErrorResponse {
  message: string;
  success: false;
}
