export interface FightResult {
  status: string;
  enemy: {
    enemy_id: number;
    enemy_name: string;
    enemy_idle: string | null;
    enemy_run: string | null;
    enemy_attack: string | null;
    enemy_hurt: string | null;
    enemy_dies: string | null;
    enemy_damage: number;
    enemy_health: number;
    enemy_max_health: number;
    enemy_avatar?: string | null;
    enemy_attack_type?: string | null;
    enemy_special_skill?: string | null;
  };
  character: {
    character_id: number;
    character_name: string;
    character_idle: string | null;
    character_run: string | null;
    character_attack_type: string | null;
    character_attack: string | null;
    character_hurt: string | null;
    character_dies: string | null;
    character_damage: number | null;
    character_health: number;
    character_max_health: number;
    character_avatar?: string | null;
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
  character_attack_image?: string | null;
  combat_background?: string[] | null;
  is_bonus_round?: boolean;
  question_type: string;
  card: {
    card_type: string | null;
    character_attack_card: string | null;
  };
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
