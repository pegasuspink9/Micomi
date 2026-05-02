export type MatchmakingStatus = "idle" | "finding_match" | "already_matched";
export type PvpChallengeTopic = "HTML" | "CSS" | "JavaScript" | "Computer";

export interface DailyPvpQuestion {
  challenge_id: number;
  topic: PvpChallengeTopic;
  level_id: number;
  level_number: number | null;
  map_name: string;
  level_title: string | null;
  challenge_type: string;
  question: string | null;
  options: string[];
  correct_answer: string[];
  html_file: string | null;
  css_file: string | null;
}

export interface PvPDailyPlayerSnapshot {
  player_id: number;
  player_name: string;
  player_username: string;
  player_avatar: string | null;
  player_rank_name: string;
  level: number;
  character_id: number;
  character_name: string;
  character_avatar: string | null;
  character_health: number;
  character_max_health: number;
  attack_damage: number;
}

export interface PvPQuestionRoundState {
  challenge_id: number;
  resolved_by_player_id: number | null;
  resolved_at: string | null;
  first_submission_by_player_id: number | null;
  first_submission_at: string | null;
  attempts_by_player: Record<number, number>;
}

export interface PvPCompletionRewards {
  coins: number;
  points: number;
  exp: number;
  potion: {
    potion_type: string;
    quantity: number;
  } | null;
}

export interface PvPPlayerRankSnapshot {
  player_id: number;
  delta: number;
  before_points: number;
  player_rank_name: string;
  player_rank_image: string;
  player_rank_points: number;
  rank_legacy_name: string;
  rank_progress_current: number;
  rank_progress_required: number;
  next_rank_name: string | null;
  next_rank_image: string | null;
}

export interface PvPCompletionStats {
  winner_player_id: number;
  loser_player_id: number;
  winner_name: string;
  loser_name: string;
  winner_mistakes: number;
  loser_mistakes: number;
  total_questions: number;
  resolved_questions: number;
  reason: "all_questions_resolved" | "knockout";
  message_for_winner: string;
  message_for_loser: string;
  winner_rank: PvPPlayerRankSnapshot;
  loser_rank: PvPPlayerRankSnapshot;
}

export interface PvpInGameMessageEntry {
  id: number;
  text: string;
}

export interface PvPMatchState {
  match_id: string;
  topic: PvpChallengeTopic;
  created_at: string;
  started_at: string;
  current_round_started_at: string;
  status: "active" | "completed";
  players: [PvPDailyPlayerSnapshot, PvPDailyPlayerSnapshot];
  questions: DailyPvpQuestion[];
  rounds: PvPQuestionRoundState[];
  current_round_index: number;
  mistakes_by_player: Record<number, number>;
  winner_player_id: number | null;
  completion_reason: "all_questions_resolved" | "knockout" | null;
  finisher_bonus_coins_by_player: Record<number, number>;
  rewards_by_player: Record<number, PvPCompletionRewards>;
  completion_stats: PvPCompletionStats | null;
  last_attack_by_player_id: number | null;
  last_attack_type: string | null;
  last_attack_damage: number;
  pending_wrong_challenge_by_player: Record<number, number | null>;
  consecutive_corrects_by_player: Record<number, number>;
  has_freeze_effect_by_player: Record<number, boolean>;
  has_strong_effect_by_player: Record<number, boolean>;
  has_ryron_reveal_by_player: Record<number, boolean>;
  message_sequence: number;
  messages_by_player: Record<number, PvpInGameMessageEntry | null>;
}

export interface PlayerMatchmakingState {
  status: MatchmakingStatus;
  selected_topic: PvpChallengeTopic | null;
  match_id: string | null;
  updated_at: string;
}

export interface PvpDailyPreviewResponse {
  daily_seed: string;
  preview_task: {
    title: string;
    description: string;
    topics_covered: PvpChallengeTopic[];
  };
  status: PlayerMatchmakingState;
}

export interface PvpMatchEntryLikeResponse {
  is_syncing: boolean;
  level: {
    level_id: number;
    level_number: number | null;
    level_type: string;
    level_difficulty: string;
    level_title: string | null;
    content: string;
  };
  enemy: Record<string, unknown>;
  character: Record<string, unknown>;
  card: {
    card_type: string | null;
    character_attack_card: string | null;
    character_damage_card: number | null;
  };
  currentChallenge: Record<string, unknown> | null;
  energy: number;
  timeToNextEnergyRestore: string | null;
  correct_answer_length: number;
  combat_background: string[];
  question_type: string;
  versus_background: string;
  versus_audio: string;
  timer: string;
  gameplay_theme_color: string | null;
  gameplay_audio: string;
  is_correct_audio: string | null;
  enemy_attack_audio: string | null;
  enemy_idle_audio: string | null;
  character_attack_audio: string | null;
  character_idle_audio: string | null;
  character_hurt_audio: string | null;
  enemy_hurt_audio: string | null;
  death_audio: string | null;
  is_victory_audio: string | null;
  is_victory_image: string | null;
  boss_skill_activated: boolean;
  isEnemyFrozen: boolean;
  isCharacterFrozen: boolean;
  message: string;
  audio: string[];
}

export interface PvpDailyStatusResponse {
  status: PlayerMatchmakingState;
  match_found: boolean;
  match_id: string | null;
}

export interface PvpDailyPlayResponse {
  status: PlayerMatchmakingState;
  match_found: boolean;
  match_id: string | null;
}

export interface PvpDailyInGameMessageResponse {
  match_id: string;
  character_reaction: string | null;
  enemy_reaction: string | null;
}

export interface PvpDailySubmitAnswerResult {
  is_syncing: boolean;
  is_correct: boolean;
  accepted_for_attack: boolean;
  reason:
    | "correct_and_first"
    | "correct_but_late"
    | "incorrect"
    | "round_already_resolved"
    | "ongoing";
  isCorrect?: boolean;
  attempts?: number;
  fightResult?: Record<string, unknown> | null;
  message?: string;
  nextChallenge?: Record<string, unknown> | null;
  audio?: string[];
  completionRewards?: {
    feedbackMessage?: string | null;
    totalPointsEarned?: number;
    totalExpPointsEarned?: number;
    coinsEarned?: number;
    isVictory?: boolean;
    stars?: number;
    playerOutputs?: string[] | null;
    rankProgress?: PvPPlayerRankSnapshot;
  };
  level?: {
    level_id: number;
    level_number: number | null;
    level_type: string;
    level_difficulty: string;
    level_title: string | null;
    content: string;
  };
  levelStatus?: {
    isCompleted: boolean;
    showFeedback: boolean;
    playerHealth?: number;
    playerMaxHealth?: number;
    enemyHealth?: number;
    enemyMaxHealth?: number;
    coinsEarned?: number;
    totalPointsEarned?: number;
    totalExpPointsEarned?: number;
    playerOutputs?: string[];
  };
  nextLevel?: null;
  energy?: number;
  timeToNextEnergyRestore?: string | null;
  correct_answer_length?: number;
  combat_background?: string[];
  question_type?: string;
  is_bonus_round?: boolean;
  card?: {
    card_type: string | null;
    character_attack_card: string | null;
    character_damage_card: number | null;
  };
  timer?: string | null;
  gameplay_theme_color: string | null;
  gameplay_audio?: string;
  is_correct_audio?: string | null;
  enemy_attack_audio?: string | null;
  enemy_idle_audio?: string | null;
  character_attack_audio?: string | null;
  character_idle_audio?: string | null;
  character_hurt_audio?: string | null;
  enemy_hurt_audio?: string | null;
  death_audio?: string | null;
  is_victory_audio?: string | null;
  is_victory_image?: string | null;
  isEnemyFrozen?: boolean;
  isCharacterFrozen?: boolean;
}

export interface PvpMatchHistoryCharacter {
  player_id: number;
  player_name: string;
  player_avatar: string;
  player_rank_name: string;
  player_rank_image: string;
  character_name: string;
  character_avatar: string | null;
  coins: number;
  points: number;
  exp_points: number;
}

export interface PvpMatchHistoryEnemy {
  player_id: number;
  player_name: string;
  player_avatar: string;
  player_rank_name: string;
  player_rank_image: string;
  enemy_name: string;
  enemy_avatar: string | null;
  coins: number;
  points: number;
  exp_points: number;
}

export interface PvpMatchHistoryEntry {
  match_id: string;
  match_status: string;
  date: string;
  character: PvpMatchHistoryCharacter;
  enemy: PvpMatchHistoryEnemy | null;
}
