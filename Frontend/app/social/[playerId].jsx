import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';

import { gameScale } from '../Components/Responsiveness/gameResponsive';
import PlayerInfoSection from '../Components/Profile Components/PlayerInfoSection';
import StatsGridSection from '../Components/Profile Components/StatsGridSection';
import InventorySection from '../Components/Profile Components/InventorySection';
import ProfileRankHistorySection from '../Components/Profile Components/ProfileRankHistorySection';
import { playerService } from '../services/playerService';
import { useSocialHook } from '../hooks/useSocialHook';
import { useAuth } from '../hooks/useAuth';
import { universalAssetPreloader } from '../services/preloader/universalAssetPreloader';
import { pvpService } from '../services/pvpService';


const normalizeRelation = (relation) => {
  const raw = String(relation || '').toLowerCase();

  if (raw === 'self') {
    return 'self';
  }

  if (raw === 'mutual' || raw === 'following') {
    return 'following';
  }

  if (raw === 'followed_by' || raw === 'follower' || raw === 'follows_you') {
    return 'follower_only';
  }

  return 'none';
};

export default function PublicPlayerProfileScreen() {
  const { playerId } = useLocalSearchParams();
  const router = useRouter();
  const socialService = useSocialHook();
  const { user } = useAuth();
  const currentUserId = Number(user?.player_id);

  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inventoryTab, setInventoryTab] = useState('Badges');
  const [profileMode, setProfileMode] = useState('Classic');
  const [actionLoading, setActionLoading] = useState(false);
  const [relationStatus, setRelationStatus] = useState('none');
  const [rankHistory, setRankHistory] = useState([]);
  const [rankHistoryLoading, setRankHistoryLoading] = useState(false);
  const [rankHistoryError, setRankHistoryError] = useState(null);

  const loadRankHistory = useCallback(async () => {
    try {
      setRankHistoryLoading(true);
      setRankHistoryError(null);
      const response = await pvpService.getDailyMatchHistory();
      const sorted = [...(Array.isArray(response) ? response : [])].sort((a, b) => {
        const aTime = new Date(a?.date || 0).getTime();
        const bTime = new Date(b?.date || 0).getTime();
        return bTime - aTime;
      });
      setRankHistory(sorted.slice(0, 10));
    } catch (historyError) {
      setRankHistory([]);
      setRankHistoryError(historyError?.message || 'Failed to load match history');
    } finally {
      setRankHistoryLoading(false);
    }
  }, []);

  const handleOpenVisitedSocial = useCallback(() => {
    if (!playerId) return;

    router.push({
      pathname: '/social',
      params: {
        playerId: String(playerId),
        username: playerData?.username || '',
      },
    });
  }, [playerId, playerData?.username, router]);

  const loadProfile = useCallback(async () => {
    if (!playerId) return;

    try {
      setLoading(true);
      setError(null);

      await Promise.all([
        universalAssetPreloader.loadCachedAssets('game_images'),
        universalAssetPreloader.loadCachedAssets('game_animations'),
        universalAssetPreloader.loadCachedAssets('map_assets'),
      ]);

      const apiData = await socialService.getPublicProfile(playerId);
      const transformTarget = { ...(apiData || {}) };

      if (!transformTarget.selectedBadge) {
        transformTarget.selectedBadge = transformTarget.latestAchievement || null;
      }

      const transformedData = playerService.transformPlayerData(transformTarget);

      const cacheStatus = await universalAssetPreloader.areProfileAssetsCachedFromMap(transformedData);
      if (!cacheStatus.cached && cacheStatus.missing > 0) {
        await universalAssetPreloader.downloadMissingProfileAssets(cacheStatus.missingAssets);
      }

      const dataWithCachedPaths =
        typeof universalAssetPreloader.transformProfileDataWithMapCache === 'function'
          ? universalAssetPreloader.transformProfileDataWithMapCache(transformedData)
          : universalAssetPreloader.transformPlayerDataWithCache(transformedData);

      setPlayerData(dataWithCachedPaths);
      setRelationStatus(normalizeRelation(apiData?.relation_status));
    } catch (err) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [playerId, socialService]);

  useFocusEffect(
    useCallback(() => {
      // If visiting own profile via ID, redirect to tab profile if feasible,
      // or just handle it as "self" relation.
      loadProfile();
      loadRankHistory();
    }, [loadProfile, loadRankHistory])
  );

  const handleRelationAction = useCallback(async () => {
    if (!playerId || relationStatus === 'self') return;

    try {
      setActionLoading(true);

      if (relationStatus === 'following') {
        await socialService.unfollowPlayer(playerId);
        setRelationStatus('none');
        setPlayerData((prev) => ({
          ...prev,
          friendsCount: Math.max(0, (prev?.friendsCount || 0) - 1),
        }));
        return;
      }

      if (relationStatus === 'follower_only') {
        await socialService.followBackPlayer(playerId);
        setRelationStatus('following');
        setPlayerData((prev) => ({
          ...prev,
          friendsCount: (prev?.friendsCount || 0) + 1,
        }));
        return;
      }

      await socialService.followPlayer(playerId);
      setRelationStatus('following');
      setPlayerData((prev) => ({
        ...prev,
        friendsCount: (prev?.friendsCount || 0) + 1,
      }));
    } catch (err) {
      setError(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  }, [playerId, relationStatus, socialService]);

  const relationButtonMeta =
    relationStatus === 'self'
      ? null
      : relationStatus === 'following'
      ? { label: 'Unfollow', style: styles.unfollowButton }
      : relationStatus === 'follower_only'
      ? { label: 'Follow back', style: styles.followBackButton }
      : { label: 'Follow', style: styles.addButton };

  if (loading || !playerData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <LinearGradient
          colors={['#0a192f', '#172b4aff', '#0a192f']}
          style={styles.gradientBackground}
        />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <LinearGradient
          colors={['#0a192f', '#172b4aff', '#0a192f']}
          style={styles.gradientBackground}
        >
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a192f', '#172b4aff', '#0a192f']}
        style={styles.gradientBackground}
      >
        <View style={styles.backgroundOverlay} />

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <PlayerInfoSection
            playerName={playerData.playerName}
            username={playerData.username}
            selectedBadge={playerData.selectedBadge}
            playerRankImage={playerData.playerRankImage}
            playerLevel={playerData.playerLevel}
            expPoints={playerData.expPoints}
            maxLevelExp={playerData.maxLevelExp}
            playerAvatar={playerData.playerAvatar}
            onAvatarPress={() => {}}
            friendsCount={playerData.friendsCount}
            followerCount={playerData.followerCount}
            onSocialPress={handleOpenVisitedSocial}
            headerAction="back"
            onHeaderAction={() => router.back()}
          />

          <StatsGridSection
            coins={playerData.coins}
            currentStreak={playerData.currentStreak}
            expPoints={playerData.expPoints}
            maxStreak={playerData.maxStreak}
            maxLevelExp={playerData.maxLevelExp}
            mapsOpened={playerData.mapsOpened}
            statsIcons={playerData.statsIcons}
            hero={playerData.heroSelected}
            background={playerData.background}
            mode={profileMode}
            playerRankName={playerData.playerRankName}
            playerRankImage={playerData.playerRankImage}
            playerCurrentPoints={playerData.playerCurrentPoints}
            pvpTotalMatches={playerData.pvpTotalMatches}
            pvpWinRate={playerData.pvpWinRate}
            onModeChange={setProfileMode}
            disableHeroPress={true}
            relationButtonMeta={relationButtonMeta}
            onRelationPress={handleRelationAction}
            relationActionLoading={actionLoading}
          />

          {profileMode === 'Classic' ? (
            <InventorySection
              activeTab={inventoryTab}
              setActiveTab={setInventoryTab}
              badges={playerData.badges || []}
              potions={playerData.potions || []}
              viewPlayerId={playerId}
            />
          ) : (
            <ProfileRankHistorySection
              history={rankHistory}
              loading={rankHistoryLoading}
              error={rankHistoryError}
              onRetry={loadRankHistory}
            />
          )}

          <View style={{ height: gameScale(16) }} />
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  scrollContainer: {
    flex: 1,
  },
  addButton: {
    backgroundColor: '#0A7FB8',
  },
  unfollowButton: {
    backgroundColor: '#8B3D3D',
  },
  followBackButton: {
    backgroundColor: '#0B9568',
  },
  errorText: {
    color: 'red',
    fontSize: gameScale(14),
    fontFamily: 'Computerfont',
    textAlign: 'center',
    marginBottom: gameScale(20),
  },
  retryButton: {
    backgroundColor: 'rgba(0, 93, 200, 0.8)',
    padding: gameScale(15),
    borderRadius: gameScale(10),
    borderWidth: gameScale(1),
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  retryButtonText: {
    color: 'white',
    fontSize: gameScale(12),
    fontFamily: 'Computerfont',
  },
});
