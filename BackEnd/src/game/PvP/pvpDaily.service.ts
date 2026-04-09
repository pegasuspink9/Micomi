import { PrismaClient, PotionType } from "@prisma/client";
import {
  DailyPvpQuestion,
  MatchmakingStatus,
  PlayerMatchmakingState,
  PvPCompletionRewards,
  PvPCompletionStats,
  PvPDailyPlayerSnapshot,
  PvPMatchState,
  PvPQuestionRoundState,
  PvpDailyPlayResponse,
  PvpDailyPreviewResponse,
  PvpDailyStatusResponse,
  PvpDailySubmitAnswerResult,
} from "./pvpDaily.types";
import { getSocketServer } from "../../socket";

const prisma = new PrismaClient();

const DEFAULT_QUESTION_COUNT = 7;
const MATCHMAKING_TIMEOUT_MS = 2 * 60 * 1000;
const DEFAULT_FALLBACK_ATTACK_DAMAGE = 12;
const WIN_REWARD: PvPCompletionRewards = {
  coins: 60,
  points: 120,
  exp: 90,
  potion: { potion_type: PotionType.Power, quantity: 1 },
};
const LOSS_REWARD: PvPCompletionRewards = {
  coins: 20,
  points: 40,
  exp: 25,
  potion: null,
};

const matchmakingByPlayer = new Map<number, PlayerMatchmakingState>();
const queue = new Set<number>();
const matches = new Map<string, PvPMatchState>();
const dailyPreviewViewedByPlayer = new Map<number, string>();

const getNowIso = () => new Date().toISOString();

const emitToPlayer = (
  playerId: number,
  event: string,
  payload: Record<string, unknown>,
) => {
  const io = getSocketServer();
  if (!io) return;
  io.to(playerId.toString()).emit(event, payload);
};

const getDailySeed = () => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const deterministicHash = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};

const getOrCreatePlayerState = (playerId: number): PlayerMatchmakingState => {
  const existing = matchmakingByPlayer.get(playerId);
  if (existing) return existing;

  const state: PlayerMatchmakingState = {
    status: "idle",
    match_id: null,
    updated_at: getNowIso(),
  };
  matchmakingByPlayer.set(playerId, state);
  return state;
};

const clearPlayerFromQueue = (playerId: number) => {
  queue.delete(playerId);
};

const resetPlayerToIdle = (playerId: number) => {
  clearPlayerFromQueue(playerId);
  setPlayerState(playerId, "idle", null);
};

const setPlayerState = (
  playerId: number,
  status: MatchmakingStatus,
  matchId: string | null,
) => {
  const state = {
    status,
    match_id: matchId,
    updated_at: getNowIso(),
  };
  matchmakingByPlayer.set(playerId, state);

  emitToPlayer(playerId, "pvp:matchmaking-status", {
    status: state,
    match_found: status === "already_matched" && !!matchId,
    match_id: matchId,
  });
};

const reconcileMatchedState = (playerId: number) => {
  const state = matchmakingByPlayer.get(playerId);
  if (!state || state.status !== "already_matched" || !state.match_id) return;

  const match = matches.get(state.match_id);
  if (!match || match.status === "completed") {
    resetPlayerToIdle(playerId);
  }
};

const resetToIdleIfTimedOut = (playerId: number) => {
  const state = matchmakingByPlayer.get(playerId);
  if (!state) return;
  if (state.status !== "finding_match") return;

  const updatedAt = new Date(state.updated_at).getTime();
  const now = Date.now();
  if (Number.isFinite(updatedAt) && now - updatedAt > MATCHMAKING_TIMEOUT_MS) {
    queue.delete(playerId);
    setPlayerState(playerId, "idle", null);
  }
};

const randomInt = (maxExclusive: number) => {
  if (maxExclusive <= 1) return 0;
  return Math.floor(Math.random() * maxExclusive);
};

const pickRandomPair = (): [number, number] | null => {
  const candidates = Array.from(queue.values());
  if (candidates.length < 2) return null;

  const firstIdx = randomInt(candidates.length);
  const first = candidates[firstIdx];
  candidates.splice(firstIdx, 1);
  const second = candidates[randomInt(candidates.length)];

  if (typeof second !== "number") return null;
  return [first, second];
};

const getFirstValidNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (Array.isArray(value)) {
    for (const entry of value) {
      if (typeof entry === "number" && Number.isFinite(entry)) return entry;
    }
  }
  return null;
};

const normalizeToStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => String(entry));
};

const buildSpreadIndices = (total: number, targetCount: number): number[] => {
  if (total <= 0 || targetCount <= 0) return [];
  if (targetCount >= total) return Array.from({ length: total }, (_, i) => i);

  const chosen = new Set<number>();

  // Always include earliest and latest challenge to cover progression edges.
  chosen.add(0);
  chosen.add(total - 1);

  if (targetCount === 1) return [0];

  const spacingCount = targetCount - chosen.size;
  for (let i = 1; i <= spacingCount; i++) {
    const pos = Math.round((i * (total - 1)) / (spacingCount + 1));
    chosen.add(Math.max(0, Math.min(total - 1, pos)));
  }

  return Array.from(chosen.values())
    .sort((a, b) => a - b)
    .slice(0, targetCount);
};

const buildQuestionPool = async (): Promise<DailyPvpQuestion[]> => {
  const dailySeed = getDailySeed();
  const challenges = await prisma.challenge.findMany({
    where: {
      level: {
        level_difficulty: "hard",
      },
    },
    include: {
      level: {
        include: {
          map: true,
        },
      },
    },
  });

  const sorted = challenges.slice().sort((a, b) => {
    const levelDiff =
      Number(a.level.level_number ?? 0) - Number(b.level.level_number ?? 0);
    if (levelDiff !== 0) return levelDiff;
    return a.challenge_id - b.challenge_id;
  });

  if (sorted.length === 0) {
    return [];
  }

  const questionCount = Math.min(DEFAULT_QUESTION_COUNT, sorted.length);
  const baseIndices = buildSpreadIndices(sorted.length, questionCount);

  // Rotate spread positions daily so the same progression coverage still feels fresh.
  const rotation = deterministicHash(dailySeed) % baseIndices.length;
  const rotatedIndices = baseIndices
    .slice(rotation)
    .concat(baseIndices.slice(0, rotation));

  const questions: DailyPvpQuestion[] = [];

  for (const idx of rotatedIndices) {
    const current = sorted[idx];
    const correctAnswer = normalizeToStringArray(
      current.correct_answer as unknown,
    );
    const options = normalizeToStringArray(current.options as unknown);

    questions.push({
      challenge_id: current.challenge_id,
      level_id: current.level_id,
      level_number: current.level.level_number,
      map_name: current.level.map.map_name,
      level_title: current.level.level_title,
      challenge_type: current.challenge_type,
      title: current.title,
      description: current.description,
      question: current.question,
      options,
      correct_answer: correctAnswer,
    });
  }

  return questions;
};

const getAllHardTopics = async (): Promise<string[]> => {
  const levels = await prisma.level.findMany({
    where: { level_difficulty: "hard" },
    include: { map: true },
  });

  return Array.from(new Set(levels.map((level) => level.map.map_name))).sort();
};

const getPreviewBossExpectedOutput = async (questions: DailyPvpQuestion[]) => {
  const uniqueLevelIds = Array.from(new Set(questions.map((q) => q.level_id)));
  if (uniqueLevelIds.length === 0) return [];

  const levels = await prisma.level.findMany({
    where: { level_id: { in: uniqueLevelIds } },
    include: { map: true },
  });

  return levels
    .sort((a, b) => Number(a.level_number ?? 0) - Number(b.level_number ?? 0))
    .map((level) => ({
      level_id: level.level_id,
      level_number: level.level_number,
      map_name: level.map.map_name,
      boss_level_expected_output: level.boss_level_expected_output,
    }));
};

const getSelectedCharacterSnapshot = async (
  playerId: number,
): Promise<PvPDailyPlayerSnapshot> => {
  const player = await prisma.player.findUnique({
    where: { player_id: playerId },
    include: {
      ownedCharacters: {
        where: { is_selected: true, is_purchased: true },
        include: { character: true },
        take: 1,
      },
    },
  });

  if (!player) {
    throw new Error("Player not found");
  }

  const selected = player.ownedCharacters[0]?.character;
  if (!selected) {
    throw new Error("No selected character found");
  }

  const damage = getFirstValidNumber(selected.character_damage as unknown);

  return {
    player_id: player.player_id,
    player_name: player.player_name,
    level: player.level,
    character_id: selected.character_id,
    character_name: selected.character_name,
    character_avatar: selected.character_avatar,
    character_health: selected.health,
    character_max_health: selected.health,
    attack_damage: damage ?? DEFAULT_FALLBACK_ATTACK_DAMAGE,
  };
};

const createRounds = (
  questions: DailyPvpQuestion[],
): PvPQuestionRoundState[] => {
  return questions.map((q) => ({
    challenge_id: q.challenge_id,
    resolved_by_player_id: null,
    resolved_at: null,
    first_submission_by_player_id: null,
    first_submission_at: null,
    attempts_by_player: {},
  }));
};

const cloneMatchForResponse = (match: PvPMatchState): PvPMatchState => {
  return {
    ...match,
    players: [{ ...match.players[0] }, { ...match.players[1] }],
    questions: match.questions.map((q) => ({
      ...q,
      options: [...q.options],
      correct_answer: [...q.correct_answer],
    })),
    rounds: match.rounds.map((r) => ({
      ...r,
      attempts_by_player: { ...r.attempts_by_player },
    })),
    mistakes_by_player: { ...match.mistakes_by_player },
    finisher_bonus_coins_by_player: { ...match.finisher_bonus_coins_by_player },
    rewards_by_player: {
      ...match.rewards_by_player,
    },
    completion_stats: match.completion_stats
      ? { ...match.completion_stats }
      : null,
  };
};

const buildPublicMatchPayload = (match: PvPMatchState) => {
  const snapshot = cloneMatchForResponse(match);
  const current = getRoundQuestion(snapshot);

  return {
    ...snapshot,
    current_question: current ? publicQuestion(current) : null,
  };
};

const emitMatchStateToPlayers = (
  match: PvPMatchState,
  event: "pvp:match-found" | "pvp:match-update" | "pvp:match-completed",
) => {
  const payload = buildPublicMatchPayload(match);
  for (const player of match.players) {
    emitToPlayer(player.player_id, event, payload as Record<string, unknown>);
  }
};

const getRoundQuestion = (match: PvPMatchState): DailyPvpQuestion | null => {
  if (match.current_round_index < 0) return null;
  if (match.current_round_index >= match.questions.length) return null;
  return match.questions[match.current_round_index];
};

const getPlayerIndex = (match: PvPMatchState, playerId: number): number => {
  return match.players.findIndex((p) => p.player_id === playerId);
};

const getOpponentIndex = (index: number): number => (index === 0 ? 1 : 0);

const getAlivePlayerIds = (match: PvPMatchState): number[] => {
  return match.players
    .filter((p) => p.character_health > 0)
    .map((p) => p.player_id);
};

const applyRewards = async (playerId: number, reward: PvPCompletionRewards) => {
  await prisma.player.update({
    where: { player_id: playerId },
    data: {
      coins: { increment: reward.coins },
      total_points: { increment: reward.points },
      exp_points: { increment: reward.exp },
    },
  });

  if (reward.potion) {
    const potion = await prisma.potionShop.findUnique({
      where: { potion_type: reward.potion.potion_type as PotionType },
      select: { potion_shop_id: true },
    });

    if (potion) {
      await prisma.playerPotion.upsert({
        where: {
          player_id_potion_shop_id: {
            player_id: playerId,
            potion_shop_id: potion.potion_shop_id,
          },
        },
        update: {
          quantity: { increment: reward.potion.quantity },
        },
        create: {
          player_id: playerId,
          potion_shop_id: potion.potion_shop_id,
          quantity: reward.potion.quantity,
        },
      });
    }
  }
};

const completeMatch = async (
  match: PvPMatchState,
  winnerPlayerId: number,
  reason: "all_questions_resolved" | "knockout",
) => {
  const loserPlayerId = match.players.find(
    (p) => p.player_id !== winnerPlayerId,
  )?.player_id;
  if (!loserPlayerId) {
    throw new Error("Could not find losing player");
  }

  match.status = "completed";
  match.winner_player_id = winnerPlayerId;
  match.completion_reason = reason;

  const winner = match.players.find((p) => p.player_id === winnerPlayerId)!;
  const loser = match.players.find((p) => p.player_id === loserPlayerId)!;

  const winnerReward: PvPCompletionRewards = {
    ...WIN_REWARD,
    coins:
      WIN_REWARD.coins +
      (match.finisher_bonus_coins_by_player[winnerPlayerId] ?? 0),
  };
  const loserReward: PvPCompletionRewards = { ...LOSS_REWARD };

  match.rewards_by_player[winnerPlayerId] = winnerReward;
  match.rewards_by_player[loserPlayerId] = loserReward;

  await Promise.all([
    applyRewards(winnerPlayerId, winnerReward),
    applyRewards(loserPlayerId, loserReward),
  ]);

  const resolvedQuestions = match.rounds.filter(
    (r) => r.resolved_by_player_id !== null,
  ).length;

  const stats: PvPCompletionStats = {
    winner_player_id: winnerPlayerId,
    loser_player_id: loserPlayerId,
    winner_name: winner.player_name,
    loser_name: loser.player_name,
    winner_mistakes: match.mistakes_by_player[winnerPlayerId] ?? 0,
    loser_mistakes: match.mistakes_by_player[loserPlayerId] ?? 0,
    total_questions: match.questions.length,
    resolved_questions: resolvedQuestions,
    reason,
    message_for_winner: `You finished ${loser.player_name} with ${match.mistakes_by_player[winnerPlayerId] ?? 0} mistakes.`,
    message_for_loser: `${winner.player_name} defeated you with ${match.mistakes_by_player[winnerPlayerId] ?? 0} mistakes.`,
  };

  match.completion_stats = stats;
  emitMatchStateToPlayers(match, "pvp:match-completed");

  resetPlayerToIdle(winnerPlayerId);
  resetPlayerToIdle(loserPlayerId);
};

const maybeProgressRoundOrFinish = async (match: PvPMatchState) => {
  const alive = getAlivePlayerIds(match);
  if (alive.length === 1) {
    const winnerPlayerId = alive[0];

    if (match.current_round_index < match.questions.length - 1) {
      // Finisher bonus even when there are still questions left.
      match.finisher_bonus_coins_by_player[winnerPlayerId] =
        (match.finisher_bonus_coins_by_player[winnerPlayerId] ?? 0) + 15;
    }

    await completeMatch(match, winnerPlayerId, "knockout");
    return;
  }

  if (alive.length === 0) {
    // Rare tie by simultaneous zero HP, winner defaults to fewer mistakes.
    const p1 = match.players[0].player_id;
    const p2 = match.players[1].player_id;
    const p1Mistakes = match.mistakes_by_player[p1] ?? 0;
    const p2Mistakes = match.mistakes_by_player[p2] ?? 0;
    const winner = p1Mistakes <= p2Mistakes ? p1 : p2;
    await completeMatch(match, winner, "knockout");
    return;
  }

  if (match.current_round_index >= match.questions.length - 1) {
    const p1 = match.players[0].player_id;
    const p2 = match.players[1].player_id;
    const p1Hp = match.players[0].character_health;
    const p2Hp = match.players[1].character_health;

    let winnerPlayerId: number;
    if (p1Hp === p2Hp) {
      const p1Mistakes = match.mistakes_by_player[p1] ?? 0;
      const p2Mistakes = match.mistakes_by_player[p2] ?? 0;
      winnerPlayerId = p1Mistakes <= p2Mistakes ? p1 : p2;
    } else {
      winnerPlayerId = p1Hp > p2Hp ? p1 : p2;
    }

    await completeMatch(match, winnerPlayerId, "all_questions_resolved");
    return;
  }

  match.current_round_index += 1;
};

const tryCreatePair = async (): Promise<string | null> => {
  const pair = pickRandomPair();
  if (!pair) return null;

  const [playerA, playerB] = pair;
  clearPlayerFromQueue(playerA);
  clearPlayerFromQueue(playerB);

  const [snapshotAResult, snapshotBResult, questions] =
    await Promise.allSettled([
      getSelectedCharacterSnapshot(playerA),
      getSelectedCharacterSnapshot(playerB),
      buildQuestionPool(),
    ]);

  if (
    snapshotAResult.status !== "fulfilled" ||
    snapshotBResult.status !== "fulfilled"
  ) {
    if (snapshotAResult.status !== "fulfilled") {
      resetPlayerToIdle(playerA);
    } else {
      setPlayerState(playerA, "finding_match", null);
      queue.add(playerA);
    }

    if (snapshotBResult.status !== "fulfilled") {
      resetPlayerToIdle(playerB);
    } else {
      setPlayerState(playerB, "finding_match", null);
      queue.add(playerB);
    }

    return null;
  }

  if (questions.status !== "fulfilled") {
    setPlayerState(playerA, "finding_match", null);
    setPlayerState(playerB, "finding_match", null);
    queue.add(playerA);
    queue.add(playerB);
    return null;
  }

  const snapshotA = snapshotAResult.value;
  const snapshotB = snapshotBResult.value;
  const questionPool = questions.value;

  if (questionPool.length === 0) {
    resetPlayerToIdle(playerA);
    resetPlayerToIdle(playerB);
    throw new Error("No hard daily challenges are available for PvP");
  }

  const now = getNowIso();
  const matchId = `pvp-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

  const match: PvPMatchState = {
    match_id: matchId,
    created_at: now,
    started_at: now,
    status: "active",
    players: [snapshotA, snapshotB],
    questions: questionPool,
    rounds: createRounds(questionPool),
    current_round_index: 0,
    mistakes_by_player: {
      [playerA]: 0,
      [playerB]: 0,
    },
    winner_player_id: null,
    completion_reason: null,
    finisher_bonus_coins_by_player: {
      [playerA]: 0,
      [playerB]: 0,
    },
    rewards_by_player: {},
    completion_stats: null,
  };

  matches.set(matchId, match);
  setPlayerState(playerA, "already_matched", matchId);
  setPlayerState(playerB, "already_matched", matchId);
  emitMatchStateToPlayers(match, "pvp:match-found");

  return matchId;
};

const pairWaitingPlayers = async () => {
  let guard = queue.size + 2;
  while (queue.size >= 2 && guard > 0) {
    await tryCreatePair();
    guard -= 1;
  }
};

const publicQuestion = (question: DailyPvpQuestion) => {
  return {
    challenge_id: question.challenge_id,
    level_id: question.level_id,
    level_number: question.level_number,
    map_name: question.map_name,
    level_title: question.level_title,
    challenge_type: question.challenge_type,
    title: question.title,
    description: question.description,
    question: question.question,
    options: question.options,
  };
};

export const getDailyPreview = async (
  playerId: number,
): Promise<PvpDailyPreviewResponse> => {
  const questions = await buildQuestionPool();
  const topics = await getAllHardTopics();
  const bossExpectedOutput = await getPreviewBossExpectedOutput(questions);
  const todaySeed = getDailySeed();
  dailyPreviewViewedByPlayer.set(playerId, todaySeed);

  reconcileMatchedState(playerId);
  const state = getOrCreatePlayerState(playerId);

  return {
    daily_seed: getDailySeed(),
    preview_task: {
      title: "Daily PvP Boss Challenge",
      description:
        "Race another player to solve hard boss-level questions spanning all unlocked game topics.",
      topics_covered: topics,
      question_count: questions.length,
      difficulty: "hard",
      boss_level_expected_output: bossExpectedOutput,
    },
    status: state,
  };
};

export const enterFindingMatch = async (
  playerId: number,
): Promise<PvpDailyPlayResponse> => {
  resetToIdleIfTimedOut(playerId);
  reconcileMatchedState(playerId);

  const todaySeed = getDailySeed();
  const previewSeed = dailyPreviewViewedByPlayer.get(playerId);
  if (previewSeed !== todaySeed) {
    throw new Error(
      "Preview the daily PvP challenge first before clicking play.",
    );
  }

  const state = getOrCreatePlayerState(playerId);

  if (state.status === "already_matched" && state.match_id) {
    return {
      status: state,
      match_found: true,
      match_id: state.match_id,
    };
  }

  setPlayerState(playerId, "finding_match", null);
  queue.add(playerId);

  await pairWaitingPlayers();

  const latest = getOrCreatePlayerState(playerId);
  return {
    status: latest,
    match_found: latest.status === "already_matched" && !!latest.match_id,
    match_id: latest.match_id,
  };
};

export const getMatchmakingStatus = async (
  playerId: number,
): Promise<PvpDailyStatusResponse> => {
  resetToIdleIfTimedOut(playerId);
  reconcileMatchedState(playerId);

  let state = getOrCreatePlayerState(playerId);

  if (state.status === "finding_match" && queue.size >= 2) {
    await pairWaitingPlayers();
    state = getOrCreatePlayerState(playerId);
  }

  return {
    status: state,
    match_found: state.status === "already_matched" && !!state.match_id,
    match_id: state.match_id,
  };
};

export const getMatchState = async (playerId: number, matchId: string) => {
  reconcileMatchedState(playerId);

  const match = matches.get(matchId);
  if (!match) {
    throw new Error("Match not found");
  }

  if (getPlayerIndex(match, playerId) === -1) {
    throw new Error("You are not part of this match");
  }

  const current = getRoundQuestion(match);

  return {
    ...cloneMatchForResponse(match),
    current_question: current ? publicQuestion(current) : null,
  };
};

export const submitAnswer = async (
  playerId: number,
  matchId: string,
  answer: string[],
): Promise<PvpDailySubmitAnswerResult> => {
  const match = matches.get(matchId);
  if (!match) {
    throw new Error("Match not found");
  }

  if (match.status === "completed") {
    return {
      is_correct: false,
      accepted_for_attack: false,
      reason: "round_already_resolved",
      match: cloneMatchForResponse(match),
    };
  }

  const playerIndex = getPlayerIndex(match, playerId);
  if (playerIndex === -1) {
    throw new Error("You are not part of this match");
  }

  const round = match.rounds[match.current_round_index];
  const question = getRoundQuestion(match);

  if (!question || !round) {
    throw new Error("Current round is invalid");
  }

  const now = getNowIso();

  if (!round.first_submission_by_player_id) {
    round.first_submission_by_player_id = playerId;
    round.first_submission_at = now;
  }

  round.attempts_by_player[playerId] =
    (round.attempts_by_player[playerId] ?? 0) + 1;

  if (round.resolved_by_player_id) {
    return {
      is_correct: false,
      accepted_for_attack: false,
      reason: "round_already_resolved",
      match: cloneMatchForResponse(match),
    };
  }

  const normalizedGiven = answer.map((item) => item.trim());
  const normalizedCorrect = question.correct_answer.map((item) => item.trim());
  const isCorrect =
    normalizedGiven.length === normalizedCorrect.length &&
    normalizedGiven.every((value, index) => value === normalizedCorrect[index]);

  if (!isCorrect) {
    match.mistakes_by_player[playerId] =
      (match.mistakes_by_player[playerId] ?? 0) + 1;

    emitMatchStateToPlayers(match, "pvp:match-update");

    return {
      is_correct: false,
      accepted_for_attack: false,
      reason: "incorrect",
      match: cloneMatchForResponse(match),
    };
  }

  const isFirstCorrect = round.resolved_by_player_id === null;

  if (isFirstCorrect) {
    round.resolved_by_player_id = playerId;
    round.resolved_at = now;

    const opponentIndex = getOpponentIndex(playerIndex);
    const attacker = match.players[playerIndex];
    const opponent = match.players[opponentIndex];

    opponent.character_health = Math.max(
      0,
      opponent.character_health - attacker.attack_damage,
    );

    await maybeProgressRoundOrFinish(match);

    if (match.status === "active") {
      emitMatchStateToPlayers(match, "pvp:match-update");
    }

    return {
      is_correct: true,
      accepted_for_attack: true,
      reason: "correct_and_first",
      match: cloneMatchForResponse(match),
    };
  }

  return {
    is_correct: true,
    accepted_for_attack: false,
    reason: "correct_but_late",
    match: cloneMatchForResponse(match),
  };
};

export const cancelMatchmaking = async (
  playerId: number,
): Promise<PvpDailyStatusResponse> => {
  resetPlayerToIdle(playerId);
  const state = getOrCreatePlayerState(playerId);

  return {
    status: state,
    match_found: false,
    match_id: null,
  };
};
