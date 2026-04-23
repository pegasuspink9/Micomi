import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  StyleSheet,
  View,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { usePvpMatchmaking } from '../../hooks/usePvpMatchmaking';
import { universalAssetPreloader } from '../../services/preloader/universalAssetPreloader';
import { gameScale } from '../Responsiveness/gameResponsive';

// Import child components
import PvpBackgroundVideo from './PvpBackgroundVideo';
import PvpSelectionContent from './PvpSelectionContent';
import MainLoading from '../Actual Game/Loading/MainLoading';
import BackButton from '../Actual Game/Back/BackButton';

const PVP_LOGO = 'https://micomi-assets.me/Pvp%20Assets/Landing%20Image/PvP%20Logo.png';

export default function PvpLobbyPage() {
  const router = useRouter();
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [matchmakingSeconds, setMatchmakingSeconds] = useState(0);
  const [entryLoadingVisible, setEntryLoadingVisible] = useState(false);

  // --- Logic and State Hooks ---
  const {
    preview,
    status: pvpStatus,
    loadingPreview,
    settingTopic,
    startingMatch,
    findingMatch,
    matchedMatchId,
    error: pvpError,
    loadPreview,
    setMatchTopic,
    startMatchmaking,
    cancelMatchmaking,
    clearMatchReadyState,
    clearError: clearPvpError,
  } = usePvpMatchmaking();

  // --- derived state ---
  const pvpTopics = Array.isArray(preview?.previewTask?.topicsCovered)
    ? preview.previewTask.topicsCovered
    : [];
  const selectedPvpTopic = pvpStatus?.selectedTopic || null;

  const hasResumableMatch = Boolean(
    pvpStatus?.matchId &&
      (pvpStatus?.matchFound ||
        ['matched', 'already_matched', 'in_progress', 'round_in_progress', 'active'].includes(
          String(pvpStatus?.status || '').toLowerCase()
        ))
  );

  const currentTopic = pvpTopics[currentTopicIndex] || null;

  const primaryButtonLabel = useMemo(() => {
    if (findingMatch) return 'Matching';
    if (startingMatch || settingTopic) return 'Preparing...';
    if (hasResumableMatch) return 'Continue';
    if (currentTopic) return currentTopic;
    return 'Choose Topic';
  }, [currentTopic, findingMatch, hasResumableMatch, settingTopic, startingMatch]);

  const matchmakingTimerLabel = useMemo(() => {
    const minutes = Math.floor(matchmakingSeconds / 60);
    const seconds = matchmakingSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }, [matchmakingSeconds]);

  const pvpLogoSource = useMemo(() => {
    const cachedPath = universalAssetPreloader.getCachedAssetPath(PVP_LOGO);
    return { uri: cachedPath || PVP_LOGO };
  }, []);

  // --- Navigation Helpers ---
  const navigateToPvpMatch = useCallback(
    (targetMatchId) => {
      if (!targetMatchId) return;

      router.push({
        pathname: '/GamePlay',
        params: {
          mode: 'pvp',
          matchId: String(targetMatchId),
        },
      });
    },
    [router]
  );

  // --- Effects ---
  useFocusEffect(
    useCallback(() => {
      setEntryLoadingVisible(true);
      const loadingTimeoutId = setTimeout(() => {
        setEntryLoadingVisible(false);
      }, 700);

      clearMatchReadyState();
      clearPvpError();
      loadPreview();
      Promise.all([
        universalAssetPreloader.loadCachedAssets('ui_videos'),
        universalAssetPreloader.loadCachedAssets('ui_images'),
      ]).catch((error) => {
        console.warn('Failed to load cached UI videos for PvP page:', error);
      });

      return () => {
        clearTimeout(loadingTimeoutId);
      };
    }, [clearMatchReadyState, clearPvpError, loadPreview])
  );

  useEffect(() => {
    if (!pvpTopics.length) {
      setCurrentTopicIndex(0);
      return;
    }

    if (selectedPvpTopic) {
      const selectedIndex = pvpTopics.findIndex((topic) => topic === selectedPvpTopic);
      if (selectedIndex >= 0) {
        setCurrentTopicIndex(selectedIndex);
        return;
      }
    }

    if (currentTopicIndex >= pvpTopics.length) {
      setCurrentTopicIndex(0);
    }
  }, [currentTopicIndex, pvpTopics, selectedPvpTopic]);

  useEffect(() => {
    if (!matchedMatchId) return;

    navigateToPvpMatch(matchedMatchId);
    clearMatchReadyState();
  }, [clearMatchReadyState, matchedMatchId, navigateToPvpMatch]);

  useEffect(() => {
    if (!findingMatch) {
      setMatchmakingSeconds(0);
      return;
    }

    setMatchmakingSeconds(0);
    const intervalId = setInterval(() => {
      setMatchmakingSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [findingMatch]);

  // --- Event Handlers ---

  const changeTopic = useCallback(async (direction) => {
      if (!pvpTopics.length || loadingPreview || settingTopic || startingMatch || findingMatch) return;

      let nextIndex;
      if(direction === 'prev') {
         nextIndex = currentTopicIndex > 0 ? currentTopicIndex - 1 : pvpTopics.length - 1;
      } else {
         nextIndex = currentTopicIndex < pvpTopics.length - 1 ? currentTopicIndex + 1 : 0;
      }

      setCurrentTopicIndex(nextIndex);

      const topic = pvpTopics[nextIndex];
      if (!topic) return;

      try {
        await setMatchTopic(topic);
      } catch (topicError) {
        console.error('Failed to set PvP topic:', topicError);
      }
  }, [currentTopicIndex, findingMatch, loadingPreview, pvpTopics, setMatchTopic, settingTopic, startingMatch]);


  const handlePreviousTopic = () => changeTopic('prev');
  const handleNextTopic = () => changeTopic('next');

  const handleClose = useCallback(async () => {
    if (findingMatch) {
      try {
        await cancelMatchmaking({ silent: true });
      } catch (cancelError) {
        console.error('Failed to cancel PvP matchmaking:', cancelError);
      }
    }

    clearMatchReadyState();
    router.back();
  }, [cancelMatchmaking, clearMatchReadyState, findingMatch, router]);

  const handleStartPvpMatch = useCallback(async () => {
    try {
      const latestPreview = await loadPreview();
      const latestStatus = latestPreview?.status || pvpStatus || null;
      const latestStatusValue = String(latestStatus?.status || '').toLowerCase();
      const latestSelectedTopic = latestStatus?.selectedTopic || selectedPvpTopic || null;

      const latestHasResumableMatch = Boolean(
        latestStatus?.matchId &&
          (latestStatus?.matchFound ||
            ['matched', 'already_matched', 'in_progress', 'round_in_progress', 'active'].includes(
              latestStatusValue
            ))
      );

      if (latestHasResumableMatch && latestStatus?.matchId) {
        navigateToPvpMatch(latestStatus.matchId);
        return;
      }

      await startMatchmaking(latestSelectedTopic);
    } catch (startError) {
      console.error('Failed to start PvP matchmaking:', startError);
    }
  }, [loadPreview, navigateToPvpMatch, pvpStatus, selectedPvpTopic, startMatchmaking]);

  const handleCancelPvpSearch = useCallback(async () => {
    try {
      await cancelMatchmaking();
    } catch (cancelError) {
      console.error('Failed to cancel PvP matchmaking:', cancelError);
    }
  }, [cancelMatchmaking]);

  const handleToggleMatch = useCallback(async () => {
    if (findingMatch) {
      await handleCancelPvpSearch();
      return;
    }

    await handleStartPvpMatch();
  }, [findingMatch, handleCancelPvpSearch, handleStartPvpMatch]);

  // --- Render ---
  return (
    <View style={styles.screen}>
      <PvpBackgroundVideo />

      {/* Header Area (kept in parent as it's global navigation) */}
      <View style={styles.headerRow}>
        <BackButton
          onPress={handleClose}
          width={gameScale(78)}
          height={gameScale(78)}
          containerStyle={styles.backButtonContainer}
        />
        <View style={styles.logoWrap}>
          <Image source={pvpLogoSource} style={styles.titleLogo} resizeMode="contain" />
        </View>
        <View style={styles.backButtonSpacer} />
      </View>

      {/* Selection Content Area (Carousel and Buttons) */}
      <PvpSelectionContent
        loadingPreview={loadingPreview}
        findingMatch={findingMatch}
        startingMatch={startingMatch}
        settingTopic={settingTopic}
        hasResumableMatch={hasResumableMatch}
        pvpTopics={pvpTopics}
        currentTopicIndex={currentTopicIndex}
        currentTopic={currentTopic}
        pvpTopicsLength={pvpTopics.length}
        pvpError={pvpError}
        primaryButtonLabel={primaryButtonLabel}
        matchmakingTimerLabel={matchmakingTimerLabel}
        onPreviousTopic={handlePreviousTopic}
        onNextTopic={handleNextTopic}
        onToggleMatch={handleToggleMatch}
      />

      <MainLoading visible={entryLoadingVisible} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#081a33',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: gameScale(12),
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + gameScale(12) : gameScale(18),
    paddingHorizontal: gameScale(14),
  },
  backButtonContainer: {
    position: 'relative',
    top: gameScale(-49),
    left: gameScale(-5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonSpacer: {
    width: gameScale(78),
    height: gameScale(78),
  },
  logoWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    top: gameScale(150),
    bottom: 0,
  },
  titleLogo: {
    width: gameScale(250),
    height: gameScale(250),
  },
});