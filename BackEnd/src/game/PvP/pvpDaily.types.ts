export type MatchmakingStatus = "idle" | "finding_match" | "already_matched";

export interface DailyPvpQuestion {
  challenge_id: number;
  level_id: number;
  level_number: number | null;
  map_name: string;
  level_title: string | null;
  challenge_type: string;
  title: string;
  description: string;
  question: string | null;
  options: string[];
  correct_answer: string[];
}

export interface PvPDailyPlayerSnapshot {
  player_id: number;
  player_name: string;
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
}

export interface PvPMatchState {
  match_id: string;
  created_at: string;
  started_at: string;
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
}

export interface PlayerMatchmakingState {
  status: MatchmakingStatus;
  match_id: string | null;
  updated_at: string;
}

export interface PvpDailyPreviewResponse {
  daily_seed: string;
  preview_task: {
    title: string;
    description: string;
    topics_covered: string[];
    question_count: number;
    difficulty: "hard";
    boss_level_expected_output: Array<{
      level_id: number;
      level_number: number | null;
      map_name: string;
      boss_level_expected_output: unknown;
    }>;
  };
  status: PlayerMatchmakingState;
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

export interface PvpDailySubmitAnswerResult {
  is_correct: boolean;
  accepted_for_attack: boolean;
  reason:
    | "correct_and_first"
    | "correct_but_late"
    | "incorrect"
    | "round_already_resolved";
  match: PvPMatchState;
}
