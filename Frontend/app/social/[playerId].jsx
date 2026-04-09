import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { gameScale } from '../Components/Responsiveness/gameResponsive';
import { socialService } from '../services/socialService';

const DEFAULT_AVATAR =
  'https://micomi-assets.me/Player%20Avatars/cute-astronaut-playing-vr-game-with-controller-cartoon-vector-icon-illustration-science-technology_138676-13977.avif';

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
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [relationStatus, setRelationStatus] = useState('none');

  const loadProfile = useCallback(async () => {
    if (!playerId) return;

    try {
      setLoading(true);
      setError(null);

      const data = await socialService.getPublicProfile(playerId);
      setProfile(data);
      setRelationStatus(normalizeRelation(data?.relation_status));
    } catch (err) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const actionMeta = useMemo(() => {
    if (relationStatus === 'following') {
      return {
        label: 'Unfollow',
        style: styles.unfollowButton,
      };
    }

    if (relationStatus === 'follower_only') {
      return {
        label: 'Follow back',
        style: styles.followBackButton,
      };
    }

    return {
      label: 'Add friend',
      style: styles.addButton,
    };
  }, [relationStatus]);

  const handleRelationAction = useCallback(async () => {
    if (!playerId) return;

    try {
      setActionLoading(true);

      if (relationStatus === 'following') {
        await socialService.unfollowPlayer(playerId);
        setRelationStatus('none');
        setProfile((prev) => {
          if (!prev) return prev;
          const nextFollowing = Math.max(0, (prev.following_count || prev.friends_count || 0) - 1);
          return { ...prev, following_count: nextFollowing, friends_count: nextFollowing };
        });
        return;
      }

      if (relationStatus === 'follower_only') {
        await socialService.followBackPlayer(playerId);
        setRelationStatus('following');
        setProfile((prev) => {
          if (!prev) return prev;
          const nextFollowing = (prev.following_count || prev.friends_count || 0) + 1;
          return { ...prev, following_count: nextFollowing, friends_count: nextFollowing };
        });
        return;
      }

      await socialService.followPlayer(playerId);
      setRelationStatus('following');
      setProfile((prev) => {
        if (!prev) return prev;
        const nextFollowing = (prev.following_count || prev.friends_count || 0) + 1;
        return { ...prev, following_count: nextFollowing, friends_count: nextFollowing };
      });
    } catch (err) {
      setError(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  }, [playerId, relationStatus]);

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0a192f', '#172b4a', '#0a192f']} style={styles.background}>
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0a192f', '#172b4a', '#0a192f']} style={styles.background}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.back()} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={gameScale(20)} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.centerContent}>
            <Text style={styles.errorText}>{error || 'Profile not found'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  const selectedBadge = profile.selectedBadge || profile.latestAchievement;
  const avatarUri = profile.player_avatar || DEFAULT_AVATAR;
  const followersCount = profile.followers_count ?? profile.follower_count ?? 0;
  const followingCount = profile.following_count ?? profile.friends_count ?? 0;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a192f', '#172b4a', '#0a192f']} style={styles.background}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={gameScale(20)} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile Visit</Text>
          <View style={styles.iconPlaceholder} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.coverContainer}>
            {selectedBadge?.landscape_image ? (
              <ImageBackground
                source={{ uri: selectedBadge.landscape_image }}
                style={styles.coverBackground}
                resizeMode="cover"
              >
                <LinearGradient
                  colors={['rgba(0,0,0,0.1)', 'transparent', 'rgba(0,0,0,0.2)']}
                  style={styles.coverOverlay}
                />
              </ImageBackground>
            ) : (
              <LinearGradient colors={['#0a192f', '#1c2e4a', '#0a192f']} style={styles.coverBackground} />
            )}

            <View style={styles.coverContent}>
              <View style={styles.avatarFrameOuter}>
                <View style={styles.avatarFrameInner}>
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                </View>
              </View>

              <View style={styles.nameGroup}>
                <Text style={styles.playerName}>{profile.player_name}</Text>
                <Text style={styles.playerUsername}>@{profile.username}</Text>
              </View>

              <View style={styles.countsCard}>
                <View style={styles.countCell}>
                  <Text style={styles.countValue}>{followingCount}</Text>
                  <Text style={styles.countLabel}>Friends</Text>
                </View>
                <View style={styles.countDivider} />
                <View style={styles.countCell}>
                  <Text style={styles.countValue}>{followersCount}</Text>
                  <Text style={styles.countLabel}>Followers</Text>
                </View>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.actionButton, actionMeta.style]}
            onPress={handleRelationAction}
            disabled={actionLoading}
            activeOpacity={0.85}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>{actionMeta.label}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Player Stats</Text>
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>Level</Text>
              <Text style={styles.statsValue}>{profile.player_level || 1}</Text>
            </View>
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>XP</Text>
              <Text style={styles.statsValue}>{profile.exp_points || 0}</Text>
            </View>
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>Coins</Text>
              <Text style={styles.statsValue}>{profile.coins || 0}</Text>
            </View>
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>Current Streak</Text>
              <Text style={styles.statsValue}>{profile.current_streak || 0}</Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    paddingTop: gameScale(42),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: gameScale(14),
    marginBottom: gameScale(12),
  },
  iconButton: {
    width: gameScale(36),
    height: gameScale(36),
    borderRadius: gameScale(18),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: gameScale(1),
    borderColor: 'rgba(255,255,255,0.3)',
  },
  iconPlaceholder: {
    width: gameScale(36),
    height: gameScale(36),
  },
  headerTitle: {
    color: '#fff',
    fontFamily: 'Grobold',
    fontSize: gameScale(24),
  },
  scrollContent: {
    paddingHorizontal: gameScale(14),
    paddingBottom: gameScale(22),
  },
  coverContainer: {
    borderRadius: gameScale(16),
    overflow: 'hidden',
    borderWidth: gameScale(1),
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: gameScale(12),
  },
  coverBackground: {
    width: '100%',
    height: gameScale(260),
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  coverContent: {
    ...StyleSheet.absoluteFillObject,
    padding: gameScale(12),
    justifyContent: 'flex-end',
  },
  avatarFrameOuter: {
    alignSelf: 'flex-start',
    borderWidth: gameScale(1.5),
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: gameScale(8),
    padding: gameScale(2),
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  avatarFrameInner: {
    borderWidth: gameScale(0.5),
    borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: gameScale(8),
  },
  avatarImage: {
    width: gameScale(62),
    height: gameScale(62),
    borderRadius: gameScale(8),
  },
  nameGroup: {
    marginTop: gameScale(8),
  },
  playerName: {
    color: '#fff',
    fontFamily: 'Grobold',
    fontSize: gameScale(30),
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  playerUsername: {
    color: '#E0F3FF',
    fontFamily: 'DynaPuff',
    fontSize: gameScale(12),
    marginTop: gameScale(-2),
  },
  countsCard: {
    position: 'absolute',
    right: gameScale(10),
    bottom: gameScale(10),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: gameScale(12),
    paddingVertical: gameScale(8),
    paddingHorizontal: gameScale(10),
    borderWidth: gameScale(1),
    borderColor: 'rgba(255,255,255,0.26)',
  },
  countCell: {
    alignItems: 'center',
    minWidth: gameScale(56),
  },
  countDivider: {
    width: gameScale(1),
    height: gameScale(24),
    marginHorizontal: gameScale(8),
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  countValue: {
    color: '#fff',
    fontFamily: 'Grobold',
    fontSize: gameScale(14),
  },
  countLabel: {
    color: '#D7F4FF',
    fontFamily: 'DynaPuff',
    fontSize: gameScale(10),
  },
  actionButton: {
    borderRadius: gameScale(12),
    paddingVertical: gameScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: gameScale(1),
    marginBottom: gameScale(12),
  },
  addButton: {
    backgroundColor: '#0A7FB8',
    borderColor: 'rgba(255,255,255,0.32)',
  },
  unfollowButton: {
    backgroundColor: '#8B3D3D',
    borderColor: 'rgba(255,255,255,0.32)',
  },
  followBackButton: {
    backgroundColor: '#0B9568',
    borderColor: 'rgba(255,255,255,0.32)',
  },
  actionButtonText: {
    color: '#fff',
    fontFamily: 'DynaPuff',
    fontSize: gameScale(13),
  },
  statsCard: {
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderRadius: gameScale(14),
    borderWidth: gameScale(1),
    borderColor: 'rgba(255,255,255,0.2)',
    padding: gameScale(14),
  },
  statsTitle: {
    color: '#fff',
    fontFamily: 'Grobold',
    fontSize: gameScale(20),
    marginBottom: gameScale(8),
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: gameScale(6),
    borderBottomWidth: gameScale(1),
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  statsLabel: {
    color: '#D7F4FF',
    fontFamily: 'DynaPuff',
    fontSize: gameScale(11),
  },
  statsValue: {
    color: '#fff',
    fontFamily: 'Grobold',
    fontSize: gameScale(14),
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: gameScale(20),
  },
  errorText: {
    color: '#FF9B9B',
    fontFamily: 'DynaPuff',
    fontSize: gameScale(12),
    textAlign: 'center',
    marginBottom: gameScale(10),
  },
  retryButton: {
    paddingHorizontal: gameScale(18),
    paddingVertical: gameScale(10),
    borderRadius: gameScale(10),
    backgroundColor: '#0A7FB8',
  },
  retryButtonText: {
    color: '#fff',
    fontFamily: 'DynaPuff',
    fontSize: gameScale(12),
  },
});
