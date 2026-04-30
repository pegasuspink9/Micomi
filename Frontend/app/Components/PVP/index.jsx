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
import PvpRankPreview from './PvpRankPreview';
import PvpMatchHistoryPreview from './PvpMatchHistoryPreview';
import MainLoading from '../Actual Game/Loading/MainLoading';
import BackButton from '../Actual Game/Back/BackButton';
import MapHeader from '../Map/mapHeader';

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
    settingTopic, // This will be true while preparing
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
    // This will show "Preparing..." while waiting for the topic transition
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

  // Ensure the carousel index syncs with the backend's selected topic on load
  useEffect(() => {
    if (!pvpTopics.length) {
      setCurrentTopicIndex(0);
      return;
    }

    // Only sync if we aren't currently trying to change the topic ourself
    if (selectedPvpTopic && !settingTopic) {
      const selectedIndex = pvpTopics.findIndex((topic) => topic === selectedPvpTopic);
      if (selectedIndex >= 0 && selectedIndex !== currentTopicIndex) {
        setCurrentTopicIndex(selectedIndex);
        return;
      }
    }

    if (currentTopicIndex >= pvpTopics.length) {
      setCurrentTopicIndex(0);
    }
    // Added currentTopicIndex to dependency array to ensure sync
  }, [currentTopicIndex, pvpTopics, selectedPvpTopic, settingTopic]);

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

  // --------- THE FIX IS HERE ---------
  const changeTopic = useCallback(async (direction) => {
      // Prevent double actions if already busy
      if (!pvpTopics.length || loadingPreview || settingTopic || startingMatch || findingMatch) return;

      // 1. Calculate what the next index *will* be
      let nextIndex;
      if(direction === 'prev') {
         nextIndex = currentTopicIndex > 0 ? currentTopicIndex - 1 : pvpTopics.length - 1;
      } else {
         nextIndex = currentTopicIndex < pvpTopics.length - 1 ? currentTopicIndex + 1 : 0;
      }

      const topic = pvpTopics[nextIndex];
      if (!topic) return;

      try {
        await setMatchTopic(topic);

        setCurrentTopicIndex(nextIndex);

      } catch (topicError) {
        console.error('Failed to set PvP topic:', topicError);
      }
  }, [currentTopicIndex, findingMatch, loadingPreview, pvpTopics, setMatchTopic, settingTopic, startingMatch]);
  // -----------------------------------


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
    // Prevent starting if we are mid-transition
    if (settingTopic) return;

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
  }, [loadPreview, navigateToPvpMatch, pvpStatus, selectedPvpTopic, startMatchmaking, settingTopic]);

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
      <MapHeader />

      {/* Header Area (kept in parent as it's global navigation) */}
      <View style={styles.headerRow}>
        <BackButton
          onPress={handleClose}
          width={gameScale(78)}
          height={gameScale(78)}
          containerStyle={styles.backButtonContainer}
        />
        <View style={styles.backButtonSpacer} />
      </View>

      <View style={styles.logoWrap} pointerEvents="none">
        <Image source={pvpLogoSource} style={styles.titleLogo} resizeMode="contain" />
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

      <View style={styles.bottomCardsRow}>
        <View style={styles.bottomCardCol}>
          <PvpRankPreview />
        </View>
        <View style={styles.bottomCardCol}>
          <PvpMatchHistoryPreview />
        </View>
      </View>

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
    top: gameScale(-82),
    left: gameScale(-5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonSpacer: {
    width: gameScale(78),
    height: gameScale(78),
  },
  logoWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: gameScale(72),
    opacity: 0.9,
  },
  titleLogo: {
    width: gameScale(210),
    height: gameScale(210),
  },
  bottomCardsRow: {
    position: 'absolute',
    left: gameScale(12),
    right: gameScale(12),
    bottom: gameScale(26),
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: gameScale(10),
    zIndex: 30,
  },
  bottomCardCol: {
    flex: 1,
  },
});