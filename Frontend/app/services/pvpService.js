import { apiService } from './api';
import { gameService } from './gameService';

const normalizeMatchStatus = (payload = {}) => {
  const data = payload?.data || payload || {};
  const statusField = data.status;
  const status =
    statusField && typeof statusField === 'object'
      ? statusField
      : payload?.status && typeof payload.status === 'object'
        ? payload.status
        : {};

  const statusValue =
    typeof statusField === 'string'
      ? statusField
      : typeof status.status === 'string'
        ? status.status
        : 'idle';

  const selectedTopicRaw =
    status.selected_topic ??
    status.selectedTopic ??
    data.selected_topic ??
    data.selectedTopic ??
    null;

  const matchIdRaw =
    data.match_id ??
    data.matchId ??
    status.match_id ??
    status.matchId ??
    null;

  const matchFoundValue =
    data.match_found ??
    data.matchFound ??
    status.match_found ??
    status.matchFound ??
    null;

  const matchId =
    matchIdRaw === null || matchIdRaw === undefined || matchIdRaw === ''
      ? null
      : String(matchIdRaw);

  const selectedTopic =
    selectedTopicRaw === null || selectedTopicRaw === undefined || selectedTopicRaw === ''
      ? null
      : String(selectedTopicRaw);

  return {
    status: statusValue || 'idle',
    selectedTopic,
    matchId,
    matchFound:
      typeof matchFoundValue === 'boolean' ? matchFoundValue : Boolean(matchId),
    updatedAt:
      status.updated_at ??
      status.updatedAt ??
      data.updated_at ??
      data.updatedAt ??
      null,
  };
};

const normalizePreview = (payload = {}) => {
  const data = payload?.data || payload || {};
  const topicsCoveredRaw =
    data.preview_task?.topics_covered ?? data.preview_task?.topicsCovered ?? [];
  const topicsCovered = Array.isArray(topicsCoveredRaw)
    ? topicsCoveredRaw
        .map((topic) => (topic === null || topic === undefined ? '' : String(topic).trim()))
        .filter(Boolean)
    : [];

  return {
    dailySeed: data.daily_seed || null,
    previewTask: {
      title: data.preview_task?.title || 'Daily PvP Challenge',
      description: data.preview_task?.description || 'Queue up and race an opponent in the daily challenge.',
      topicsCovered,
      difficulty: data.preview_task?.difficulty || 'unknown',
    },
    status: normalizeMatchStatus(data),
  };
};

const resolveChallengeId = (challenge) => {
  if (!challenge || typeof challenge !== 'object') {
    return null;
  }

  const rawId = challenge.challenge_id ?? challenge.challengeId ?? challenge.id ?? null;
  if (rawId === null || rawId === undefined || rawId === '') {
    return null;
  }

  return String(rawId);
};

const normalizeMatchPayload = (payload = {}) => {
  const root = { ...(payload || {}) };
  const data = { ...(payload?.data || payload || {}) };

  const currentChallengeId = resolveChallengeId(data.currentChallenge);

  // Fallback when currentChallenge is missing OR has no usable ID.
  if (
    (!data.currentChallenge || !currentChallengeId) &&
    data.nextChallenge
  ) {
    data.currentChallenge = data.nextChallenge;
  }

  const normalizedCurrentChallengeId = resolveChallengeId(data.currentChallenge);
  if (data.currentChallenge && normalizedCurrentChallengeId) {
    data.currentChallenge = {
      ...data.currentChallenge,
      id: normalizedCurrentChallengeId,
    };
  }

  const normalizedNextChallengeId = resolveChallengeId(data.nextChallenge);
  if (data.nextChallenge && normalizedNextChallengeId) {
    data.nextChallenge = {
      ...data.nextChallenge,
      id: normalizedNextChallengeId,
    };
  }

  if (typeof data.isCorrect === 'undefined' && typeof data.is_correct === 'boolean') {
    data.isCorrect = data.is_correct;
  }

  if (
    typeof data.acceptedForAttack === 'undefined' &&
    typeof data.accepted_for_attack === 'boolean'
  ) {
    data.acceptedForAttack = data.accepted_for_attack;
  }

  root.data = data;
  return root;
};

const normalizeAuthoritativeMatchStatePayload = (payload = {}) => {
  // Keep authoritative match-state payload as close to server response as possible.
  return normalizeMatchPayload(payload);
};

const hasAuthoritativeSubmissionData = (data = {}) => {
  return Boolean(
    data.fightResult ||
      typeof data.isCorrect === 'boolean' ||
      typeof data.is_correct === 'boolean' ||
      typeof data.acceptedForAttack === 'boolean' ||
      typeof data.accepted_for_attack === 'boolean' ||
      typeof data.reason === 'string' ||
      typeof data.message === 'string'
  );
};

const mergeAuthoritativeCombatState = (displayState, combatState, rawData = {}) => {
  if (!displayState) {
    return combatState;
  }

  if (!combatState) {
    return displayState;
  }

  const fightResult = combatState?.submissionResult?.fightResult || rawData?.fightResult || null;
  const fightCharacter = fightResult?.character || {};
  const fightEnemy = fightResult?.enemy || {};

  const hasSubmissionData = hasAuthoritativeSubmissionData(rawData);
  const submissionResult = hasSubmissionData ? (combatState.submissionResult || null) : null;

  // Keep explicit null values from the server; only fallback when a key is truly missing.
  const pick = (value, fallback) => (value !== undefined ? value : fallback);

  return {
    ...displayState,
    submissionResult,
    selectedCharacter: {
      ...(displayState.selectedCharacter || {}),
      ...(combatState.selectedCharacter || {}),
      player_id:
        pick(fightCharacter.player_id, combatState?.selectedCharacter?.player_id) ??
        rawData?.character?.player_id ??
        displayState?.selectedCharacter?.player_id,
      player_name:
        pick(fightCharacter.player_name, combatState?.selectedCharacter?.player_name) ??
        rawData?.character?.player_name ??
        displayState?.selectedCharacter?.player_name,
      player_username:
        pick(fightCharacter.player_username, combatState?.selectedCharacter?.player_username) ??
        rawData?.character?.player_username ??
        displayState?.selectedCharacter?.player_username,
      player_avatar:
        pick(fightCharacter.player_avatar, combatState?.selectedCharacter?.player_avatar) ??
        rawData?.character?.player_avatar ??
        displayState?.selectedCharacter?.player_avatar,
      player_rank_name:
        pick(fightCharacter.player_rank_name, combatState?.selectedCharacter?.player_rank_name) ??
        rawData?.character?.player_rank_name ??
        displayState?.selectedCharacter?.player_rank_name ??
        null,
      character_id:
        pick(fightCharacter.character_id, combatState?.selectedCharacter?.character_id) ??
        displayState?.selectedCharacter?.character_id,
      character_name:
        pick(fightCharacter.character_name, combatState?.selectedCharacter?.character_name) ??
        displayState?.selectedCharacter?.character_name,
      character_idle:
        pick(fightCharacter.character_idle, combatState?.selectedCharacter?.character_idle) ??
        displayState?.selectedCharacter?.character_idle,
      character_run:
        pick(fightCharacter.character_run, combatState?.selectedCharacter?.character_run) ??
        displayState?.selectedCharacter?.character_run,
      character_attack_type:
        pick(fightCharacter.character_attack_type, combatState?.selectedCharacter?.character_attack_type) ??
        displayState?.selectedCharacter?.character_attack_type,
      character_attack:
        pick(fightCharacter.character_attack, combatState?.selectedCharacter?.character_attack) ??
        displayState?.selectedCharacter?.character_attack,
      character_range_attack:
        pick(
          fightCharacter.character_range_attack,
          combatState?.selectedCharacter?.character_range_attack
        ) ?? displayState?.selectedCharacter?.character_range_attack,
      character_hurt:
        pick(fightCharacter.character_hurt, combatState?.selectedCharacter?.character_hurt) ??
        displayState?.selectedCharacter?.character_hurt,
      character_dies:
        pick(fightCharacter.character_dies, combatState?.selectedCharacter?.character_dies) ??
        displayState?.selectedCharacter?.character_dies,
      character_damage:
        pick(fightCharacter.character_damage, combatState?.selectedCharacter?.character_damage) ??
        displayState?.selectedCharacter?.character_damage,
      character_is_range:
        pick(fightCharacter.character_is_range, combatState?.selectedCharacter?.character_is_range) ??
        displayState?.selectedCharacter?.character_is_range,
      current_health:
        fightCharacter.character_health ??
        combatState?.selectedCharacter?.current_health ??
        displayState?.selectedCharacter?.current_health,
      max_health:
        fightCharacter.character_max_health ??
        combatState?.selectedCharacter?.max_health ??
        displayState?.selectedCharacter?.max_health,
      character_max_health:
        fightCharacter.character_max_health ??
        combatState?.selectedCharacter?.character_max_health ??
        displayState?.selectedCharacter?.character_max_health,
      character_current_state:
        fightCharacter.character_current_state ??
        combatState?.selectedCharacter?.character_current_state ??
        displayState?.selectedCharacter?.character_current_state,
      character_attack_overlay:
        fightCharacter.character_attack_overlay ??
        combatState?.selectedCharacter?.character_attack_overlay ??
        displayState?.selectedCharacter?.character_attack_overlay,
      special_skill:
        fightCharacter.special_skill ||
        combatState?.selectedCharacter?.special_skill ||
        displayState?.selectedCharacter?.special_skill,
      character_reaction:
        pick(fightCharacter.character_reaction, combatState?.selectedCharacter?.character_reaction) ??
        displayState?.selectedCharacter?.character_reaction,
      character_avatar:
        fightCharacter.character_avatar ||
        combatState?.selectedCharacter?.character_avatar ||
        displayState?.selectedCharacter?.character_avatar,
    },
    enemy: {
      ...(displayState.enemy || {}),
      ...(combatState.enemy || {}),
      player_id:
        pick(fightEnemy.player_id, combatState?.enemy?.player_id) ??
        rawData?.enemy?.player_id ??
        displayState?.enemy?.player_id,
      player_name:
        pick(fightEnemy.player_name, combatState?.enemy?.player_name) ??
        rawData?.enemy?.player_name ??
        displayState?.enemy?.player_name,
      player_username:
        pick(fightEnemy.player_username, combatState?.enemy?.player_username) ??
        rawData?.enemy?.player_username ??
        displayState?.enemy?.player_username,
      player_avatar:
        pick(fightEnemy.player_avatar, combatState?.enemy?.player_avatar) ??
        rawData?.enemy?.player_avatar ??
        displayState?.enemy?.player_avatar,
      player_rank_name:
        pick(fightEnemy.player_rank_name, combatState?.enemy?.player_rank_name) ??
        rawData?.enemy?.player_rank_name ??
        displayState?.enemy?.player_rank_name ??
        null,
      enemy_id:
        pick(fightEnemy.enemy_id, combatState?.enemy?.enemy_id) ?? displayState?.enemy?.enemy_id,
      enemy_name:
        pick(fightEnemy.enemy_name, combatState?.enemy?.enemy_name) ?? displayState?.enemy?.enemy_name,
      enemy_idle:
        pick(fightEnemy.enemy_idle, combatState?.enemy?.enemy_idle) ?? displayState?.enemy?.enemy_idle,
      enemy_run:
        pick(fightEnemy.enemy_run, combatState?.enemy?.enemy_run) ?? displayState?.enemy?.enemy_run,
      enemy_attack:
        pick(fightEnemy.enemy_attack, combatState?.enemy?.enemy_attack) ??
        displayState?.enemy?.enemy_attack,
      enemy_range_attack:
        pick(fightEnemy.enemy_range_attack, combatState?.enemy?.enemy_range_attack) ??
        displayState?.enemy?.enemy_range_attack,
      enemy_is_range_attack:
        pick(fightEnemy.enemy_is_range_attack, combatState?.enemy?.enemy_is_range_attack) ??
        displayState?.enemy?.enemy_is_range_attack,
      enemy_hurt:
        pick(fightEnemy.enemy_hurt, combatState?.enemy?.enemy_hurt) ?? displayState?.enemy?.enemy_hurt,
      enemy_dies:
        pick(fightEnemy.enemy_dies, combatState?.enemy?.enemy_dies) ?? displayState?.enemy?.enemy_dies,
      enemy_damage:
        pick(fightEnemy.enemy_damage, combatState?.enemy?.enemy_damage) ??
        displayState?.enemy?.enemy_damage,
      enemy_health:
        fightEnemy.enemy_health ??
        combatState?.enemy?.enemy_health ??
        displayState?.enemy?.enemy_health,
      enemy_max_health:
        fightEnemy.enemy_max_health ??
        combatState?.enemy?.enemy_max_health ??
        displayState?.enemy?.enemy_max_health,
      enemy_current_state:
        fightEnemy.enemy_current_state ??
        combatState?.enemy?.enemy_current_state ??
        displayState?.enemy?.enemy_current_state,
      enemy_attack_overlay:
        fightEnemy.enemy_attack_overlay ??
        combatState?.enemy?.enemy_attack_overlay ??
        displayState?.enemy?.enemy_attack_overlay,
      enemy_attack_type:
        fightEnemy.enemy_attack_type ??
        combatState?.enemy?.enemy_attack_type ??
        displayState?.enemy?.enemy_attack_type,
      special_skill:
        fightEnemy.special_skill ||
        combatState?.enemy?.special_skill ||
        displayState?.enemy?.special_skill,
      enemy_reaction:
        pick(fightEnemy.enemy_reaction, combatState?.enemy?.enemy_reaction) ??
        displayState?.enemy?.enemy_reaction,
      enemy_avatar:
        fightEnemy.enemy_avatar ||
        combatState?.enemy?.enemy_avatar ||
        displayState?.enemy?.enemy_avatar,
    },
    avatar: {
      ...(displayState.avatar || {}),
      ...(combatState.avatar || {}),
      player:
        fightCharacter.character_avatar ||
        combatState?.avatar?.player ||
        displayState?.avatar?.player ||
        null,
      enemy:
        fightEnemy.enemy_avatar || combatState?.avatar?.enemy || displayState?.avatar?.enemy || null,
    },
    energy: fightResult?.energy ?? combatState?.energy ?? displayState?.energy,
    timeToNextEnergyRestore:
      fightResult?.timeToNextEnergyRestore ??
      combatState?.timeToNextEnergyRestore ??
      displayState?.timeToNextEnergyRestore,
    combat_background: combatState?.combat_background || displayState?.combat_background || null,
    gameplay_audio: combatState?.gameplay_audio || displayState?.gameplay_audio || null,
    card: displayState?.card || combatState?.card || null,
  };
};

export const pvpService = {
  getDailyMatchPreview: async () => {
    const response = await apiService.get('/game/pvp/daily/match/preview');
    if (!response?.success) {
      throw new Error(response?.message || 'Failed to load daily PvP preview');
    }
    return normalizePreview(response);
  },

  playDailyMatch: async () => {
    const response = await apiService.post('/game/pvp/daily/match/play', {});
    if (!response?.success) {
      throw new Error(response?.message || 'Failed to start matchmaking');
    }

    return {
      status: normalizeMatchStatus(response),
      raw: response,
    };
  },

  setDailyMatchTopic: async (topic) => {
    const normalizedTopic = typeof topic === 'string' ? topic.trim() : '';

    if (!normalizedTopic) {
      throw new Error('Topic is required');
    }

    const response = await apiService.post('/game/pvp/daily/match/topic', {
      topic: normalizedTopic,
    });

    if (!response?.success) {
      throw new Error(response?.message || 'Failed to set PvP topic');
    }

    return {
      status: normalizeMatchStatus(response),
      raw: response,
    };
  },

  getDailyMatchStatus: async () => {
    const response = await apiService.get('/game/pvp/daily/match/status');
    if (!response?.success) {
      throw new Error(response?.message || 'Failed to load match status');
    }

    return {
      status: normalizeMatchStatus(response),
      raw: response,
    };
  },

  cancelDailyMatch: async () => {
    let response = null;

    try {
      response = await apiService.post('/game/pvp/daily/cancel', {});
    } catch (primaryError) {
      response = await apiService.post('/game/pvp/daily/match/cancel', {});
    }

    if (!response?.success) {
      throw new Error(response?.message || 'Failed to cancel matchmaking');
    }

    return {
      status: normalizeMatchStatus(response),
      raw: response,
    };
  },

  getDailyMatchState: async (matchId) => {
    const response = await apiService.get(`/game/pvp/daily/match/${matchId}`);
    if (!response?.success) {
      throw new Error(response?.message || 'Failed to load match state');
    }

    return normalizeAuthoritativeMatchStatePayload(response);
  },

  getDailyMatchHistory: async () => {
    const response = await apiService.get('/game/pvp/daily/match/history');
    if (!response?.success) {
      throw new Error(response?.message || 'Failed to load match history');
    }

    return Array.isArray(response?.data) ? response.data : [];
  },

  getRankTiers: async () => {
    const response = await apiService.get('/game/pvp/rank-tiers');
    if (!response?.success) {
      throw new Error(response?.message || 'Failed to load rank tiers');
    }

    return Array.isArray(response?.data) ? response.data : [];
  },

  submitDailyMatchAnswer: async (matchId, challengeId, selectedAnswers) => {
    const response = await apiService.post(
      `/game/pvp/daily/match/submit-answer/${matchId}/${challengeId}`,
      {
        answer: selectedAnswers,
      }
    );

    if (!response?.success) {
      throw new Error(response?.message || 'Failed to submit PvP answer');
    }

    return normalizeMatchPayload(response);
  },

  surrenderDailyMatch: async (matchId) => {
    const normalizedMatchId =
      matchId === null || matchId === undefined || matchId === ''
        ? null
        : String(matchId);

    if (!normalizedMatchId) {
      throw new Error('Missing match ID');
    }

    const response = await apiService.post(
      `/game/pvp/daily/match/${normalizedMatchId}/surrender`,
      {}
    );

    if (!response?.success) {
      throw new Error(response?.message || 'Failed to surrender PvP match');
    }

    return normalizeMatchPayload(response);
  },

  sendDailyMatchMessage: async (matchId, message) => {
    const normalizedMatchId =
      matchId === null || matchId === undefined || matchId === ''
        ? null
        : String(matchId);
    const normalizedMessage = typeof message === 'string' ? message.trim() : '';

    if (!normalizedMatchId) {
      throw new Error('Missing match ID');
    }

    if (!normalizedMessage) {
      throw new Error('Message is required');
    }

    const response = await apiService.post(
      `/game/pvp/daily/match/${normalizedMatchId}/message`,
      {
        message: normalizedMessage,
      }
    );

    if (!response?.success) {
      throw new Error(response?.message || 'Failed to send PvP message');
    }

    return {
      ...response,
      data: {
        ...(response?.data || {}),
        match_id: response?.data?.match_id || normalizedMatchId,
        character_reaction:
          response?.data?.character_reaction ?? response?.data?.characterReaction ?? null,
        enemy_reaction:
          response?.data?.enemy_reaction ?? response?.data?.enemyReaction ?? null,
      },
    };
  },

  extractUnifiedGameState: (payload, isSubmission = false) => {
    const normalized = normalizeMatchPayload(payload);
    return gameService.extractUnifiedGameState(normalized, isSubmission);
  },

  extractAuthoritativeMatchState: (payload) => {
    const normalized = normalizeAuthoritativeMatchStatePayload(payload);
    const normalizedData = normalized?.data || {};

    const displayState = gameService.extractUnifiedGameState(normalized, false);
    const combatState = gameService.extractUnifiedGameState(normalized, true);
    const nextChallenge = normalizedData.nextChallenge
      ? {
          ...normalizedData.nextChallenge,
          id: resolveChallengeId(normalizedData.nextChallenge),
        }
      : null;

    return {
      ...mergeAuthoritativeCombatState(displayState, combatState, normalizedData),
      nextChallenge,
      nextChallengeData: nextChallenge,
    };
  },

  normalizeMatchStatus,
};

export default pvpService;
