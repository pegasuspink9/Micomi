import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pvpService } from '../services/pvpService';

const PVP_ACTIVE_MATCH_ID_KEY = 'pvp_active_match_id';

export const usePvpMatchmaking = () => {
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState({
    status: 'idle',
    selectedTopic: null,
    matchId: null,
    matchFound: false,
    updatedAt: null,
  });
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [settingTopic, setSettingTopic] = useState(false);
  const [startingMatch, setStartingMatch] = useState(false);
  const [findingMatch, setFindingMatch] = useState(false);
  const [matchedMatchId, setMatchedMatchId] = useState(null);
  const [error, setError] = useState(null);

  const statusPollRef = useRef(null);
  const hasStartedSearchRef = useRef(false);

  const persistActiveMatchId = useCallback(async (nextMatchId) => {
    if (!nextMatchId) return;

    try {
      await AsyncStorage.setItem(PVP_ACTIVE_MATCH_ID_KEY, String(nextMatchId));
    } catch (storageError) {
      console.warn('Failed to persist PvP match id:', storageError);
    }
  }, []);

  const readActiveMatchId = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(PVP_ACTIVE_MATCH_ID_KEY);
      return stored || null;
    } catch (storageError) {
      console.warn('Failed to read PvP match id:', storageError);
      return null;
    }
  }, []);

  const clearActiveMatchId = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(PVP_ACTIVE_MATCH_ID_KEY);
    } catch (storageError) {
      console.warn('Failed to clear PvP match id:', storageError);
    }
  }, []);

  const stopStatusPolling = useCallback(() => {
    if (statusPollRef.current) {
      clearInterval(statusPollRef.current);
      statusPollRef.current = null;
    }
  }, []);

  const applyStatus = useCallback((nextStatus, options = {}) => {
    const { allowAutoMatch = true } = options;
    if (!nextStatus) return;

    if (nextStatus.matchId) {
      persistActiveMatchId(nextStatus.matchId);
    }

    setStatus(nextStatus);

    if (allowAutoMatch && nextStatus.matchFound && nextStatus.matchId) {
      setMatchedMatchId(nextStatus.matchId);
      setFindingMatch(false);
      stopStatusPolling();
      return;
    }

    if (nextStatus.status !== 'finding_match') {
      setFindingMatch(false);
      stopStatusPolling();
    }
  }, [persistActiveMatchId, stopStatusPolling]);

  const hydrateResumableMatchFromStorage = useCallback(async () => {
    const storedMatchId = await readActiveMatchId();
    if (!storedMatchId) {
      return null;
    }

    try {
      const payload = await pvpService.getDailyMatchState(storedMatchId);
      const unifiedState = pvpService.extractAuthoritativeMatchState(payload);

      const fightStatus = unifiedState?.submissionResult?.fightResult?.status || null;
      const hasChallenge = Boolean(unifiedState?.currentChallenge?.id);
      const isFinished = fightStatus === 'won' || fightStatus === 'lost';

      if (hasChallenge && !isFinished) {
        const resumeStatus = {
          status: 'in_progress',
          selectedTopic: unifiedState?.currentChallenge?.topic || null,
          matchId: storedMatchId,
          matchFound: true,
          updatedAt: Date.now(),
        };

        applyStatus(resumeStatus, { allowAutoMatch: false });
        return resumeStatus;
      }

      await clearActiveMatchId();
      return null;
    } catch (resumeError) {
      console.warn('Stored PvP match id is not resumable:', resumeError?.message || resumeError);
      return null;
    }
  }, [applyStatus, clearActiveMatchId, readActiveMatchId]);

  const pollStatus = useCallback(async () => {
    try {
      const response = await pvpService.getDailyMatchStatus();
      applyStatus(response.status);
    } catch (pollError) {
      console.error('Failed to poll PvP status:', pollError);
      setError(pollError.message || 'Failed to check match status');
    }
  }, [applyStatus]);

  const beginStatusPolling = useCallback(() => {
    stopStatusPolling();
    statusPollRef.current = setInterval(() => {
      pollStatus();
    }, 1500);
  }, [pollStatus, stopStatusPolling]);

  const loadPreview = useCallback(async () => {
    try {
      // Preview should only display data and never auto-match or navigate.
      stopStatusPolling();
      setFindingMatch(false);
      setMatchedMatchId(null);
      hasStartedSearchRef.current = false;

      setLoadingPreview(true);
      setError(null);
      const response = await pvpService.getDailyMatchPreview();
      setPreview(response);

      let latestStatus = response?.status || null;
      try {
        const statusResponse = await pvpService.getDailyMatchStatus();
        if (statusResponse?.status) {
          latestStatus = statusResponse.status;
        }
      } catch (statusError) {
        console.warn('Failed to refresh latest PvP status during preview load:', statusError?.message || statusError);
      }

      if (latestStatus) {
        applyStatus(latestStatus, { allowAutoMatch: false });
      }

      if (!latestStatus?.matchId) {
        await hydrateResumableMatchFromStorage();
      }

      return {
        ...response,
        status: latestStatus || response?.status || null,
      };
    } catch (previewError) {
      setError(previewError.message || 'Failed to load PvP preview');
      throw previewError;
    } finally {
      setLoadingPreview(false);
    }
  }, [applyStatus, hydrateResumableMatchFromStorage, stopStatusPolling]);

  const setMatchTopic = useCallback(async (topic) => {
    const normalizedTopic = typeof topic === 'string' ? topic.trim() : '';

    if (!normalizedTopic) {
      const topicError = 'Please choose a topic first';
      setError(topicError);
      throw new Error(topicError);
    }

    try {
      setSettingTopic(true);
      setError(null);
      hasStartedSearchRef.current = false;
      stopStatusPolling();
      setFindingMatch(false);
      setMatchedMatchId(null);

      const response = await pvpService.setDailyMatchTopic(normalizedTopic);
      applyStatus(response.status, { allowAutoMatch: false });

      setPreview((prev) => {
        if (!prev) {
          return prev;
        }

        const existingTopics = Array.isArray(prev?.previewTask?.topicsCovered)
          ? prev.previewTask.topicsCovered
          : [];

        const nextTopics = existingTopics.includes(normalizedTopic)
          ? existingTopics
          : [...existingTopics, normalizedTopic];

        return {
          ...prev,
          previewTask: {
            ...(prev.previewTask || {}),
            topicsCovered: nextTopics,
          },
          status: response.status,
        };
      });

      return response.status;
    } catch (topicError) {
      setError(topicError.message || 'Failed to set PvP topic');
      throw topicError;
    } finally {
      setSettingTopic(false);
    }
  }, [applyStatus, stopStatusPolling]);

  const startMatchmaking = useCallback(async (selectedTopicOverride = null) => {
    const selectedTopic =
      typeof selectedTopicOverride === 'string' && selectedTopicOverride.trim()
        ? selectedTopicOverride.trim()
        : status?.selectedTopic;

    if (!selectedTopic) {
      const topicError = 'Please choose a topic first';
      setError(topicError);
      throw new Error(topicError);
    }

    try {
      setStartingMatch(true);
      setError(null);
      setMatchedMatchId(null);
      hasStartedSearchRef.current = true;

      const response = await pvpService.playDailyMatch();
      const nextStatus = response?.status?.selectedTopic
        ? response.status
        : {
            ...response.status,
            selectedTopic,
          };

      applyStatus(nextStatus);

      if (nextStatus.status === 'finding_match' && !nextStatus.matchFound) {
        setFindingMatch(true);
        beginStatusPolling();
      }

      return nextStatus;
    } catch (playError) {
      setError(playError.message || 'Failed to start matchmaking');
      throw playError;
    } finally {
      setStartingMatch(false);
    }
  }, [applyStatus, beginStatusPolling, status?.selectedTopic]);

  const cancelMatchmaking = useCallback(async ({ silent = false } = {}) => {
    try {
      hasStartedSearchRef.current = false;
      stopStatusPolling();
      setFindingMatch(false);

      const response = await pvpService.cancelDailyMatch();
      applyStatus(response.status, { allowAutoMatch: false });

      if (!response?.status?.matchId) {
        await clearActiveMatchId();
      }

      return response.status;
    } catch (cancelError) {
      if (!silent) {
        setError(cancelError.message || 'Failed to cancel matchmaking');
      }
      throw cancelError;
    }
  }, [applyStatus, clearActiveMatchId, stopStatusPolling]);

  const clearMatchReadyState = useCallback(() => {
    setMatchedMatchId(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      stopStatusPolling();
    };
  }, [stopStatusPolling]);

  return {
    preview,
    status,
    loadingPreview,
    settingTopic,
    startingMatch,
    findingMatch,
    matchedMatchId,
    error,
    loadPreview,
    setMatchTopic,
    startMatchmaking,
    cancelMatchmaking,
    clearMatchReadyState,
    clearError,
  };
};

export default usePvpMatchmaking;
