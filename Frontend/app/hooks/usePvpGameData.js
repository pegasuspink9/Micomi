import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pvpService } from '../services/pvpService';

const PVP_MATCH_CACHE_PREFIX = 'pvp_match_cache:';
const PVP_ACTIVE_MATCH_ID_KEY = 'pvp_active_match_id';
const AUTO_PROCEED_SECONDS = 5;

const makeDefaultLiveSync = () => ({
  connection: 'idle',
  isPolling: false,
  lastSyncedAt: null,
  pendingRemoteProceed: false,
});

const toStableValue = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
};

const buildSubmissionSignature = (submission) => {
  if (!submission) {
    return 'none';
  }

  const fightResult = submission.fightResult || {};
  const character = fightResult.character || {};
  const enemy = fightResult.enemy || {};

  return [
    toStableValue(submission.reason),
    toStableValue(submission.acceptedForAttack ?? submission.accepted_for_attack),
    toStableValue(submission.isCorrect),
    toStableValue(submission.message),
    toStableValue(fightResult.status),
    toStableValue(character.character_health),
    toStableValue(character.character_current_state),
    toStableValue(enemy.enemy_health),
    toStableValue(enemy.enemy_current_state),
  ].join('|');
};

const buildSyncStateSignature = (state) => {
  if (!state) {
    return 'none';
  }

  return [
    toStableValue(state.currentChallenge?.id),
    toStableValue(state.nextChallengeData?.id),
    toStableValue(state.selectedCharacter?.current_health ?? state.selectedCharacter?.character_health),
    toStableValue(state.enemy?.enemy_health),
    toStableValue(state.card?.character_attack_card),
    buildSubmissionSignature(state.submissionResult),
  ].join('||');
};

export const usePvpGameData = (matchId, options = {}) => {
  const { disabled = false } = options;

  const [activeMatchId, setActiveMatchId] = useState(matchId || null);
  const activeMatchIdRef = useRef(matchId || null);

  const [gameState, setGameState] = useState({
    level: {},
    enemy: {},
    selectedCharacter: {},
    currentChallenge: null,
    submissionResult: null,
    attemptId: 0,
    nextChallengeData: null,
  });

  const [loading, setLoading] = useState(!disabled);
  const [animationsLoading, setAnimationsLoading] = useState(!disabled);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [waitingForAnimation, setWaitingForAnimation] = useState(false);
  const [canProceed, setCanProceed] = useState(false);
  const [autoProceedCountdown, setAutoProceedCountdown] = useState(null);

  const [potions] = useState([]);
  const [selectedPotion] = useState(null);
  const [loadingPotions] = useState(false);
  const [usingPotion] = useState(false);

  const [downloadProgress] = useState({ loaded: 0, total: 0, progress: 0, currentUrl: '' });
  const [individualAnimationProgress] = useState({ url: '', progress: 0 });

  const [liveSync, setLiveSync] = useState(makeDefaultLiveSync());

  const pendingSubmissionRef = useRef(null);
  const animationTimeoutRef = useRef(null);
  const lastProcessedSubmissionRef = useRef(null);
  const matchPollRef = useRef(null);
  const autoProceedTimeoutRef = useRef(null);
  const autoProceedIntervalRef = useRef(null);

  const currentChallengeIdRef = useRef(null);
  const canProceedRef = useRef(false);
  const waitingRef = useRef(false);

  useEffect(() => {
    canProceedRef.current = canProceed;
  }, [canProceed]);

  useEffect(() => {
    waitingRef.current = waitingForAnimation;
  }, [waitingForAnimation]);

  useEffect(() => {
    if (!matchId) return;

    const normalizedMatchId = String(matchId);
    activeMatchIdRef.current = normalizedMatchId;
    setActiveMatchId((prev) => (prev === normalizedMatchId ? prev : normalizedMatchId));
  }, [matchId]);

  const stopPolling = useCallback(() => {
    if (matchPollRef.current) {
      clearInterval(matchPollRef.current);
      matchPollRef.current = null;
    }
  }, []);

  const stopAutoProceed = useCallback(() => {
    if (autoProceedTimeoutRef.current) {
      clearTimeout(autoProceedTimeoutRef.current);
      autoProceedTimeoutRef.current = null;
    }

    if (autoProceedIntervalRef.current) {
      clearInterval(autoProceedIntervalRef.current);
      autoProceedIntervalRef.current = null;
    }

    setAutoProceedCountdown(null);
  }, []);

  const getCacheKeyForMatch = useCallback((targetMatchId) => {
    if (!targetMatchId) return null;
    return `${PVP_MATCH_CACHE_PREFIX}${targetMatchId}`;
  }, []);

  const readStoredMatchId = useCallback(async () => {
    try {
      const storedMatchId = await AsyncStorage.getItem(PVP_ACTIVE_MATCH_ID_KEY);
      return storedMatchId || null;
    } catch (storageError) {
      console.warn('Failed to read active PvP match id:', storageError);
      return null;
    }
  }, []);

  const setResolvedMatchId = useCallback(async (nextMatchId) => {
    if (!nextMatchId) return null;

    const normalizedMatchId = String(nextMatchId);
    activeMatchIdRef.current = normalizedMatchId;
    setActiveMatchId((prev) => (prev === normalizedMatchId ? prev : normalizedMatchId));

    try {
      await AsyncStorage.setItem(PVP_ACTIVE_MATCH_ID_KEY, normalizedMatchId);
    } catch (storageError) {
      console.warn('Failed to persist active PvP match id:', storageError);
    }

    return normalizedMatchId;
  }, []);

  const resolveLatestMatchId = useCallback(async ({ forceRefresh = false } = {}) => {
    if (disabled) {
      return null;
    }

    if (!forceRefresh && activeMatchIdRef.current) {
      return activeMatchIdRef.current;
    }

    try {
      const statusResponse = await pvpService.getDailyMatchStatus();
      const statusMatchId = statusResponse?.status?.matchId || null;

      if (statusMatchId) {
        return await setResolvedMatchId(statusMatchId);
      }
    } catch (statusError) {
      console.warn('Failed to resolve latest match id from status:', statusError?.message || statusError);
    }

    if (activeMatchIdRef.current) {
      return activeMatchIdRef.current;
    }

    const storedMatchId = await readStoredMatchId();
    if (storedMatchId) {
      return await setResolvedMatchId(storedMatchId);
    }

    if (matchId) {
      return await setResolvedMatchId(matchId);
    }

    return null;
  }, [disabled, matchId, readStoredMatchId, setResolvedMatchId]);

  const toResponseDrivenState = useCallback((prevState, incomingState, overrides = {}) => {
    if (!incomingState) return prevState;

    return {
      ...incomingState,
      attemptId: prevState?.attemptId || incomingState?.attemptId || 0,
      currentChallenge: incomingState?.currentChallenge || prevState?.currentChallenge || null,
      card: incomingState?.card || prevState?.card || null,
      submissionResult:
        typeof overrides.submissionResult !== 'undefined'
          ? overrides.submissionResult
          : incomingState?.submissionResult ?? prevState?.submissionResult ?? null,
      nextChallengeData:
        typeof overrides.nextChallengeData !== 'undefined'
          ? overrides.nextChallengeData
          : prevState?.nextChallengeData || null,
    };
  }, []);

  const loadCachedMatchState = useCallback(async (targetMatchId) => {
    const resolvedCacheKey = getCacheKeyForMatch(targetMatchId || activeMatchIdRef.current);
    if (!resolvedCacheKey) return null;

    try {
      const serialized = await AsyncStorage.getItem(resolvedCacheKey);
      if (!serialized) return null;

      const parsed = JSON.parse(serialized);
      if (!parsed?.gameState || typeof parsed.gameState !== 'object') {
        return null;
      }

      return parsed.gameState;
    } catch (cacheError) {
      console.warn('Failed to read cached PvP match state:', cacheError);
      return null;
    }
  }, [getCacheKeyForMatch]);

  const persistMatchState = useCallback(async (nextState, targetMatchId) => {
    const resolvedCacheKey = getCacheKeyForMatch(targetMatchId || activeMatchIdRef.current);
    if (!resolvedCacheKey || !nextState) return;

    try {
      await AsyncStorage.setItem(
        resolvedCacheKey,
        JSON.stringify({
          savedAt: Date.now(),
          gameState: nextState,
        })
      );
    } catch (cacheError) {
      console.warn('Failed to cache PvP match state:', cacheError);
    }
  }, [getCacheKeyForMatch]);

  const setSyncConnected = useCallback((overrides = {}, options = {}) => {
    const { touch = false } = options;

    setLiveSync((prev) => {
      const nextPendingRemoteProceed =
        typeof overrides.pendingRemoteProceed === 'boolean'
          ? overrides.pendingRemoteProceed
          : prev.pendingRemoteProceed;

      const shouldUpdate =
        touch ||
        prev.connection !== 'connected' ||
        prev.isPolling !== false ||
        nextPendingRemoteProceed !== prev.pendingRemoteProceed;

      if (!shouldUpdate) {
        return prev;
      }

      return {
        ...prev,
        connection: 'connected',
        isPolling: false,
        pendingRemoteProceed: nextPendingRemoteProceed,
        lastSyncedAt: Date.now(),
      };
    });
  }, []);

  const setSyncReconnecting = useCallback(() => {
    setLiveSync((prev) => {
      if (prev.connection === 'reconnecting' && prev.isPolling === false) {
        return prev;
      }

      return {
        ...prev,
        connection: 'reconnecting',
        isPolling: false,
      };
    });
  }, []);

  const setGameStateIfChanged = useCallback((updater) => {
    setGameState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;

      if (!next || next === prev) {
        return prev;
      }

      if (buildSyncStateSignature(prev) === buildSyncStateSignature(next)) {
        return prev;
      }

      return next;
    });
  }, []);

  const fetchMatchState = useCallback(async ({ silent = false, resolvedMatchId = null } = {}) => {
    if (disabled) {
      setLoading(false);
      setAnimationsLoading(false);
      return null;
    }

    const latestMatchId = resolvedMatchId || (await resolveLatestMatchId({ forceRefresh: true }));

    if (!latestMatchId) {
      setLoading(false);
      setAnimationsLoading(false);
      setError('Missing match ID');
      return null;
    }

    try {
      if (!silent) {
        setLoading(true);
        setAnimationsLoading(true);
      }

      setError(null);
      await setResolvedMatchId(latestMatchId);
      const payload = await pvpService.getDailyMatchState(latestMatchId);
      const unifiedState = pvpService.extractUnifiedGameState(payload, false);

      if (!unifiedState) {
        throw new Error('Failed to parse PvP match data');
      }

      setGameStateIfChanged((prev) => {
        const nextState = toResponseDrivenState(prev, unifiedState, {
          submissionResult: unifiedState?.submissionResult ?? null,
          nextChallengeData: null,
        });

        currentChallengeIdRef.current = nextState.currentChallenge?.id || null;
        return nextState;
      });

      setCanProceed(false);
      setSyncConnected({ pendingRemoteProceed: false }, { touch: true });
      return unifiedState;
    } catch (fetchError) {
      setError(fetchError.message || 'Failed to load PvP match');
      setSyncReconnecting();
      return null;
    } finally {
      setLoading(false);
      setAnimationsLoading(false);
    }
  }, [
    disabled,
    resolveLatestMatchId,
    setGameStateIfChanged,
    setSyncReconnecting,
    setResolvedMatchId,
    setSyncConnected,
    toResponseDrivenState,
  ]);

  const handleAnimationComplete = useCallback(() => {
    setWaitingForAnimation(false);

    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }

    const pendingData = pendingSubmissionRef.current;
    if (!pendingData) return;

    const submission = pendingData.submissionResult || {};
    const reason = submission.reason;
    const fightStatus = submission.fightResult?.status;
    const nextChallenge = pendingData.currentChallenge;

    const submissionId = `${nextChallenge?.id || 'none'}-${fightStatus || 'na'}-${reason || 'none'}-${submission.acceptedForAttack ?? submission.accepted_for_attack ?? 'na'}`;
    if (lastProcessedSubmissionRef.current === submissionId) {
      pendingSubmissionRef.current = null;
      return;
    }

    const mergeBattleState = (prev) => ({
      ...prev,
      submissionResult: pendingData.submissionResult,
      selectedCharacter: pendingData.selectedCharacter || prev.selectedCharacter,
      enemy: pendingData.enemy || prev.enemy,
      avatar: pendingData.avatar || prev.avatar,
      level: pendingData.level || prev.level,
      card: pendingData.card || prev.card || null,
    });

    if (fightStatus === 'won' || fightStatus === 'lost') {
      setCanProceed(false);
      setGameState((prev) => ({
        ...mergeBattleState(prev),
        nextChallengeData: null,
      }));
      pendingSubmissionRef.current = null;
      lastProcessedSubmissionRef.current = submissionId;
      setSyncConnected({ pendingRemoteProceed: false });
      return;
    }

    if (reason === 'incorrect') {
      setCanProceed(false);
      setGameState((prev) => ({
        ...mergeBattleState(prev),
        nextChallengeData: null,
      }));
      pendingSubmissionRef.current = null;
      lastProcessedSubmissionRef.current = submissionId;
      return;
    }

    if (!nextChallenge?.id) {
      setCanProceed(false);
      setGameState((prev) => ({
        ...mergeBattleState(prev),
        nextChallengeData: null,
      }));
      pendingSubmissionRef.current = null;
      lastProcessedSubmissionRef.current = submissionId;
      return;
    }

    const shouldProceed =
      reason === 'correct_and_first' ||
      reason === 'round_already_resolved' ||
      submission.acceptedForAttack === true ||
      submission.accepted_for_attack === true ||
      submission.isCorrect === true;

    if (shouldProceed) {
      setCanProceed(true);
      setGameState((prev) => ({
        ...mergeBattleState(prev),
        nextChallengeData: {
          ...nextChallenge,
          card: pendingData.card || prev.card || null,
          selectedCharacter: pendingData.selectedCharacter || prev.selectedCharacter,
          enemy: pendingData.enemy || prev.enemy,
          avatar: pendingData.avatar || prev.avatar,
          level: pendingData.level || prev.level,
        },
      }));
      setSyncConnected({ pendingRemoteProceed: false });
    } else {
      setCanProceed(false);
      setGameState((prev) => ({
        ...mergeBattleState(prev),
        nextChallengeData: null,
      }));
    }

    pendingSubmissionRef.current = null;
    lastProcessedSubmissionRef.current = submissionId;
  }, [setSyncConnected]);

  const submitAnswer = useCallback(async (selectedAnswers) => {
    if (disabled) {
      return { success: false, error: 'PvP mode is disabled' };
    }

    if (!Array.isArray(selectedAnswers) || selectedAnswers.length === 0) {
      return { success: false, error: 'No answer selected' };
    }

    if (waitingRef.current) {
      return { success: false, error: 'Animation in progress' };
    }

    try {
      setSubmitting(true);
      setError(null);
      stopAutoProceed();
      setCanProceed(false);

      const latestMatchId = await resolveLatestMatchId({ forceRefresh: true });
      if (!latestMatchId) {
        throw new Error('Missing match ID');
      }

      await setResolvedMatchId(latestMatchId);

      const latestMatchPayload = await pvpService.getDailyMatchState(latestMatchId);
      const latestMatchState = pvpService.extractUnifiedGameState(latestMatchPayload, false);
      const latestChallengeId = latestMatchState?.currentChallenge?.id;

      if (!latestChallengeId) {
        throw new Error('Missing challenge ID');
      }

      currentChallengeIdRef.current = latestChallengeId;

      const payload = await pvpService.submitDailyMatchAnswer(
        latestMatchId,
        latestChallengeId,
        selectedAnswers
      );

      const updatedState = pvpService.extractUnifiedGameState(payload, true);
      if (!updatedState) {
        throw new Error('Failed to parse PvP submission response');
      }

      pendingSubmissionRef.current = updatedState;
      setWaitingForAnimation(true);

      setGameStateIfChanged((prev) => ({
        ...prev,
        submissionResult: updatedState.submissionResult,
        selectedCharacter: updatedState.selectedCharacter || prev.selectedCharacter,
        enemy: updatedState.enemy || prev.enemy,
        avatar: updatedState.avatar || prev.avatar,
        level: updatedState.level || prev.level,
        currentChallenge: updatedState.currentChallenge || prev.currentChallenge,
        card: updatedState.card || prev.card || null,
      }));

      animationTimeoutRef.current = setTimeout(() => {
        handleAnimationComplete();
      }, 5000);

      return {
        success: true,
        updatedGameState: updatedState,
        waitingForAnimation: true,
      };
    } catch (submitError) {
      setError(submitError.message || 'Failed to submit PvP answer');
      pendingSubmissionRef.current = null;
      setWaitingForAnimation(false);
      return { success: false, error: submitError.message || 'Failed to submit answer' };
    } finally {
      setSubmitting(false);
    }
  }, [
    disabled,
    handleAnimationComplete,
    resolveLatestMatchId,
    setGameStateIfChanged,
    setResolvedMatchId,
    stopAutoProceed,
  ]);

  const handleProceed = useCallback(() => {
    if (!canProceedRef.current) {
      return;
    }

    stopAutoProceed();
    setCanProceed(false);
    setSyncConnected({ pendingRemoteProceed: false }, { touch: true });

    setGameState((prev) => {
      const nextChallenge = prev.nextChallengeData;
      if (!nextChallenge) {
        return prev;
      }

      currentChallengeIdRef.current = nextChallenge.id;

      return {
        ...prev,
        currentChallenge: nextChallenge,
        card: nextChallenge.card || prev.card,
        selectedCharacter: nextChallenge.selectedCharacter || prev.selectedCharacter,
        enemy: nextChallenge.enemy || prev.enemy,
        avatar: nextChallenge.avatar || prev.avatar,
        level: nextChallenge.level || prev.level,
        attemptId: (prev.attemptId || 0) + 1,
        submissionResult: null,
        nextChallengeData: null,
      };
    });
  }, [setSyncConnected, stopAutoProceed]);

  const syncMatchState = useCallback(async () => {
    if (disabled) return;

    try {
      const resolvedMatchId =
        activeMatchIdRef.current || (await resolveLatestMatchId({ forceRefresh: false }));

      if (!resolvedMatchId) {
        setSyncReconnecting();
        return;
      }

      const payload = await pvpService.getDailyMatchState(resolvedMatchId);
      const normalized = pvpService.extractUnifiedGameState(payload, true);
      if (!normalized) return;

      await setResolvedMatchId(resolvedMatchId);
      setSyncConnected();

      const remoteChallengeId = normalized.currentChallenge?.id || null;
      const localChallengeId = currentChallengeIdRef.current;
      const remoteFightStatus = normalized.submissionResult?.fightResult?.status;

      // Keep local POST-response visuals stable while submission animation is running.
      if (waitingRef.current && remoteChallengeId && localChallengeId && remoteChallengeId === localChallengeId) {
        return;
      }

      if (
        (remoteFightStatus === 'won' || remoteFightStatus === 'lost') &&
        !waitingRef.current
      ) {
        stopAutoProceed();
        setCanProceed(false);
        setGameStateIfChanged((prev) => ({
          ...toResponseDrivenState(prev, normalized, {
            submissionResult: normalized.submissionResult || prev.submissionResult,
            nextChallengeData: null,
          }),
        }));
        currentChallengeIdRef.current = remoteChallengeId || localChallengeId;
        return;
      }

      if (!remoteChallengeId || !localChallengeId) {
        if (remoteChallengeId && !localChallengeId) {
          currentChallengeIdRef.current = remoteChallengeId;
          setGameStateIfChanged((prev) => ({
            ...toResponseDrivenState(prev, normalized, {
              submissionResult: normalized.submissionResult || prev.submissionResult,
            }),
          }));
        }
        return;
      }

      if (
        remoteChallengeId !== localChallengeId &&
        !canProceedRef.current &&
        !waitingRef.current
      ) {
        setCanProceed(true);
        setGameStateIfChanged((prev) => ({
          ...toResponseDrivenState(prev, normalized, {
            submissionResult:
              normalized.submissionResult || {
                isCorrect: false,
                reason: 'round_already_resolved',
                message: 'Round resolved. Proceed to the next challenge.',
                fightResult: prev.submissionResult?.fightResult || null,
              },
            nextChallengeData: normalized.currentChallenge
              ? {
                  ...normalized.currentChallenge,
                  card: normalized.card || prev.card || null,
                  selectedCharacter: normalized.selectedCharacter || prev.selectedCharacter,
                  enemy: normalized.enemy || prev.enemy,
                  avatar: normalized.avatar || prev.avatar,
                  level: normalized.level || prev.level,
                }
              : null,
          }),
        }));
        setSyncConnected({ pendingRemoteProceed: true }, { touch: true });
        return;
      }

      setGameStateIfChanged((prev) => ({
        ...toResponseDrivenState(prev, normalized, {
          submissionResult: normalized.submissionResult || prev.submissionResult,
          nextChallengeData: prev.nextChallengeData || null,
        }),
      }));
    } catch (syncError) {
      console.error('PvP sync error:', syncError);
      setSyncReconnecting();
    }
  }, [
    disabled,
    resolveLatestMatchId,
    setGameStateIfChanged,
    setSyncReconnecting,
    setResolvedMatchId,
    setSyncConnected,
    stopAutoProceed,
    toResponseDrivenState,
  ]);

  const retryLevel = useCallback(async () => {
    await fetchMatchState();
  }, [fetchMatchState]);

  const enterNextLevel = useCallback(async () => {
    return;
  }, []);

  const refetchGameData = useCallback(() => {
    pendingSubmissionRef.current = null;
    setWaitingForAnimation(false);

    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }

    fetchMatchState();
  }, [fetchMatchState]);

  const selectPotion = useCallback(() => {
  }, []);

  const clearSelectedPotion = useCallback(() => {
  }, []);

  const usePotion = useCallback(async () => {
    return {
      success: false,
      error: 'Potions are disabled in PvP daily mode',
    };
  }, []);

  useEffect(() => {
    if (disabled) {
      return;
    }

    const resolvedMatchId = activeMatchIdRef.current;
    if (!resolvedMatchId) {
      return;
    }

    persistMatchState(gameState, resolvedMatchId);
  }, [activeMatchId, disabled, gameState, persistMatchState]);

  useEffect(() => {
    let isMounted = true;

    const bootstrapMatchState = async () => {
      if (disabled) {
        stopPolling();
        stopAutoProceed();
        setLoading(false);
        setAnimationsLoading(false);
        setLiveSync(makeDefaultLiveSync());
        return;
      }

      const resolvedMatchId = await resolveLatestMatchId({ forceRefresh: true });
      if (!resolvedMatchId) {
        setError('Missing match ID');
        setLoading(false);
        setAnimationsLoading(false);
        return;
      }

      await setResolvedMatchId(resolvedMatchId);

      const freshState = await fetchMatchState({
        silent: false,
        resolvedMatchId,
      });

      if (freshState || !isMounted) {
        return;
      }

      const cachedState = await loadCachedMatchState(resolvedMatchId);
      if (!cachedState) {
        return;
      }

      setGameStateIfChanged((prev) => {
        const nextState = toResponseDrivenState(prev, cachedState, {
          submissionResult: cachedState?.submissionResult ?? null,
          nextChallengeData: cachedState?.nextChallengeData || null,
        });

        currentChallengeIdRef.current = nextState.currentChallenge?.id || null;
        return nextState;
      });
    };

    bootstrapMatchState();

    return () => {
      isMounted = false;
    };
  }, [
    disabled,
    fetchMatchState,
    loadCachedMatchState,
    resolveLatestMatchId,
    setGameStateIfChanged,
    setResolvedMatchId,
    stopAutoProceed,
    stopPolling,
    toResponseDrivenState,
  ]);

  useEffect(() => {
    if (disabled) {
      stopPolling();
      return;
    }

    let isMounted = true;

    const startPolling = async () => {
      const resolvedMatchId =
        activeMatchIdRef.current || (await resolveLatestMatchId({ forceRefresh: false }));

      if (!isMounted || !resolvedMatchId) {
        stopPolling();
        return;
      }

      stopPolling();
      matchPollRef.current = setInterval(() => {
        syncMatchState();
      }, 1500);
    };

    startPolling();

    return () => {
      isMounted = false;
      stopPolling();
    };
  }, [activeMatchId, disabled, resolveLatestMatchId, stopPolling, syncMatchState]);

  useEffect(() => {
    if (disabled || !canProceed) {
      stopAutoProceed();
      return;
    }

    setAutoProceedCountdown(AUTO_PROCEED_SECONDS);

    autoProceedIntervalRef.current = setInterval(() => {
      setAutoProceedCountdown((prev) => {
        if (typeof prev !== 'number') {
          return AUTO_PROCEED_SECONDS;
        }

        return prev > 1 ? prev - 1 : 1;
      });
    }, 1000);

    autoProceedTimeoutRef.current = setTimeout(() => {
      handleProceed();
    }, AUTO_PROCEED_SECONDS * 1000);

    return () => {
      stopAutoProceed();
    };
  }, [canProceed, disabled, handleProceed, stopAutoProceed]);

  useEffect(() => {
    return () => {
      stopPolling();
      stopAutoProceed();

      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
    };
  }, [stopAutoProceed, stopPolling]);

  return {
    gameState,
    currentChallenge: gameState?.currentChallenge || null,
    submissionResult: gameState?.submissionResult || null,

    loading,
    error,
    submitting,
    waitingForAnimation,
    canProceed,
    autoProceedCountdown,

    animationsLoading,
    downloadProgress,
    individualAnimationProgress,

    retryLevel,
    enterNextLevel,
    refetchGameData,
    submitAnswer,
    onAnimationComplete: handleAnimationComplete,
    handleProceed,

    potions,
    selectedPotion,
    loadingPotions,
    usingPotion,
    usePotion,
    selectPotion,
    clearSelectedPotion,
    fetchPotions: async () => [],

    liveSync,
  };
};

export default usePvpGameData;
