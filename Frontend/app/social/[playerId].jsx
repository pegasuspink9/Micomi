import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';

import { gameScale } from '../Components/Responsiveness/gameResponsive';
import PlayerInfoSection from '../Components/Profile Components/PlayerInfoSection';
import StatsGridSection from '../Components/Profile Components/StatsGridSection';
import InventorySection from '../Components/Profile Components/InventorySection';
import { playerService } from '../services/playerService';
import { useSocialHook } from '../hooks/useSocialHook';


const normalizeRelation = (relation) => {
  const raw = String(relation || '').toLowerCase();

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
  const socialService = useSocialHook();

  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inventoryTab, setInventoryTab] = useState('Badges');
  const [actionLoading, setActionLoading] = useState(false);
  const [relationStatus, setRelationStatus] = useState('none');

  const loadProfile = useCallback(async () => {
    if (!playerId) return;

    try {
      setLoading(true);
      setError(null);

      const apiData = await socialService.getPublicProfile(playerId);
      const transformTarget = { ...(apiData || {}) };

      if (!transformTarget.selectedBadge) {
        transformTarget.selectedBadge = transformTarget.latestAchievement || null;
      }

      const transformedData = playerService.transformPlayerData(transformTarget);
      setPlayerData(transformedData);
      setRelationStatus(normalizeRelation(apiData?.relation_status));
    } catch (err) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [playerId, socialService]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const handleRelationAction = useCallback(async () => {
    if (!playerId) return;

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
    relationStatus === 'following'
      ? { label: 'Unfollow', style: styles.unfollowButton }
      : relationStatus === 'follower_only'
      ? { label: 'Follow back', style: styles.followBackButton }
      : { label: 'Add friend', style: styles.addButton };

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
            playerLevel={playerData.playerLevel}
            expPoints={playerData.expPoints}
            maxLevelExp={playerData.maxLevelExp}
            playerAvatar={playerData.playerAvatar}
            onAvatarPress={() => {}}
            friendsCount={playerData.friendsCount}
            followerCount={playerData.followerCount}
            onSocialPress={() => {}}
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
            disableHeroPress={true}
          />

          <TouchableOpacity
            style={[styles.relationButton, relationButtonMeta.style]}
            onPress={handleRelationAction}
            disabled={actionLoading}
            activeOpacity={0.85}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.relationButtonText}>{relationButtonMeta.label}</Text>
            )}
          </TouchableOpacity>

          <InventorySection
            activeTab={inventoryTab}
            setActiveTab={setInventoryTab}
            badges={playerData.badges || []}
            potions={playerData.potions || []}
            viewPlayerId={playerId}
          />

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
  relationButton: {
    alignSelf: 'center',
    minWidth: gameScale(95),
    width: '48%',
    borderRadius: gameScale(10),
    borderWidth: gameScale(1),
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: gameScale(12),
    paddingVertical: gameScale(10),
    marginTop: gameScale(4),
    marginBottom: gameScale(14),
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
  relationButtonText: {
    color: '#fff',
    fontFamily: 'DynaPuff',
    fontSize: gameScale(11),
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
