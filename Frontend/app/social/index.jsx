import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { gameScale } from '../Components/Responsiveness/gameResponsive';
import { useSocialHook } from '../hooks/useSocialHook';

const DEFAULT_AVATAR =
  'https://micomi-assets.me/Player%20Avatars/cute-astronaut-playing-vr-game-with-controller-cartoon-vector-icon-illustration-science-technology_138676-13977.avif';

export default function SocialConnectionsScreen() {
  const router = useRouter();
  const socialService = useSocialHook();
  const [activeTab, setActiveTab] = useState('following');
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadConnections = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      const [followingData, followersData] = await Promise.all([
        socialService.getFollowing(),
        socialService.getFollowers(),
      ]);

      setFollowing(followingData || []);
      setFollowers(followersData || []);
    } catch (err) {
      setError(err.message || 'Failed to load social connections');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadConnections();
    }, [loadConnections])
  );

  const listData = useMemo(() => {
    return activeTab === 'following' ? following : followers;
  }, [activeTab, following, followers]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadConnections({ silent: true });
  }, [loadConnections]);

  const openPlayer = useCallback(
    (playerId) => {
      router.push(`/social/${playerId}`);
    },
    [router]
  );

  const renderItem = ({ item }) => {
    const avatarSource = { uri: item.playerAvatar || DEFAULT_AVATAR };

    return (
      <TouchableOpacity
        style={styles.playerRow}
        activeOpacity={0.85}
        onPress={() => openPlayer(item.playerId)}
      >
        <View style={styles.avatarFrameOuter}>
          <View style={styles.avatarFrameInner}>
            <Image source={avatarSource} style={styles.avatarImage} />
          </View>
        </View>

        <View style={styles.playerTextContainer}>
          <Text style={styles.playerName}>{item.playerName}</Text>
          <Text style={styles.playerUsername}>@{item.username}</Text>
        </View>

        <View style={styles.levelPill}>
          <Text style={styles.levelPillText}>Lv {item.level || 1}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a192f', '#172b4a', '#0a192f']} style={styles.background}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={gameScale(20)} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Friends</Text>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/social/search')}
            activeOpacity={0.8}
          >
            <Ionicons name="person-add" size={gameScale(20)} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'following' && styles.tabButtonActive]}
            onPress={() => setActiveTab('following')}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabLabel, activeTab === 'following' && styles.tabLabelActive]}>
              Following ({following.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'followers' && styles.tabButtonActive]}
            onPress={() => setActiveTab('followers')}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabLabel, activeTab === 'followers' && styles.tabLabelActive]}>
              Followers ({followers.length})
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        ) : error ? (
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => loadConnections()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={listData}
            keyExtractor={(item) => String(item.playerId)}
            renderItem={renderItem}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            contentContainerStyle={[
              styles.listContainer,
              listData.length === 0 && styles.emptyListContainer,
            ]}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {activeTab === 'following'
                  ? 'You are not following anyone yet.'
                  : 'No followers yet.'}
              </Text>
            }
          />
        )}
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
    paddingTop: gameScale(44),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: gameScale(14),
    marginBottom: gameScale(12),
  },
  iconButton: {
    width: gameScale(38),
    height: gameScale(38),
    borderRadius: gameScale(19),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: gameScale(1),
    borderColor: 'rgba(255,255,255,0.35)',
  },
  headerTitle: {
    color: '#fff',
    fontFamily: 'Grobold',
    fontSize: gameScale(26),
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: gameScale(14),
    marginBottom: gameScale(10),
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: gameScale(12),
    padding: gameScale(4),
    borderWidth: gameScale(1),
    borderColor: 'rgba(255,255,255,0.18)',
  },
  tabButton: {
    flex: 1,
    borderRadius: gameScale(10),
    paddingVertical: gameScale(10),
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(66, 211, 255, 0.28)',
  },
  tabLabel: {
    color: '#D2E9FF',
    fontFamily: 'DynaPuff',
    fontSize: gameScale(12),
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: gameScale(20),
  },
  errorText: {
    color: '#FF8A8A',
    fontFamily: 'DynaPuff',
    fontSize: gameScale(12),
    textAlign: 'center',
    marginBottom: gameScale(12),
  },
  retryButton: {
    paddingHorizontal: gameScale(18),
    paddingVertical: gameScale(10),
    backgroundColor: '#007DA2',
    borderRadius: gameScale(10),
  },
  retryButtonText: {
    color: '#fff',
    fontFamily: 'DynaPuff',
    fontSize: gameScale(12),
  },
  listContainer: {
    paddingHorizontal: gameScale(14),
    paddingBottom: gameScale(16),
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#D2E9FF',
    fontFamily: 'DynaPuff',
    fontSize: gameScale(13),
    textAlign: 'center',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: gameScale(1),
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: gameScale(12),
    paddingVertical: gameScale(10),
    paddingHorizontal: gameScale(10),
    marginBottom: gameScale(10),
  },
  avatarFrameOuter: {
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
    width: gameScale(46),
    height: gameScale(46),
    borderRadius: gameScale(8),
  },
  playerTextContainer: {
    flex: 1,
    marginLeft: gameScale(10),
  },
  playerName: {
    color: '#fff',
    fontFamily: 'Grobold',
    fontSize: gameScale(16),
  },
  playerUsername: {
    color: '#C5E8F2',
    fontFamily: 'DynaPuff',
    fontSize: gameScale(11),
    marginTop: gameScale(2),
  },
  levelPill: {
    backgroundColor: 'rgba(0, 201, 255, 0.3)',
    borderRadius: gameScale(999),
    borderWidth: gameScale(1),
    borderColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: gameScale(10),
    paddingVertical: gameScale(4),
  },
  levelPillText: {
    color: '#fff',
    fontFamily: 'DynaPuff',
    fontSize: gameScale(10),
  },
});
