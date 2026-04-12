import { apiService } from './api';
import { gameService } from './gameService';

const normalizeMatchStatus = (payload = {}) => {
  const data = payload?.data || payload || {};
  const status = data.status || {};
  const matchId = data.match_id || status.match_id || null;

  return {
    status: status.status || 'idle',
    matchId,
    matchFound: Boolean(data.match_found || matchId),
    updatedAt: status.updated_at || null,
  };
};

const normalizePreview = (payload = {}) => {
  const data = payload?.data || payload || {};

  return {
    dailySeed: data.daily_seed || null,
    previewTask: {
      title: data.preview_task?.title || 'Daily PvP Challenge',
      description: data.preview_task?.description || 'Queue up and race an opponent in the daily challenge.',
      topicsCovered: data.preview_task?.topics_covered || [],
      difficulty: data.preview_task?.difficulty || 'unknown',
    },
    status: normalizeMatchStatus(data),
  };
};

const normalizeMatchPayload = (payload = {}) => {
  const root = { ...(payload || {}) };
  const data = { ...(payload?.data || payload || {}) };

  // Match status APIs may return nextChallenge instead of currentChallenge after a resolved round.
  if (!data.currentChallenge && data.nextChallenge) {
    data.currentChallenge = data.nextChallenge;
  }

  if (!data.nextChallenge && data.currentChallenge) {
    data.nextChallenge = data.currentChallenge;
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

    return normalizeMatchPayload(response);
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

  extractUnifiedGameState: (payload, isSubmission = false) => {
    const normalized = normalizeMatchPayload(payload);
    return gameService.extractUnifiedGameState(normalized, isSubmission);
  },

  normalizeMatchStatus,
};

export default pvpService;
