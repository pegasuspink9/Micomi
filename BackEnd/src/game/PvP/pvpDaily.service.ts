import { Prisma, PrismaClient, PotionType } from "@prisma/client";
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
  UNIVERSAL_ENEMY_HURT_AUDIO,
} from "../../../helper/gameplayAssetsHelper";
import { getCardForAttackType } from "../Combat/combat.service";
import { CHALLENGE_TIME_LIMIT } from "../../../helper/timeSetter";
import { formatTimer } from "../../../helper/dateTimeHelper";
import * as EnergyService from "../Energy/energy.service";
import {
  DEFAULT_ENEMY_ATTACK_AUDIO,
  ENEMY_ATTACK_SOUNDS,
} from "../../../helper/enemyAttackSounds";

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

const VICTORY_AUDIO = "https://micomi-assets.me/Sounds/Final/Victory_Sound.wav";
const DEFEAT_AUDIO = "https://micomi-assets.me/Sounds/Final/Defeat_Sound.wav";
const VICTORY_IMAGES = [
  "https://micomi-assets.me/Micomi%20Celebrating/micomiceleb1.png",
  "https://micomi-assets.me/Micomi%20Celebrating/micomiceleb2.png",
  "https://micomi-assets.me/Micomi%20Celebrating/micomiceleb3.png",
];
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
        level_difficulty: "easy",
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

const getAllEasyTopics = async (): Promise<string[]> => {
  const levels = await prisma.level.findMany({
    where: { level_difficulty: "easy" },
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
    }));
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

  const [viewerChar, opponentChar, level, energyStatus] = await Promise.all([
    getSelectedCharacterDetails(viewerPlayerId),
    getSelectedCharacterDetails(opponentSnapshot.player_id),
    prisma.level.findUnique({
      where: { level_id: question.level_id },
      include: { map: true },
    }),
    EnergyService.getPlayerEnergyStatus(viewerPlayerId),
  ]);

  if (!level) {
    throw new Error("Level not found for current challenge");
  }

  const viewerDamageArray = Array.isArray(viewerChar.character_damage)
    ? (viewerChar.character_damage as number[])
    : [viewerSnapshot.attack_damage];
  const correctAnswerLength = question.correct_answer.length;
  const { attackType, damage } = resolveAttackTypeAndDamage(
    correctAnswerLength,
    viewerDamageArray,
  );
  const cardInfo = getCardForAttackType(viewerChar.character_name, attackType);
  const character_attack_audio = getHeroAttackAudio(
    viewerChar.character_name,
    attackType,
  );
  const character_hurt_audio = getHeroHurtAudio(viewerChar.character_name);
  const enemyNameForAudio = String(opponentSnapshot.character_name);
  const enemy_attack_audio =
    ENEMY_ATTACK_SOUNDS[enemyNameForAudio]?.basic ?? DEFAULT_ENEMY_ATTACK_AUDIO;

  const mapName = question.map_name || level.map.map_name;
  const levelNumber = question.level_number ?? level.level_number;

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
      level_id: level.level_id,
      level_number: level.level_number,
      level_type: "pvp_daily",
      level_difficulty: String(level.level_difficulty),
      level_title: level.level_title,
      content: level.content,
    },
    enemy: {
      player_id: opponentSnapshot.player_id,
      player_name: opponentSnapshot.player_name,
      enemy_id: opponentSnapshot.character_id,
      enemy_name: opponentSnapshot.character_name,
      enemy_health: opponentSnapshot.character_health,
      enemy_idle: opponentChar.avatar_image,
      enemy_run: opponentChar.character_run,
      enemy_damage: opponentSnapshot.attack_damage,
      enemy_attack: Array.isArray(opponentChar.character_attacks)
        ? opponentChar.character_attacks[0]
        : null,
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
    question_type: level.map.map_name,
    versus_background: mapAssets.versus_background,
    versus_audio: mapAssets.versus_audio,
    gameplay_audio: mapAssets.gameplay_audio,
    is_correct_audio: null,
    enemy_attack_audio,
    character_attack_audio,
    character_hurt_audio,
    enemy_hurt_audio: UNIVERSAL_ENEMY_HURT_AUDIO,
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

  matches.delete(match.match_id);
  await removeMatchProgress(match.match_id);

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
  match.current_round_started_at = getNowIso();
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
    throw new Error("No easy daily challenges are available for PvP");
  }

  const now = getNowIso();
  const matchId = `pvp-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

  const match: PvPMatchState = {
    match_id: matchId,
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
  };

  matches.set(matchId, match);
  await persistMatchProgress(match);
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
  const topics = await getAllEasyTopics();
  const todaySeed = getDailySeed();
  dailyPreviewViewedByPlayer.set(playerId, todaySeed);

  reconcileMatchedState(playerId);
  const state = getOrCreatePlayerState(playerId);

  return {
    daily_seed: getDailySeed(),
    preview_task: {
      title: "Daily PvP Easy Challenge",
      description:
        "Race another player to solve easy questions spanning all unlocked game topics.",
      topics_covered: topics,
      question_count: questions.length,
      difficulty: "easy",
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

  const match = await getMatchFromMemoryOrDb(matchId);
  if (!match) {
    throw new Error("Match not found");
  }

  if (getPlayerIndex(match, playerId) === -1) {
    throw new Error("You are not part of this match");
  }

  return buildEntryLikePayload(match, playerId);
};

const buildSubmitLikeResponse = async (
  match: PvPMatchState,
  playerId: number,
  reason: PvpDailySubmitAnswerResult["reason"],
  isCorrect: boolean,
): Promise<PvpDailySubmitAnswerResult> => {
  const entryLike = await buildEntryLikePayload(match, playerId);
  const round = match.rounds[Math.max(0, match.current_round_index)] ?? null;
  const attempts = round?.attempts_by_player[playerId] ?? 0;

  const nextQuestion = match.questions[match.current_round_index] ?? null;
  const nextChallenge = nextQuestion
    ? buildChallengeWithTimer(nextQuestion, match.current_round_started_at)
    : null;

  const fightResult = {
    status: match.status === "completed" ? "completed" : "in_progress",
    enemy: entryLike.enemy,
    character: entryLike.character,
    timer: nextChallenge ? nextChallenge.timer : "00:00",
    energy: entryLike.energy,
    timeToNextEnergyRestore: entryLike.timeToNextEnergyRestore,
    boss_skill_activated: false,
  };

  const submitMessage =
    reason === "correct_and_first"
      ? "Great timing! You landed the hit."
      : reason === "correct_but_late"
        ? "Correct answer, but opponent already claimed this round."
        : reason === "round_already_resolved"
          ? "Round already resolved."
          : "That was tricky!";

  const isCompleted = match.status === "completed";
  const isVictory = isCompleted && match.winner_player_id === playerId;
  const mistakes = match.mistakes_by_player[playerId] ?? 0;
  const stars = isVictory
    ? calculateStars(mistakes, match.questions.length)
    : 0;

  const completionRewards = isCompleted
    ? {
        feedbackMessage: isVictory
          ? "Victory! You outplayed your opponent."
          : "Defeat. Study this round and strike back.",
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
    levelStatus: {
      isCompleted,
      showFeedback: isCompleted,
      playerHealth: (entryLike.character as { character_health?: number })
        .character_health,
      enemyHealth: (entryLike.enemy as { enemy_health?: number }).enemy_health,
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
    is_correct_audio: isCorrect ? CORRECT_ANSWER_AUDIO : null,
    enemy_attack_audio: entryLike.enemy_attack_audio,
    character_attack_audio: entryLike.character_attack_audio,
    character_hurt_audio: entryLike.character_hurt_audio,
    enemy_hurt_audio: entryLike.enemy_hurt_audio,
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
  };
};

export const submitAnswer = async (
  playerId: number,
  matchId: string,
  challengeId: number,
  answer: string[],
): Promise<PvpDailySubmitAnswerResult> => {
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

    opponent.character_health = Math.max(
      0,
      opponent.character_health - attacker.attack_damage,
    );

    await maybeProgressRoundOrFinish(match);
    if (match.status === "active") {
      await persistMatchProgress(match);
    }

    if (match.status === "active") {
      emitMatchStateToPlayers(match, "pvp:match-update");
    }

    return buildSubmitLikeResponse(match, playerId, "correct_and_first", true);
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
