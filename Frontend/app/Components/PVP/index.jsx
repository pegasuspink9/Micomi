import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePvpMatchmaking } from '../../hooks/usePvpMatchmaking';
import { universalAssetPreloader } from '../../services/preloader/universalAssetPreloader';
import { gameScale } from '../Responsiveness/gameResponsive';

// Import child components
import PvpBackgroundVideo from './PvpBackgroundVideo';
import PvpSelectionContent from './PvpSelectionContent';

export default function PvpLobbyPage() {
  const router = useRouter();
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);

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
    if (findingMatch) return 'Finding Match...';
    if (startingMatch || settingTopic) return 'Preparing...';
    if (hasResumableMatch) return 'Matched - Continue';
    if (currentTopic) return `Play ${currentTopic}`;
    return 'Choose Topic';
  }, [currentTopic, findingMatch, hasResumableMatch, settingTopic, startingMatch]);

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
      clearMatchReadyState();
      clearPvpError();
      loadPreview();
      universalAssetPreloader.loadCachedAssets('ui_videos').catch((error) => {
        console.warn('Failed to load cached UI videos for PvP page:', error);
      });
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

  // --- Render ---
  return (
    <View style={styles.screen}>
      <PvpBackgroundVideo />

      {/* Header Area (kept in parent as it's global navigation) */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={handleClose} activeOpacity={0.85}>
          <MaterialCommunityIcons name="arrow-left" size={gameScale(24)} color="#E8F5FF" />
        </TouchableOpacity>
        <Text style={styles.title}>Daily PvP Match</Text>
        <View style={styles.backButtonSpacer} />
      </View>

      {/* Selection Content Area (Carousel and Buttons) */}
      <PvpSelectionContent
        loadingPreview={loadingPreview}
        findingMatch={findingMatch}
        startingMatch={startingMatch}
        settingTopic={settingTopic}
        hasResumableMatch={hasResumableMatch}
        currentTopic={currentTopic}
        pvpTopicsLength={pvpTopics.length}
        pvpError={pvpError}
        primaryButtonLabel={primaryButtonLabel}
        onPreviousTopic={handlePreviousTopic}
        onNextTopic={handleNextTopic}
        onStartPvpMatch={handleStartPvpMatch}
        onClose={handleClose}
        onCancelPvpSearch={handleCancelPvpSearch}
      />
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
  backButton: {
    width: gameScale(40),
    height: gameScale(40),
    borderRadius: gameScale(20),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(18, 50, 98, 0.9)',
    borderWidth: gameScale(1),
    borderColor: '#5AAEEE',
  },
  backButtonSpacer: {
    width: gameScale(40),
    height: gameScale(40),
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: gameScale(24),
    fontFamily: 'Grobold',
  },
});