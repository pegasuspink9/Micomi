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

const mergeFightAttributes = (baseState, sourceState) => {
  if (!baseState || !sourceState) {
    return baseState;
  }

  const fightResult = sourceState?.submissionResult?.fightResult || sourceState?.fightResult || null;
  if (!fightResult) {
    return baseState;
  }

  const nextState = {
    ...baseState,
    selectedCharacter: { ...(baseState.selectedCharacter || {}) },
    enemy: { ...(baseState.enemy || {}) },
    avatar: { ...(baseState.avatar || {}) },
  };

  const character = fightResult.character || {};
  const enemy = fightResult.enemy || {};

  if (character.character_id !== undefined) {
    nextState.selectedCharacter.character_id = character.character_id;
  }

  if (character.character_name !== undefined) {
    nextState.selectedCharacter.character_name = character.character_name;
  }

  if (character.character_idle !== undefined) {
    nextState.selectedCharacter.character_idle = character.character_idle;
  }

  if (character.character_run !== undefined) {
    nextState.selectedCharacter.character_run = character.character_run;
  }

  if (character.character_attack_type !== undefined) {
    nextState.selectedCharacter.character_attack_type = character.character_attack_type;
  }

  if (character.character_attack !== undefined) {
    nextState.selectedCharacter.character_attack = character.character_attack;
  }

  if (character.character_range_attack !== undefined) {
    nextState.selectedCharacter.character_range_attack = character.character_range_attack;
  }

  if (character.character_hurt !== undefined) {
    nextState.selectedCharacter.character_hurt = character.character_hurt;
  }

  if (character.character_dies !== undefined) {
    nextState.selectedCharacter.character_dies = character.character_dies;
  }

  if (character.character_damage !== undefined) {
    nextState.selectedCharacter.character_damage = character.character_damage;
  }

  if (character.character_is_range !== undefined) {
    nextState.selectedCharacter.character_is_range = character.character_is_range;
  }

  if (character.character_health !== undefined) {
    nextState.selectedCharacter.current_health = character.character_health;
  }

  if (character.special_skill) {
    nextState.selectedCharacter.special_skill = character.special_skill;
  }

  if (character.character_max_health !== undefined && character.character_max_health !== null) {
    nextState.selectedCharacter.max_health = character.character_max_health;
    nextState.selectedCharacter.character_max_health = character.character_max_health;
  }

  if (character.character_attack_overlay !== undefined) {
    nextState.selectedCharacter.character_attack_overlay = character.character_attack_overlay;
  }

  if (character.character_current_state !== undefined) {
    nextState.selectedCharacter.character_current_state = character.character_current_state;
  }

  if (character.character_reaction !== undefined) {
    nextState.selectedCharacter.character_reaction = character.character_reaction;
  }

  if (enemy.enemy_id !== undefined) {
    nextState.enemy.enemy_id = enemy.enemy_id;
  }

  if (enemy.enemy_name !== undefined) {
    nextState.enemy.enemy_name = enemy.enemy_name;
  }

  if (enemy.enemy_idle !== undefined) {
    nextState.enemy.enemy_idle = enemy.enemy_idle;
  }

  if (enemy.enemy_run !== undefined) {
    nextState.enemy.enemy_run = enemy.enemy_run;
  }

  if (enemy.enemy_attack !== undefined) {
    nextState.enemy.enemy_attack = enemy.enemy_attack;
  }

  if (enemy.enemy_hurt !== undefined) {
    nextState.enemy.enemy_hurt = enemy.enemy_hurt;
  }

  if (enemy.enemy_dies !== undefined) {
    nextState.enemy.enemy_dies = enemy.enemy_dies;
  }

  if (enemy.enemy_damage !== undefined) {
    nextState.enemy.enemy_damage = enemy.enemy_damage;
  }

  if (enemy.enemy_attack_overlay !== undefined) {
    nextState.enemy.enemy_attack_overlay = enemy.enemy_attack_overlay;
  }

  if (enemy.enemy_current_state !== undefined) {
    nextState.enemy.enemy_current_state = enemy.enemy_current_state;
  }

  if (enemy.enemy_reaction !== undefined) {
    nextState.enemy.enemy_reaction = enemy.enemy_reaction;
  }

  if (enemy.enemy_attack_type !== undefined) {
    nextState.enemy.enemy_attack_type = enemy.enemy_attack_type;
  }

  if (enemy.enemy_health !== undefined) {
    nextState.enemy.enemy_health = enemy.enemy_health;
  }

  if (enemy.special_skill) {
    nextState.enemy.special_skill = enemy.special_skill;
  }

  if (enemy.enemy_max_health !== undefined && enemy.enemy_max_health !== null) {
    nextState.enemy.enemy_max_health = enemy.enemy_max_health;
  }

  if (fightResult.energy !== undefined) {
    nextState.energy = fightResult.energy;
  }

  if (character.character_avatar) {
    nextState.avatar.player = character.character_avatar;
  }

  if (enemy.enemy_avatar) {
    nextState.avatar.enemy = enemy.enemy_avatar;
  }

  const combatBackground =
    fightResult.combat_background || sourceState.combat_background || sourceState.combatBackground;
  if (combatBackground) {
    nextState.combat_background = combatBackground;
  }

  const gameplayAudio = fightResult.gameplay_audio || sourceState.gameplay_audio;
  if (gameplayAudio) {
    nextState.gameplay_audio = gameplayAudio;
  }

  return nextState;
};

const readCharacterHealth = (state) =>
  state?.submissionResult?.fightResult?.character?.character_health ??
  state?.selectedCharacter?.current_health ??
  state?.selectedCharacter?.character_health ??
  null;

const readEnemyHealth = (state) =>
  state?.submissionResult?.fightResult?.enemy?.enemy_health ??
  state?.enemy?.enemy_health ??
  null;

const readCharacterState = (state) =>
  state?.submissionResult?.fightResult?.character?.character_current_state ??
  state?.selectedCharacter?.character_current_state ??
  null;

const readEnemyState = (state) =>
  state?.submissionResult?.fightResult?.enemy?.enemy_current_state ??
  state?.enemy?.enemy_current_state ??
  null;

const buildCombatStateSignature = (state) => {
  if (!state) {
    return 'none';
  }

  const submission = state.submissionResult || {};

  return [
    toStableValue(state.currentChallenge?.id),
    toStableValue(submission?.fightResult?.status),
    toStableValue(submission?.reason),
    toStableValue(submission?.isCorrect),
    toStableValue(submission?.acceptedForAttack ?? submission?.accepted_for_attack),
    toStableValue(submission?.message),
    toStableValue(readCharacterHealth(state)),
    toStableValue(readEnemyHealth(state)),
    toStableValue(readCharacterState(state)),
    toStableValue(readEnemyState(state)),
    toStableValue(state.energy),
    toStableValue(state.card?.character_attack_card),
  ].join('||');
};

const hasAuthoritativeDelta = ({ incomingState, baselineSignature, expectedChallengeId }) => {
  if (!incomingState) {
    return false;
  }

  const incomingChallengeId = incomingState.currentChallenge?.id || null;
  if (expectedChallengeId && incomingChallengeId && incomingChallengeId !== expectedChallengeId) {
    return true;
  }

  if (!baselineSignature) {
    return true;
  }

  return buildCombatStateSignature(incomingState) !== baselineSignature;
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
  const submitInFlightRef = useRef(false);
  const animationTimeoutRef = useRef(null);
  const submissionStartedAtRef = useRef(0);
  const instantProceedRef = useRef(false);
  const lastProcessedSubmissionRef = useRef(null);
  const matchPollRef = useRef(null);
  const autoProceedTimeoutRef = useRef(null);
  const autoProceedIntervalRef = useRef(null);

  const currentChallengeIdRef = useRef(null);
  const completedChallengeIdsRef = useRef(new Set());
  const canProceedRef = useRef(false);
  const waitingRef = useRef(false);
  const submitBaselineCombatSignatureRef = useRef(null);
  const submitExpectedChallengeIdRef = useRef(null);
  const submitAwaitingDeltaRef = useRef(false);

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

  useEffect(() => {
    completedChallengeIdsRef.current = new Set();
    lastProcessedSubmissionRef.current = null;
  }, [activeMatchId]);

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
          : incomingState?.submissionResult ?? null,
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
      const unifiedState = pvpService.extractAuthoritativeMatchState(payload);

      if (!unifiedState) {
        throw new Error('Failed to parse PvP match data');
      }

      setGameStateIfChanged((prev) => {
        const responseState = toResponseDrivenState(prev, unifiedState, {
          submissionResult: unifiedState?.submissionResult ?? null,
          nextChallengeData: null,
        });
        const nextState = mergeFightAttributes(responseState, unifiedState);

        currentChallengeIdRef.current = nextState.currentChallenge?.id || null;
        return nextState;
      });

      setCanProceed(false);
      instantProceedRef.current = false;
      submitAwaitingDeltaRef.current = false;
      submitBaselineCombatSignatureRef.current = null;
      submitExpectedChallengeIdRef.current = null;
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
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }

    const pendingData = pendingSubmissionRef.current;
    if (!pendingData) {
      setWaitingForAnimation(false);
      waitingRef.current = false;
      return;
    }

    const minimumDisplayMs = AUTO_PROCEED_SECONDS * 1000;
    const elapsedMs = submissionStartedAtRef.current
      ? Date.now() - submissionStartedAtRef.current
      : minimumDisplayMs;

    if (elapsedMs < minimumDisplayMs) {
      const remainingMs = minimumDisplayMs - elapsedMs;
      animationTimeoutRef.current = setTimeout(() => {
        handleAnimationComplete();
      }, remainingMs);
      return;
    }

    setWaitingForAnimation(false);
    waitingRef.current = false;

    const submission = pendingData.submissionResult || {};
    const reason = submission.reason;
    const fightStatus = submission.fightResult?.status;
    const nextChallenge = pendingData.currentChallenge;
    const hasDifferentNextChallenge = Boolean(
      nextChallenge?.id && currentChallengeIdRef.current && nextChallenge.id !== currentChallengeIdRef.current
    );

    const submissionId = `${nextChallenge?.id || 'none'}-${fightStatus || 'na'}-${reason || 'none'}-${submission.acceptedForAttack ?? submission.accepted_for_attack ?? 'na'}`;
    if (lastProcessedSubmissionRef.current === submissionId) {
      pendingSubmissionRef.current = null;
      submitAwaitingDeltaRef.current = false;
      submitBaselineCombatSignatureRef.current = null;
      submitExpectedChallengeIdRef.current = null;
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
      instantProceedRef.current = false;
      setGameStateIfChanged((prev) => {
        const merged = {
          ...mergeBattleState(prev),
          nextChallengeData: null,
        };

        return mergeFightAttributes(merged, pendingData);
      });
      pendingSubmissionRef.current = null;
      lastProcessedSubmissionRef.current = submissionId;
      submitAwaitingDeltaRef.current = false;
      submitBaselineCombatSignatureRef.current = null;
      submitExpectedChallengeIdRef.current = null;
      setSyncConnected({ pendingRemoteProceed: false });
      return;
    }

    if (reason === 'incorrect' && !hasDifferentNextChallenge) {
      setCanProceed(false);
      instantProceedRef.current = false;
      setGameStateIfChanged((prev) => {
        const merged = {
          ...mergeBattleState(prev),
          nextChallengeData: null,
        };

        return mergeFightAttributes(merged, pendingData);
      });
      pendingSubmissionRef.current = null;
      lastProcessedSubmissionRef.current = submissionId;
      submitAwaitingDeltaRef.current = false;
      submitBaselineCombatSignatureRef.current = null;
      submitExpectedChallengeIdRef.current = null;
      return;
    }

    if (!nextChallenge?.id) {
      setCanProceed(false);
      instantProceedRef.current = false;
      setGameStateIfChanged((prev) => {
        const merged = {
          ...mergeBattleState(prev),
          nextChallengeData: null,
        };

        return mergeFightAttributes(merged, pendingData);
      });
      pendingSubmissionRef.current = null;
      lastProcessedSubmissionRef.current = submissionId;
      submitAwaitingDeltaRef.current = false;
      submitBaselineCombatSignatureRef.current = null;
      submitExpectedChallengeIdRef.current = null;
      return;
    }

    const shouldProceed =
      reason === 'correct_and_first' ||
      reason === 'round_already_resolved' ||
      submission.acceptedForAttack === true ||
      submission.accepted_for_attack === true ||
      submission.isCorrect === true ||
      hasDifferentNextChallenge;

    if (shouldProceed) {
      setCanProceed(true);
      // PvP should mirror PvE flow: show Proceed and wait for manual tap.
      instantProceedRef.current = false;
      setGameStateIfChanged((prev) => {
        const merged = {
          ...mergeBattleState(prev),
          nextChallengeData: {
            ...nextChallenge,
            card: pendingData.card || prev.card || null,
            selectedCharacter: pendingData.selectedCharacter || prev.selectedCharacter,
            enemy: pendingData.enemy || prev.enemy,
            avatar: pendingData.avatar || prev.avatar,
            level: pendingData.level || prev.level,
          },
        };

        return mergeFightAttributes(merged, pendingData);
      });
      setSyncConnected({ pendingRemoteProceed: false });
    } else {
      setCanProceed(false);
      instantProceedRef.current = false;
      setGameStateIfChanged((prev) => {
        const merged = {
          ...mergeBattleState(prev),
          nextChallengeData: null,
        };

        return mergeFightAttributes(merged, pendingData);
      });
    }

    pendingSubmissionRef.current = null;
    lastProcessedSubmissionRef.current = submissionId;
    submitAwaitingDeltaRef.current = false;
    submitBaselineCombatSignatureRef.current = null;
    submitExpectedChallengeIdRef.current = null;
  }, [setGameStateIfChanged, setSyncConnected]);

  const getAuthoritativeStateAfterSubmit = useCallback(async (
    resolvedMatchId,
    localChallengeId,
    baselineCombatSignature
  ) => {
    const maxAttempts = 8;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const payload = await pvpService.getDailyMatchState(resolvedMatchId);
      const normalized = pvpService.extractAuthoritativeMatchState(payload);

      if (!normalized) {
        if (attempt === maxAttempts) {
          return null;
        }

        await new Promise((resolve) => {
          setTimeout(resolve, 300);
        });
        continue;
      }

      const hasDelta = hasAuthoritativeDelta({
        incomingState: normalized,
        baselineSignature: baselineCombatSignature,
        expectedChallengeId: localChallengeId,
      });

      if (hasDelta) {
        return normalized;
      }

      if (attempt === maxAttempts) {
        return null;
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 300);
      });
    }

    return null;
  }, []);

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

    if (submitInFlightRef.current) {
      return { success: false, error: 'Submission already in progress' };
    }

    try {
      submitInFlightRef.current = true;
      submissionStartedAtRef.current = Date.now();
      instantProceedRef.current = false;
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
      const latestMatchState = pvpService.extractAuthoritativeMatchState(latestMatchPayload);
      const latestChallengeId = latestMatchState?.currentChallenge?.id;

      if (!latestChallengeId) {
        throw new Error('Missing challenge ID');
      }

      currentChallengeIdRef.current = latestChallengeId;
      submitExpectedChallengeIdRef.current = latestChallengeId;
      submitBaselineCombatSignatureRef.current = buildCombatStateSignature(latestMatchState);
      submitAwaitingDeltaRef.current = true;

      const postResponse = await pvpService.submitDailyMatchAnswer(
        latestMatchId,
        latestChallengeId,
        selectedAnswers
      );
      
      const postData = postResponse?.data || postResponse;
      const postIsCorrectRaw =
        typeof postData?.isCorrect === 'boolean'
          ? postData.isCorrect
          : typeof postData?.is_correct === 'boolean'
            ? postData.is_correct
            : null;
      const submitIndicator = {
        isCorrect: postIsCorrectRaw,
        message: postData?.message ?? '',
        isCorrectAudio: postData?.isCorrectAudio ?? postData?.is_correct_audio ?? null,
      };

      setWaitingForAnimation(true);
      waitingRef.current = true;

      const authoritativeState = await getAuthoritativeStateAfterSubmit(
        latestMatchId,
        latestChallengeId,
        submitBaselineCombatSignatureRef.current
      );

      if (!authoritativeState) {
        setWaitingForAnimation(false);
        waitingRef.current = false;
        submitAwaitingDeltaRef.current = false;
        submitBaselineCombatSignatureRef.current = null;
        submitExpectedChallengeIdRef.current = null;
        return {
          success: true,
          updatedGameState: {
            submissionResult: submitIndicator,
          },
          waitingForAnimation: false,
          awaitingAuthoritativeSync: true,
        };
      }

      submitAwaitingDeltaRef.current = false;

      pendingSubmissionRef.current = authoritativeState;

      const authoritativeChallenge = authoritativeState.currentChallenge || null;
      const hasChallengeShift = Boolean(
        authoritativeChallenge?.id &&
          latestChallengeId &&
          authoritativeChallenge.id !== latestChallengeId
      );

      setGameStateIfChanged((prev) => {
        const merged = {
          ...prev,
          submissionResult: authoritativeState.submissionResult || null,
          selectedCharacter: authoritativeState.selectedCharacter || prev.selectedCharacter,
          enemy: authoritativeState.enemy || prev.enemy,
          avatar: authoritativeState.avatar || prev.avatar,
          level: authoritativeState.level || prev.level,
          nextChallengeData:
            hasChallengeShift && authoritativeChallenge
              ? {
                  ...authoritativeChallenge,
                  card: authoritativeState.card || prev.card || null,
                  selectedCharacter:
                    authoritativeState.selectedCharacter || prev.selectedCharacter,
                  enemy: authoritativeState.enemy || prev.enemy,
                  avatar: authoritativeState.avatar || prev.avatar,
                  level: authoritativeState.level || prev.level,
                }
              : null,
          card: authoritativeState.card || prev.card || null,
        };

        return mergeFightAttributes(merged, authoritativeState);
      });

      setSyncConnected({ pendingRemoteProceed: hasChallengeShift }, { touch: true });

      animationTimeoutRef.current = setTimeout(() => {
        handleAnimationComplete();
      }, 5000);

      return {
        success: true,
        updatedGameState: {
          submissionResult: submitIndicator,
        },
        waitingForAnimation: true,
      };
    } catch (submitError) {
      setError(submitError.message || 'Failed to submit PvP answer');
      pendingSubmissionRef.current = null;
      setWaitingForAnimation(false);
      waitingRef.current = false;
      submitAwaitingDeltaRef.current = false;
      submitBaselineCombatSignatureRef.current = null;
      submitExpectedChallengeIdRef.current = null;
      return { success: false, error: submitError.message || 'Failed to submit answer' };
    } finally {
      submitInFlightRef.current = false;
      setSubmitting(false);
    }
  }, [
    disabled,
    getAuthoritativeStateAfterSubmit,
    handleAnimationComplete,
    resolveLatestMatchId,
    setGameStateIfChanged,
    setResolvedMatchId,
    setSyncConnected,
    stopAutoProceed,
  ]);

  const handleProceed = useCallback(() => {
    if (!canProceedRef.current) {
      return;
    }

    instantProceedRef.current = false;
    stopAutoProceed();
    setCanProceed(false);
    setSyncConnected({ pendingRemoteProceed: false }, { touch: true });

    setGameState((prev) => {
      const nextChallenge = prev.nextChallengeData;
      if (!nextChallenge) {
        return prev;
      }

      if (prev.currentChallenge?.id) {
        completedChallengeIdsRef.current.add(prev.currentChallenge.id);
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
      const normalized = pvpService.extractAuthoritativeMatchState(payload);
      if (!normalized) return;

      await setResolvedMatchId(resolvedMatchId);
      setSyncConnected();

      const remoteChallengeId = normalized.currentChallenge?.id || null;
      const localChallengeId = currentChallengeIdRef.current;

      if (
        remoteChallengeId &&
        localChallengeId &&
        remoteChallengeId !== localChallengeId &&
        completedChallengeIdsRef.current.has(remoteChallengeId)
      ) {
        return; // Ignore stale server responses for older challenges
      }

      const remoteFightStatus = normalized.submissionResult?.fightResult?.status;
      const hasPendingSubmitDelta = hasAuthoritativeDelta({
        incomingState: normalized,
        baselineSignature: submitBaselineCombatSignatureRef.current,
        expectedChallengeId: submitExpectedChallengeIdRef.current,
      });

      if (submitAwaitingDeltaRef.current && !hasPendingSubmitDelta) {
        return;
      }

      if (submitAwaitingDeltaRef.current && hasPendingSubmitDelta) {
        submitAwaitingDeltaRef.current = false;
      }

      if (
        waitingRef.current &&
        remoteChallengeId &&
        localChallengeId &&
        remoteChallengeId !== localChallengeId
      ) {
        if (!hasPendingSubmitDelta) {
          return;
        }

        pendingSubmissionRef.current = normalized;
        setGameStateIfChanged((prev) => {
          const stagedNextChallenge = normalized.currentChallenge
            ? {
                ...normalized.currentChallenge,
                card: normalized.card || prev.card || null,
                selectedCharacter: normalized.selectedCharacter || prev.selectedCharacter,
                enemy: normalized.enemy || prev.enemy,
                avatar: normalized.avatar || prev.avatar,
                level: normalized.level || prev.level,
              }
            : prev.nextChallengeData || null;

          const merged = {
            ...prev,
            submissionResult: normalized.submissionResult ?? null,
            nextChallengeData: stagedNextChallenge,
          };

          return mergeFightAttributes(merged, normalized);
        });

        setSyncConnected({ pendingRemoteProceed: true }, { touch: true });
        return;
      }

      // Keep local POST-response visuals stable while submission animation is running.
      if (waitingRef.current && remoteChallengeId && localChallengeId && remoteChallengeId === localChallengeId) {
        if (!hasPendingSubmitDelta) {
          return;
        }

        pendingSubmissionRef.current = normalized;
        setGameStateIfChanged((prev) => {
          const merged = {
            ...prev,
            submissionResult: normalized.submissionResult ?? null,
            selectedCharacter: normalized.selectedCharacter || prev.selectedCharacter,
            enemy: normalized.enemy || prev.enemy,
            avatar: normalized.avatar || prev.avatar,
            level: normalized.level || prev.level,
            card: normalized.card || prev.card || null,
            nextChallengeData: prev.nextChallengeData || null,
          };

          return mergeFightAttributes(merged, normalized);
        });
        return;
      }

      if (
        (remoteFightStatus === 'won' || remoteFightStatus === 'lost') &&
        !waitingRef.current
      ) {
        stopAutoProceed();
        setCanProceed(false);
        instantProceedRef.current = false;
        setGameStateIfChanged((prev) => {
          const merged = toResponseDrivenState(prev, normalized, {
            submissionResult: normalized.submissionResult ?? null,
            nextChallengeData: null,
          });

          return mergeFightAttributes(merged, normalized);
        });
        currentChallengeIdRef.current = remoteChallengeId || localChallengeId;
        return;
      }

      if (!remoteChallengeId || !localChallengeId) {
        if (remoteChallengeId && !localChallengeId) {
          currentChallengeIdRef.current = remoteChallengeId;
          setGameStateIfChanged((prev) => {
            const merged = toResponseDrivenState(prev, normalized, {
              submissionResult: normalized.submissionResult ?? null,
            });

            return mergeFightAttributes(merged, normalized);
          });
        }
        return;
      }

      if (
        remoteChallengeId !== localChallengeId &&
        !waitingRef.current
      ) {
        // Stage remote challenge first and keep currentChallenge stable until delayed proceed runs.
        setCanProceed(true);
        instantProceedRef.current = false;
        setGameStateIfChanged((prev) => {
          const merged = {
            ...prev,
            submissionResult: normalized.submissionResult ?? null,
            selectedCharacter: normalized.selectedCharacter || prev.selectedCharacter,
            enemy: normalized.enemy || prev.enemy,
            avatar: normalized.avatar || prev.avatar,
            level: normalized.level || prev.level,
            card: normalized.card || prev.card || null,
            nextChallengeData: normalized.currentChallenge
              ? {
                  ...normalized.currentChallenge,
                  card: normalized.card || prev.card || null,
                  selectedCharacter: normalized.selectedCharacter || prev.selectedCharacter,
                  enemy: normalized.enemy || prev.enemy,
                  avatar: normalized.avatar || prev.avatar,
                  level: normalized.level || prev.level,
                }
              : prev.nextChallengeData || null,
          };

          return mergeFightAttributes(merged, normalized);
        });
        setSyncConnected({ pendingRemoteProceed: true }, { touch: true });
        return;
      }

      setGameStateIfChanged((prev) => {
        const prevChallengeId = prev.currentChallenge?.id || null;
        const nextChallengeId = normalized.currentChallenge?.id || null;
        const prevCombatSignature = buildCombatStateSignature(prev);
        const nextCombatSignature = buildCombatStateSignature(normalized);

        if (
          prevChallengeId === nextChallengeId &&
          prevCombatSignature === nextCombatSignature
        ) {
          return prev;
        }

        const merged = toResponseDrivenState(prev, normalized, {
          submissionResult: normalized.submissionResult ?? null,
          nextChallengeData: prev.nextChallengeData || null,
        });

        return mergeFightAttributes(merged, normalized);
      });
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
    waitingRef.current = false;
    submitAwaitingDeltaRef.current = false;
    submitBaselineCombatSignatureRef.current = null;
    submitExpectedChallengeIdRef.current = null;

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
        const responseState = toResponseDrivenState(prev, cachedState, {
          submissionResult: cachedState?.submissionResult ?? null,
          nextChallengeData: cachedState?.nextChallengeData || null,
        });
        const nextState = mergeFightAttributes(responseState, cachedState);

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

    // Manual proceed only in PvP for now to avoid duplicate/retrigger transitions.
    setAutoProceedCountdown(null);

    return () => {
      stopAutoProceed();
    };
  }, [canProceed, disabled, stopAutoProceed]);

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
