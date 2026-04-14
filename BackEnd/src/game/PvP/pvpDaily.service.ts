import { Prisma, PrismaClient, PotionType } from "@prisma/client";
import {
  DailyPvpQuestion,
  MatchmakingStatus,
  PlayerMatchmakingState,
  PvpChallengeTopic,
  PvPCompletionRewards,
  PvPCompletionStats,
  PvPDailyPlayerSnapshot,
  PvPMatchState,
  PvPQuestionRoundState,
  PvpDailyPlayResponse,
  PvpMatchEntryLikeResponse,
  PvpDailyPreviewResponse,
  PvpDailyStatusResponse,
  PvpDailySubmitAnswerResult,
} from "./pvpDaily.types";
import { getSocketServer } from "../../socket";
import { getBackgroundForLevel } from "../../../helper/combatBackgroundHelper";
import {
  CORRECT_ANSWER_AUDIO,
  getHeroAttackAudio,
  getHeroHurtAudio,
  getHeroSpecialSkillAssets,
  getMapMediaAssets,
} from "../../../helper/gameplayAssetsHelper";
import { getCardForAttackType } from "../Combat/combat.service";
import { CHALLENGE_TIME_LIMIT } from "../../../helper/timeSetter";
import { formatTimer } from "../../../helper/dateTimeHelper";
import * as EnergyService from "../Energy/energy.service";
import { generateMotivationalMessage } from "../Challenges/challenges.service";
import { generatePvpChallengeWithGemini } from "./pvpChallengeGenerator.service";

const prisma = new PrismaClient();

const MATCHMAKING_TIMEOUT_MS = 2 * 60 * 1000;
const MATCH_COMPLETION_CLEANUP_MS = 90 * 1000;
const SUBMIT_ANSWER_COOLDOWN_MS = 5 * 1000;
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

const PVP_TOPICS: PvpChallengeTopic[] = [
  "HTML",
  "CSS",
  "JavaScript",
  "Computer",
];
const QUESTIONS_PER_MATCH = 5;
const MATCH_DIFFICULTY = "Easy";
const PVP_POOL_TARGET_ACTIVE = 20;
const PVP_BACKGROUND_GENERATE_BATCH = 5;
const PVP_BACKGROUND_GENERATE_TICK_MS = 15 * 1000;

const matchmakingByPlayer = new Map<number, PlayerMatchmakingState>();
const queueByTopic = new Map<PvpChallengeTopic, Set<number>>();
const playerTopicById = new Map<number, PvpChallengeTopic>();
const matches = new Map<string, PvPMatchState>();
const matchCleanupTimers = new Map<string, ReturnType<typeof setTimeout>>();
const dailyPreviewViewedByPlayer = new Map<number, string>();
const submitAnswerCooldownByPlayer = new Map<number, number>();
const topicGenerationIntervals = new Map<
  PvpChallengeTopic,
  ReturnType<typeof setInterval>
>();

const VICTORY_AUDIO = "https://micomi-assets.me/Sounds/Final/Victory_Sound.wav";
const DEFEAT_AUDIO = "https://micomi-assets.me/Sounds/Final/Defeat_Sound.wav";
const VICTORY_IMAGES = [
  "https://micomi-assets.me/Micomi%20Celebrating/micomiceleb1.png",
  "https://micomi-assets.me/Micomi%20Celebrating/micomiceleb2.png",
  "https://micomi-assets.me/Micomi%20Celebrating/micomiceleb3.png",
];
const WRONG_ANSWER_AUDIO = "https://micomi-assets.me/Sounds/Final/Wrong_2.wav";
const DEFEAT_IMAGES = [
  "https://micomi-assets.me/Micomi%20Celebrating/Failed1.png",
  "https://micomi-assets.me/Micomi%20Celebrating/Failed2.png",
  "https://micomi-assets.me/Micomi%20Celebrating/Failed3.png",
];

const randomFrom = (pool: string[]): string | null => {
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
};

const calculateStars = (mistakes: number, totalQuestions: number): number => {
  if (mistakes <= 0) return 3;
  if (totalQuestions <= 0) return 1;

  const ratio = (mistakes / totalQuestions) * 100;
  return ratio <= 20 ? 2 : 1;
};

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

const getTodayBounds = () => {
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
};

const hasActiveTopicMatch = (topic: PvpChallengeTopic): boolean => {
  for (const match of matches.values()) {
    if (match.status === "active" && match.topic === topic) {
      return true;
    }
  }
  return false;
};

const topUpTopicChallenges = async (
  topic: PvpChallengeTopic,
  amount: number,
): Promise<number> => {
  let generated = 0;
  let attempts = 0;
  const maxAttempts = Math.max(3, amount * 3);

  while (generated < amount && attempts < maxAttempts) {
    attempts += 1;
    try {
      await generatePvpChallengeWithGemini(topic, MATCH_DIFFICULTY, {
        maxAttempts: 3,
        duplicateLookback: 80,
      });
      generated += 1;
    } catch {
      // 10 second delay on failure before trying again to avoid hammering API
      await new Promise((res) => setTimeout(res, 10000));
    }
  }

  return generated;
};

const stopTopicGenerator = (topic: PvpChallengeTopic) => {
  const interval = topicGenerationIntervals.get(topic);
  if (!interval) return;
  clearInterval(interval);
  topicGenerationIntervals.delete(topic);
};

const startTopicGenerator = (topic: PvpChallengeTopic) => {
  if (topicGenerationIntervals.has(topic)) return;

  const tick = async () => {
    if (!hasActiveTopicMatch(topic)) {
      stopTopicGenerator(topic);
      return;
    }

    const { start, end } = getTodayBounds();

    const currentCount = await prisma.pVPChallenge.count({
      where: {
        topic,
        difficulty: MATCH_DIFFICULTY,
        created_at: { gte: start, lt: end },
      },
    });

    if (currentCount >= PVP_POOL_TARGET_ACTIVE) return;

    const toGenerate = Math.min(
      PVP_BACKGROUND_GENERATE_BATCH,
      PVP_POOL_TARGET_ACTIVE - currentCount,
    );
    if (toGenerate <= 0) return;

    await topUpTopicChallenges(topic, toGenerate);
  };

  const interval = setInterval(() => {
    void tick();
  }, PVP_BACKGROUND_GENERATE_TICK_MS);

  topicGenerationIntervals.set(topic, interval);
  void tick();
};

const getOrCreatePlayerState = (playerId: number): PlayerMatchmakingState => {
  const existing = matchmakingByPlayer.get(playerId);
  if (existing) return existing;

  const state: PlayerMatchmakingState = {
    status: "idle",
    selected_topic: playerTopicById.get(playerId) ?? null,
    match_id: null,
    updated_at: getNowIso(),
  };
  matchmakingByPlayer.set(playerId, state);
  return state;
};

const getQueueForTopic = (topic: PvpChallengeTopic): Set<number> => {
  const existing = queueByTopic.get(topic);
  if (existing) return existing;
  const created = new Set<number>();
  queueByTopic.set(topic, created);
  return created;
};

const clearPlayerFromQueue = (playerId: number) => {
  const selectedTopic = playerTopicById.get(playerId);
  if (selectedTopic) {
    getQueueForTopic(selectedTopic).delete(playerId);
    return;
  }

  for (const players of queueByTopic.values()) {
    players.delete(playerId);
  }
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
    selected_topic: playerTopicById.get(playerId) ?? null,
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
  if (match?.status === "completed") {
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
    clearPlayerFromQueue(playerId);
    setPlayerState(playerId, "idle", null);
  }
};

const randomInt = (maxExclusive: number) => {
  if (maxExclusive <= 1) return 0;
  return Math.floor(Math.random() * maxExclusive);
};

const pickRandomPair = (topic: PvpChallengeTopic): [number, number] | null => {
  const candidates = Array.from(getQueueForTopic(topic).values());
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

const buildQuestionPool = async (
  topic: PvpChallengeTopic,
): Promise<DailyPvpQuestion[]> => {
  const { start, end } = getTodayBounds();

  const minNeeded = QUESTIONS_PER_MATCH;
  const existingCount = await prisma.pVPChallenge.count({
    where: {
      topic,
      difficulty: MATCH_DIFFICULTY,
      created_at: { gte: start, lt: end },
    },
  });

  if (existingCount < minNeeded) {
    await topUpTopicChallenges(topic, minNeeded - existingCount);
  }

  const updatedCount = await prisma.pVPChallenge.count({
    where: {
      topic,
      difficulty: MATCH_DIFFICULTY,
      created_at: { gte: start, lt: end },
    },
  });

  if (updatedCount < minNeeded) {
    throw new Error(
      `Unable to generate enough ${topic} PvP challenges right now. Please try again.`,
    );
  }

  const challenges = await prisma.pVPChallenge.findMany({
    where: {
      topic,
      difficulty: MATCH_DIFFICULTY,
      created_at: { gte: start, lt: end },
    },
    orderBy: { created_at: "desc" },
    take: Math.max(PVP_POOL_TARGET_ACTIVE, QUESTIONS_PER_MATCH * 2),
  });

  if (challenges.length < minNeeded) {
    throw new Error(
      `Insufficient ${topic} PvP challenges available for matchmaking.`,
    );
  }

  startTopicGenerator(topic);

  const dailySeed = getDailySeed();
  const questionCount = Math.min(QUESTIONS_PER_MATCH, challenges.length);
  const baseIndices = buildSpreadIndices(challenges.length, questionCount);
  const rotation =
    deterministicHash(`${topic}-${dailySeed}`) % baseIndices.length;
  const rotatedIndices = baseIndices
    .slice(rotation)
    .concat(baseIndices.slice(0, rotation));

  return rotatedIndices.map((idx) => {
    const current = challenges[idx];

    return {
      challenge_id: current.pvp_challenge_id,
      topic,
      level_id: 0,
      level_number: null,
      map_name: topic,
      level_title: `${topic} PvP Arena`,
      challenge_type: "fill in the blank",
      title: `${topic} PvP Challenge`,
      description: `Fast ${topic} challenge generated for PvP matchmaking.`,
      question: current.question,
      options: normalizeToStringArray(current.options as unknown),
      correct_answer: normalizeToStringArray(current.correct_answer as unknown),
    };
  });
};

const getAllEasyTopics = async (): Promise<PvpChallengeTopic[]> => {
  return [...PVP_TOPICS];
};

const getSelectedCharacterDetails = async (playerId: number) => {
  const selected = await prisma.playerCharacter.findFirst({
    where: { player_id: playerId, is_selected: true, is_purchased: true },
    include: { character: true },
  });
  if (!selected) {
    throw new Error("No selected character found");
  }

  return selected.character;
};

const resolveAttackTypeAndDamage = (
  correctAnswerLength: number,
  damageArray: number[],
) => {
  if (correctAnswerLength >= 8) {
    return { attackType: "third_attack", damage: damageArray[2] ?? 0 };
  }
  if (correctAnswerLength >= 5) {
    return { attackType: "second_attack", damage: damageArray[1] ?? 0 };
  }
  return { attackType: "basic_attack", damage: damageArray[0] ?? 0 };
};

const getAttackIndexByType = (attackType: string | null): number => {
  if (attackType === "second_attack") return 1;
  if (attackType === "third_attack") return 2;
  if (attackType === "special_attack") return 3;
  return 0;
};

const getArrayItemOrNull = (value: unknown, index: number): string | null => {
  if (!Array.isArray(value)) return null;
  const item = value[index] ?? value[0] ?? null;
  return typeof item === "string" ? item : null;
};

const buildChallengeWithTimer = (
  question: DailyPvpQuestion,
  roundStartedAtIso: string,
) => {
  const elapsed = (Date.now() - new Date(roundStartedAtIso).getTime()) / 1000;
  const timeRemaining = Math.max(0, CHALLENGE_TIME_LIMIT - elapsed);

  return {
    ...question,
    timeLimit: CHALLENGE_TIME_LIMIT,
    timeRemaining,
    timer: formatTimer(timeRemaining),
  };
};

const buildEntryLikePayload = async (
  match: PvPMatchState,
  viewerPlayerId: number,
): Promise<PvpMatchEntryLikeResponse> => {
  const viewerIndex = getPlayerIndex(match, viewerPlayerId);
  if (viewerIndex === -1) {
    throw new Error("You are not part of this match");
  }

  const opponentIndex = getOpponentIndex(viewerIndex);
  const viewerSnapshot = match.players[viewerIndex];
  const opponentSnapshot = match.players[opponentIndex];
  const question = getRoundQuestion(match);

  if (!question) {
    throw new Error("No current challenge found");
  }

  const [viewerChar, opponentChar, energyStatus] = await Promise.all([
    getSelectedCharacterDetails(viewerPlayerId),
    getSelectedCharacterDetails(opponentSnapshot.player_id),
    EnergyService.getPlayerEnergyStatus(viewerPlayerId),
  ]);

  const viewerDamageArray = Array.isArray(viewerChar.character_damage)
    ? (viewerChar.character_damage as number[])
    : [viewerSnapshot.attack_damage];
  const correctAnswerLength = question.correct_answer.length;
  const { attackType, damage } = resolveAttackTypeAndDamage(
    correctAnswerLength,
    viewerDamageArray,
  );
  const opponentDamageArray = Array.isArray(opponentChar.character_damage)
    ? (opponentChar.character_damage as number[])
    : [opponentSnapshot.attack_damage];
  const { attackType: opponentAttackType } = resolveAttackTypeAndDamage(
    correctAnswerLength,
    opponentDamageArray,
  );

  const cardInfo = getCardForAttackType(viewerChar.character_name, attackType);
  const character_attack_audio = getHeroAttackAudio(
    viewerChar.character_name,
    attackType,
  );
  const enemy_attack_audio = getHeroAttackAudio(
    opponentChar.character_name,
    opponentAttackType,
  );
  const enemy_hurt_audio = getHeroHurtAudio(opponentChar.character_name);
  const character_hurt_audio = getHeroHurtAudio(viewerChar.character_name);

  const mapName = question.map_name || question.topic;
  const levelNumber = question.level_number ?? 1;

  const currentChallenge = buildChallengeWithTimer(
    question,
    match.current_round_started_at,
  );
  const combatBackground = [await getBackgroundForLevel(mapName, levelNumber)];
  const mapAssets = getMapMediaAssets(mapName);

  const viewerSS = getHeroSpecialSkillAssets(viewerChar.character_name);
  const opponentSS = getHeroSpecialSkillAssets(opponentChar.character_name);

  return {
    level: {
      level_id: 0,
      level_number: null,
      level_type: "pvp_daily",
      level_difficulty: "easy",
      level_title: `${question.topic} PvP Arena`,
      content: `Dynamic PvP ${question.topic} challenge`,
    },
    enemy: {
      player_id: opponentSnapshot.player_id,
      player_name: opponentSnapshot.player_name,
      enemy_id: opponentSnapshot.character_id,
      enemy_name: opponentSnapshot.character_name,
      enemy_health: opponentSnapshot.character_health,
      enemy_max_health: opponentSnapshot.character_max_health,
      enemy_idle: opponentChar.avatar_image,
      enemy_run: opponentChar.character_run,
      enemy_damage: opponentChar.character_damage,
      enemy_attack: opponentChar.character_attacks,
      enemy_hurt: opponentChar.character_hurt,
      enemy_dies: opponentChar.character_dies,
      enemy_avatar: opponentChar.character_avatar,
      special_skill: {
        special_skill_image: opponentSS.special_skill_image,
        streak: 0,
        special_skill_description: opponentSS.special_skill_description,
        ss_type: null,
      },
    },
    character: {
      player_id: viewerSnapshot.player_id,
      player_name: viewerSnapshot.player_name,
      character_id: viewerSnapshot.character_id,
      character_name: viewerSnapshot.character_name,
      character_health: viewerSnapshot.character_health,
      character_max_health: viewerSnapshot.character_max_health,
      character_damage: viewerChar.character_damage,
      character_idle: viewerChar.avatar_image,
      character_run: viewerChar.character_run,
      character_attack: viewerChar.character_attacks,
      character_hurt: viewerChar.character_hurt,
      character_dies: viewerChar.character_dies,
      character_avatar: viewerChar.character_avatar,
      character_is_range: viewerChar.is_range,
      character_range_attack: viewerChar.range_attacks,
      special_skill: {
        special_skill_image: viewerSS.special_skill_image,
        streak: 0,
        special_skill_description: viewerSS.special_skill_description,
      },
    },
    card: {
      card_type: cardInfo.card_type,
      character_attack_card: cardInfo.character_attack_card,
      character_damage_card: damage,
    },
    currentChallenge,
    energy: energyStatus.energy ?? 0,
    timeToNextEnergyRestore: energyStatus.timeToNextRestore,
    correct_answer_length: correctAnswerLength,
    combat_background: combatBackground,
    question_type: question.topic,
    versus_background: mapAssets.versus_background,
    versus_audio: mapAssets.versus_audio,
    gameplay_audio: mapAssets.gameplay_audio,
    is_correct_audio: null,
    enemy_attack_audio,
    character_attack_audio,
    character_hurt_audio,
    enemy_hurt_audio,
    death_audio: null,
    is_victory_audio: null,
    is_victory_image: null,
    boss_skill_activated: false,
    isEnemyFrozen: false,
  };
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
    last_attack_by_player_id: match.last_attack_by_player_id,
    last_attack_type: match.last_attack_type,
    last_attack_damage: match.last_attack_damage,
    pending_wrong_challenge_by_player: {
      ...match.pending_wrong_challenge_by_player,
    },
  };
};

const persistMatchProgress = async (match: PvPMatchState) => {
  const payload = cloneMatchForResponse(
    match,
  ) as unknown as Prisma.InputJsonValue;

  await prisma.playerVsPlayerProgress.upsert({
    where: { match_id: match.match_id },
    update: {
      player_one_id: match.players[0].player_id,
      player_two_id: match.players[1].player_id,
      status: match.status,
      payload,
    },
    create: {
      match_id: match.match_id,
      player_one_id: match.players[0].player_id,
      player_two_id: match.players[1].player_id,
      status: match.status,
      payload,
    },
  });
};

const removeMatchProgress = async (matchId: string) => {
  await prisma.playerVsPlayerProgress.deleteMany({
    where: { match_id: matchId },
  });
};

const scheduleMatchCleanup = (matchId: string) => {
  const existingTimer = matchCleanupTimers.get(matchId);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  const timer = setTimeout(async () => {
    matches.delete(matchId);
    await removeMatchProgress(matchId);
    matchCleanupTimers.delete(matchId);
  }, MATCH_COMPLETION_CLEANUP_MS);

  matchCleanupTimers.set(matchId, timer);
};

const getMatchFromMemoryOrDb = async (
  matchId: string,
): Promise<PvPMatchState | null> => {
  const inMemory = matches.get(matchId);
  if (inMemory) {
    return inMemory;
  }

  const persisted = await prisma.playerVsPlayerProgress.findUnique({
    where: { match_id: matchId },
    select: { payload: true },
  });

  if (!persisted) {
    return null;
  }

  const hydrated = persisted.payload as unknown as PvPMatchState;
  matches.set(matchId, hydrated);
  return hydrated;
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

const getQuestionByChallengeId = (
  match: PvPMatchState,
  challengeId: number,
): DailyPvpQuestion | null => {
  return match.questions.find((q) => q.challenge_id === challengeId) ?? null;
};

const getRoundByChallengeId = (
  match: PvPMatchState,
  challengeId: number,
): PvPQuestionRoundState | null => {
  return match.rounds.find((r) => r.challenge_id === challengeId) ?? null;
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
  const totalQuestions = match.questions.length;
  const winnerMistakes = match.mistakes_by_player[winnerPlayerId] ?? 0;
  const loserMistakes = match.mistakes_by_player[loserPlayerId] ?? 0;

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
    winner_mistakes: winnerMistakes,
    loser_mistakes: loserMistakes,
    total_questions: totalQuestions,
    resolved_questions: resolvedQuestions,
    reason,
    message_for_winner: `You finished ${loser.player_name} with ${winnerMistakes} mistakes.`,
    message_for_loser: `${winner.player_name} defeated you with ${winnerMistakes} mistakes.`,
  };

  match.completion_stats = stats;
  await persistMatchProgress(match);

  await prisma.playerVsPlayerResult.createMany({
    data: [
      {
        match_id: match.match_id,
        player_id: winner.player_id,
        player_name: winner.player_name,
        character_name: winner.character_name,
        character_avatar: winner.character_avatar,
        match_status: "win",
        stars: calculateStars(winnerMistakes, totalQuestions),
      },
      {
        match_id: match.match_id,
        player_id: loser.player_id,
        player_name: loser.player_name,
        character_name: loser.character_name,
        character_avatar: loser.character_avatar,
        match_status: "loss",
        stars: 0,
      },
    ],
    skipDuplicates: true,
  });

  emitMatchStateToPlayers(match, "pvp:match-completed");
  scheduleMatchCleanup(match.match_id);

  if (!hasActiveTopicMatch(match.topic)) {
    stopTopicGenerator(match.topic);
  }

  resetPlayerToIdle(winnerPlayerId);
  resetPlayerToIdle(loserPlayerId);
};

const maybeProgressRoundOrFinish = async (match: PvPMatchState) => {
  const alive = getAlivePlayerIds(match);
  if (alive.length === 1) {
    const winnerPlayerId = alive[0];

    if (match.current_round_index < match.questions.length - 1) {
      match.finisher_bonus_coins_by_player[winnerPlayerId] =
        (match.finisher_bonus_coins_by_player[winnerPlayerId] ?? 0) + 15;
    }

    await completeMatch(match, winnerPlayerId, "knockout");
    return;
  }

  if (alive.length === 0) {
    const p1 = match.players[0].player_id;
    const p2 = match.players[1].player_id;
    const p1Mistakes = match.mistakes_by_player[p1] ?? 0;
    const p2Mistakes = match.mistakes_by_player[p2] ?? 0;
    const winner = p1Mistakes <= p2Mistakes ? p1 : p2;
    await completeMatch(match, winner, "knockout");
    return;
  }

  if (match.current_round_index >= match.questions.length - 1) {
    match.current_round_index = 0;
    match.rounds = createRounds(match.questions);
    for (const player of match.players) {
      match.pending_wrong_challenge_by_player[player.player_id] = null;
    }
  } else {
    match.current_round_index += 1;
  }
  match.current_round_started_at = getNowIso();
};

const tryCreatePair = async (
  topic: PvpChallengeTopic,
): Promise<string | null> => {
  const pair = pickRandomPair(topic);
  if (!pair) return null;

  const [playerA, playerB] = pair;
  clearPlayerFromQueue(playerA);
  clearPlayerFromQueue(playerB);

  const [snapshotAResult, snapshotBResult, questions] =
    await Promise.allSettled([
      getSelectedCharacterSnapshot(playerA),
      getSelectedCharacterSnapshot(playerB),
      buildQuestionPool(topic),
    ]);

  if (
    snapshotAResult.status !== "fulfilled" ||
    snapshotBResult.status !== "fulfilled"
  ) {
    if (snapshotAResult.status !== "fulfilled") {
      resetPlayerToIdle(playerA);
    } else {
      setPlayerState(playerA, "finding_match", null);
      getQueueForTopic(topic).add(playerA);
    }

    if (snapshotBResult.status !== "fulfilled") {
      resetPlayerToIdle(playerB);
    } else {
      setPlayerState(playerB, "finding_match", null);
      getQueueForTopic(topic).add(playerB);
    }

    return null;
  }

  if (questions.status !== "fulfilled") {
    resetPlayerToIdle(playerA);
    resetPlayerToIdle(playerB);
    throw new Error(
      "Challenge generation failed for this topic. Please try play again.",
    );
  }

  const snapshotA = snapshotAResult.value;
  const snapshotB = snapshotBResult.value;
  const questionPool = questions.value;

  if (questionPool.length < QUESTIONS_PER_MATCH) {
    resetPlayerToIdle(playerA);
    resetPlayerToIdle(playerB);
    throw new Error(
      "Not enough generated PvP challenges yet. Please retry in a moment.",
    );
  }

  const now = getNowIso();
  const matchId = `pvp-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

  const match: PvPMatchState = {
    match_id: matchId,
    topic,
    created_at: now,
    started_at: now,
    current_round_started_at: now,
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
    last_attack_by_player_id: null,
    last_attack_type: null,
    last_attack_damage: 0,
    pending_wrong_challenge_by_player: {
      [playerA]: null,
      [playerB]: null,
    },
  };

  matches.set(matchId, match);
  await persistMatchProgress(match);
  setPlayerState(playerA, "already_matched", matchId);
  setPlayerState(playerB, "already_matched", matchId);
  emitMatchStateToPlayers(match, "pvp:match-found");

  return matchId;
};

const pairWaitingPlayers = async () => {
  const topicsWithQueues = Array.from(queueByTopic.entries()).filter(
    ([, players]) => players.size >= 2,
  );

  for (const [topic, players] of topicsWithQueues) {
    let guard = players.size + 2;
    while (players.size >= 2 && guard > 0) {
      await tryCreatePair(topic);
      guard -= 1;
    }
  }
};

const publicQuestion = (question: DailyPvpQuestion) => {
  return {
    challenge_id: question.challenge_id,
    topic: question.topic,
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

export const setMatchTopic = async (
  playerId: number,
  topic: PvpChallengeTopic,
): Promise<PvpDailyStatusResponse> => {
  if (!PVP_TOPICS.includes(topic)) {
    throw new Error("Invalid topic selected for PvP");
  }

  const state = getOrCreatePlayerState(playerId);
  if (state.status === "already_matched") {
    throw new Error("Cannot change topic while already matched");
  }

  clearPlayerFromQueue(playerId);
  playerTopicById.set(playerId, topic);

  if (state.status === "finding_match") {
    getQueueForTopic(topic).add(playerId);
  }

  setPlayerState(playerId, state.status, state.match_id);

  const updatedState = getOrCreatePlayerState(playerId);
  return {
    status: updatedState,
    match_found:
      updatedState.status === "already_matched" && !!updatedState.match_id,
    match_id: updatedState.match_id,
  };
};

export const getDailyPreview = async (
  playerId: number,
): Promise<PvpDailyPreviewResponse> => {
  const topics = await getAllEasyTopics();
  const todaySeed = getDailySeed();
  dailyPreviewViewedByPlayer.set(playerId, todaySeed);

  reconcileMatchedState(playerId);
  const state = getOrCreatePlayerState(playerId);

  return {
    daily_seed: getDailySeed(),
    preview_task: {
      title: "Topic-based PvP Challenge",
      description:
        "Choose one topic, then race another player to solve PvP challenges.",
      topics_covered: topics,
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

  if (!state.selected_topic) {
    throw new Error(
      "Choose a PvP topic first before clicking play. Allowed topics: HTML, CSS, JavaScript, Computer.",
    );
  }

  if (state.status === "already_matched" && state.match_id) {
    return {
      status: state,
      match_found: true,
      match_id: state.match_id,
    };
  }

  setPlayerState(playerId, "finding_match", null);
  getQueueForTopic(state.selected_topic).add(playerId);

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

  const hasTopicQueueReady = Array.from(queueByTopic.values()).some(
    (players) => players.size >= 2,
  );

  if (state.status === "finding_match" && hasTopicQueueReady) {
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

  const match = await getMatchFromMemoryOrDb(matchId);
  if (!match) {
    throw new Error("Match not found");
  }

  if (getPlayerIndex(match, playerId) === -1) {
    throw new Error("You are not part of this match");
  }

  const wasLastAttacker = match.last_attack_by_player_id === playerId;

  if (match.status === "completed") {
    return buildSubmitLikeResponse(
      match,
      playerId,
      "round_already_resolved",
      wasLastAttacker,
    );
  }

  const currentRound = match.rounds[match.current_round_index] ?? null;

  const hasAttemptsInCurrentRound =
    (currentRound?.attempts_by_player[playerId] ?? 0) > 0;

  const hasAnyAttemptsAcrossPlayers = Object.values(
    currentRound?.attempts_by_player ?? {},
  ).some((attempts) => attempts > 0);

  if (
    match.current_round_index === 0 &&
    match.last_attack_by_player_id === null &&
    !hasAnyAttemptsAcrossPlayers
  ) {
    return buildEntryLikePayload(match, playerId);
  }

  if (match.last_attack_by_player_id !== null && !hasAttemptsInCurrentRound) {
    return buildSubmitLikeResponse(
      match,
      playerId,
      "round_already_resolved",
      wasLastAttacker, // <-- Changed from hardcoded false
    );
  }

  return buildSubmitLikeResponse(match, playerId, "ongoing", false);
};

const buildSubmitLikeResponse = async (
  match: PvPMatchState,
  playerId: number,
  reason: PvpDailySubmitAnswerResult["reason"],
  isCorrect: boolean,
  attackMeta?: {
    attackType: string;
    damage: number;
  },
): Promise<PvpDailySubmitAnswerResult> => {
  const entryLike = await buildEntryLikePayload(match, playerId);
  const round = match.rounds[Math.max(0, match.current_round_index)] ?? null;
  const attempts = round?.attempts_by_player[playerId] ?? 0;
  const isCompleted = match.status === "completed";
  const isVictory = isCompleted && match.winner_player_id === playerId;

  const nextQuestion = match.questions[match.current_round_index] ?? null;
  const currentRoundChallenge =
    !isCompleted && nextQuestion
      ? buildChallengeWithTimer(nextQuestion, match.current_round_started_at)
      : null;
  const shouldExposeNextChallenge =
    !isCompleted &&
    (reason === "correct_and_first" ||
      (reason === "round_already_resolved" &&
        match.last_attack_by_player_id !== null) ||
      reason === "ongoing");
  const shouldRepeatCurrentChallenge = !isCompleted && reason === "incorrect";
  const nextChallenge =
    shouldExposeNextChallenge || shouldRepeatCurrentChallenge
      ? currentRoundChallenge
      : null;
  const isWrongRetryState = reason === "incorrect" || reason === "ongoing";

  const resolvedAttack = isWrongRetryState
    ? null
    : (attackMeta ??
      (match.last_attack_by_player_id
        ? {
            attackType: match.last_attack_type ?? "basic_attack",
            damage: match.last_attack_damage,
          }
        : null));

  const isViewerLastAttacker =
    !!resolvedAttack && match.last_attack_by_player_id === playerId;

  const resolvedAttackType = resolvedAttack?.attackType ?? null;
  const resolvedAttackIndex = getAttackIndexByType(resolvedAttackType);

  const viewerCharacter = entryLike.character as Record<string, unknown>;
  const opponentEnemy = entryLike.enemy as Record<string, unknown>;

  const viewerAttackAsset = getArrayItemOrNull(
    viewerCharacter.character_attack,
    resolvedAttackIndex,
  );
  const viewerRangeAttackAsset = getArrayItemOrNull(
    viewerCharacter.character_range_attack,
    resolvedAttackIndex,
  );

  const opponentAttackAsset = getArrayItemOrNull(
    opponentEnemy.enemy_attack,
    resolvedAttackIndex,
  );

  const characterShowsAttack = !!resolvedAttack && isViewerLastAttacker;
  const enemyShowsAttack = !!resolvedAttack && !isViewerLastAttacker;
  const isCharacterDead = Number(viewerCharacter.character_health ?? 0) <= 0;

  const viewerCharName = String(viewerCharacter.character_name || "");
  const opponentCharName = String(opponentEnemy.enemy_name || "");

  const final_character_attack_audio = characterShowsAttack
    ? getHeroAttackAudio(viewerCharName, resolvedAttackType ?? "basic_attack")
    : null;

  const final_enemy_hurt_audio = characterShowsAttack
    ? getHeroHurtAudio(opponentCharName)
    : null;

  const final_enemy_attack_audio = enemyShowsAttack
    ? getHeroAttackAudio(opponentCharName, resolvedAttackType ?? "basic_attack")
    : null;

  const final_character_hurt_audio = enemyShowsAttack
    ? getHeroHurtAudio(viewerCharName)
    : null;

  const characterForFightResult = {
    player_id: viewerCharacter.player_id,
    player_name: viewerCharacter.player_name,
    character_id: viewerCharacter.character_id,
    character_name: viewerCharacter.character_name,
    character_idle: viewerCharacter.character_idle,
    character_run:
      isWrongRetryState || enemyShowsAttack || isCharacterDead
        ? null
        : viewerCharacter.character_run,
    character_attack_type: characterShowsAttack ? resolvedAttackType : null,
    character_attack: characterShowsAttack ? viewerAttackAsset : null,
    character_range_attack:
      characterShowsAttack && viewerCharacter.character_is_range
        ? viewerRangeAttackAsset
        : null,
    character_hurt: enemyShowsAttack ? viewerCharacter.character_hurt : null,
    character_dies: isCharacterDead ? viewerCharacter.character_dies : null,
    character_damage: resolvedAttack
      ? isViewerLastAttacker
        ? resolvedAttack.damage
        : 0
      : 0,
    character_health: viewerCharacter.character_health,
    character_max_health: viewerCharacter.character_max_health,
    character_avatar: viewerCharacter.character_avatar,
    character_is_range: viewerCharacter.character_is_range,
    special_skill: viewerCharacter.special_skill,
    character_current_state: characterShowsAttack
      ? "attacking"
      : enemyShowsAttack
        ? "hurt"
        : null,
    character_attack_overlay: null,
    character_reaction: characterShowsAttack
      ? "Great timing!"
      : enemyShowsAttack
        ? "I need to recover!"
        : null,
  };

  const enemyForFightResult = {
    player_id: opponentEnemy.player_id,
    player_name: opponentEnemy.player_name,
    enemy_id: opponentEnemy.enemy_id,
    enemy_name: opponentEnemy.enemy_name,
    enemy_idle: opponentEnemy.enemy_idle,
    enemy_run: enemyShowsAttack ? opponentEnemy.enemy_run : null,
    enemy_attack_type: enemyShowsAttack ? resolvedAttackType : null,
    enemy_attack: enemyShowsAttack ? opponentAttackAsset : null,
    enemy_hurt: characterShowsAttack ? opponentEnemy.enemy_hurt : null,
    enemy_dies:
      Number(opponentEnemy.enemy_health ?? 0) <= 0
        ? opponentEnemy.enemy_dies
        : null,
    enemy_damage: resolvedAttack
      ? isViewerLastAttacker
        ? 0
        : resolvedAttack.damage
      : 0,
    enemy_health: opponentEnemy.enemy_health,
    enemy_max_health: opponentEnemy.enemy_max_health,
    enemy_avatar: opponentEnemy.enemy_avatar,
    special_skill: opponentEnemy.special_skill,
    enemy_current_state: enemyShowsAttack
      ? "attacking"
      : characterShowsAttack
        ? "hurt"
        : null,
    enemy_attack_overlay: null,
    enemy_hit_reaction: null,
    enemy_reaction: characterShowsAttack
      ? "That smarts!"
      : enemyShowsAttack
        ? "Counterattack!"
        : null,
  };

  const fightResult = {
    status: isCompleted ? (isVictory ? "won" : "lost") : "in_progress",
    enemy: enemyForFightResult,
    character: characterForFightResult,
    timer: currentRoundChallenge ? currentRoundChallenge.timer : "00:00",
    energy: entryLike.energy,
    timeToNextEnergyRestore: entryLike.timeToNextEnergyRestore,
    attackType: resolvedAttack?.attackType ?? null,
    damage: resolvedAttack?.damage ?? null,
    boss_skill_activated: false,
  };

  const submitMessage =
    reason === "correct_and_first"
      ? "Great timing! You landed the hit."
      : reason === "correct_but_late"
        ? "Correct answer, but opponent already claimed this round."
        : reason === "round_already_resolved"
          ? "Round already resolved."
          : reason === "ongoing"
            ? "Match is ongoing."
            : "That was tricky!";

  const mistakes = match.mistakes_by_player[playerId] ?? 0;
  const stars = isVictory
    ? calculateStars(mistakes, match.questions.length)
    : 0;

  const completionRewards = isCompleted
    ? {
        feedbackMessage: generateMotivationalMessage(
          false,
          mistakes,
          match.questions.length,
          false,
          isVictory,
          entryLike.level.level_number ?? null,
        ),
        totalPointsEarned: match.rewards_by_player[playerId]?.points ?? 0,
        totalExpPointsEarned: match.rewards_by_player[playerId]?.exp ?? 0,
        coinsEarned: match.rewards_by_player[playerId]?.coins ?? 0,
        isVictory,
        stars,
        playerOutputs: [],
      }
    : undefined;

  return {
    is_correct: isCorrect,
    accepted_for_attack: reason === "correct_and_first",
    reason,
    isCorrect,
    attempts,
    fightResult,
    message: submitMessage,
    nextChallenge,
    audio: [],
    completionRewards,
    level: entryLike.level,
    levelStatus: {
      isCompleted,
      showFeedback: isCompleted,
      playerHealth: (entryLike.character as { character_health?: number })
        .character_health,
      playerMaxHealth: (
        entryLike.character as { character_max_health?: number }
      ).character_max_health,
      enemyHealth: (entryLike.enemy as { enemy_health?: number }).enemy_health,
      enemyMaxHealth: (entryLike.enemy as { enemy_max_health?: number })
        .enemy_max_health,
      coinsEarned: isCompleted
        ? (match.rewards_by_player[playerId]?.coins ?? 0)
        : 0,
      totalPointsEarned: isCompleted
        ? (match.rewards_by_player[playerId]?.points ?? 0)
        : 0,
      totalExpPointsEarned: isCompleted
        ? (match.rewards_by_player[playerId]?.exp ?? 0)
        : 0,
      playerOutputs: [],
    },
    nextLevel: null,
    energy: entryLike.energy,
    timeToNextEnergyRestore: entryLike.timeToNextEnergyRestore,
    correct_answer_length: entryLike.correct_answer_length,
    combat_background: entryLike.combat_background,
    question_type: entryLike.question_type,
    is_bonus_round: false,
    card: entryLike.card,
    gameplay_audio: entryLike.gameplay_audio,
    is_correct_audio:
      reason === "ongoing"
        ? null
        : isCorrect
          ? CORRECT_ANSWER_AUDIO
          : WRONG_ANSWER_AUDIO,
    enemy_attack_audio: final_enemy_attack_audio,
    character_attack_audio: final_character_attack_audio,
    character_hurt_audio: final_character_hurt_audio,
    enemy_hurt_audio: final_enemy_hurt_audio,
    death_audio: isCompleted
      ? "https://micomi-assets.me/Sounds/Final/All%20Death.wav"
      : null,
    is_victory_audio: isCompleted
      ? isVictory
        ? VICTORY_AUDIO
        : DEFEAT_AUDIO
      : null,
    is_victory_image: isCompleted
      ? isVictory
        ? randomFrom(VICTORY_IMAGES)
        : randomFrom(DEFEAT_IMAGES)
      : null,
  } as PvpDailySubmitAnswerResult;
};

export const submitAnswer = async (
  playerId: number,
  matchId: string,
  challengeId: number,
  answer: string[],
): Promise<PvpDailySubmitAnswerResult> => {
  const nowMs = Date.now();
  const lastSubmitAt = submitAnswerCooldownByPlayer.get(playerId) ?? 0;
  const cooldownRemaining = SUBMIT_ANSWER_COOLDOWN_MS - (nowMs - lastSubmitAt);

  if (cooldownRemaining > 0) {
    throw new Error(
      `Please wait ${Math.ceil(cooldownRemaining / 1000)} seconds before submitting again.`,
    );
  }

  submitAnswerCooldownByPlayer.set(playerId, nowMs);

  const match = await getMatchFromMemoryOrDb(matchId);
  if (!match) {
    throw new Error("Match not found");
  }

  if (match.status === "completed") {
    return buildSubmitLikeResponse(
      match,
      playerId,
      "round_already_resolved",
      false,
    );
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

  if (question.challenge_id !== challengeId) {
    throw new Error(
      `Challenge mismatch. Expected ${question.challenge_id} for current round.`,
    );
  }

  const now = getNowIso();

  if (!round.first_submission_by_player_id) {
    round.first_submission_by_player_id = playerId;
    round.first_submission_at = now;
  }

  round.attempts_by_player[playerId] =
    (round.attempts_by_player[playerId] ?? 0) + 1;

  if (round.resolved_by_player_id) {
    return buildSubmitLikeResponse(
      match,
      playerId,
      "round_already_resolved",
      false,
    );
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
    await persistMatchProgress(match);

    return buildSubmitLikeResponse(match, playerId, "incorrect", false);
  }

  const isFirstCorrect = round.resolved_by_player_id === null;

  if (isFirstCorrect) {
    round.resolved_by_player_id = playerId;
    round.resolved_at = now;

    const opponentIndex = getOpponentIndex(playerIndex);
    const attacker = match.players[playerIndex];
    const opponent = match.players[opponentIndex];
    const attackerCharacter = await getSelectedCharacterDetails(playerId);
    const attackerDamageArray = Array.isArray(
      attackerCharacter.character_damage,
    )
      ? (attackerCharacter.character_damage as number[])
      : [attacker.attack_damage];
    const attackResolution = resolveAttackTypeAndDamage(
      question.correct_answer.length,
      attackerDamageArray,
    );
    const appliedDamage =
      attackResolution.damage > 0
        ? attackResolution.damage
        : attacker.attack_damage;

    match.last_attack_by_player_id = playerId;
    match.last_attack_type = attackResolution.attackType;
    match.last_attack_damage = appliedDamage;

    opponent.character_health = Math.max(
      0,
      opponent.character_health - appliedDamage,
    );

    await maybeProgressRoundOrFinish(match);
    if (match.status === "active") {
      await persistMatchProgress(match);
    }

    if (match.status === "active") {
      emitMatchStateToPlayers(match, "pvp:match-update");
    }

    return buildSubmitLikeResponse(match, playerId, "correct_and_first", true, {
      attackType: attackResolution.attackType,
      damage: appliedDamage,
    });
  }

  return buildSubmitLikeResponse(match, playerId, "correct_but_late", true);
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
