import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
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

export default function SocialSearchScreen() {
  const router = useRouter();
  const socialService = useSocialHook();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);
  const [actionPlayerId, setActionPlayerId] = useState(null);
  const [followingIds, setFollowingIds] = useState([]);
  const [followerIds, setFollowerIds] = useState([]);

  const loadRelations = useCallback(async () => {
    try {
      const [followingData, followersData] = await Promise.all([
        socialService.getFollowing(),
        socialService.getFollowers(),
      ]);
      setFollowingIds((followingData || []).map((item) => item.playerId));
      setFollowerIds((followersData || []).map((item) => item.playerId));
    } catch (err) {
      console.error('Failed to load relation sets:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRelations();
    }, [loadRelations])
  );

  const relationLookup = useMemo(() => {
    const followingSet = new Set(followingIds);
    const followerSet = new Set(followerIds);

    return {
      getStatus(playerId) {
        const isFollowing = followingSet.has(playerId);
        const isFollower = followerSet.has(playerId);

        if (isFollowing) {
          return 'following';
        }

        if (isFollower) {
          return 'follower_only';
        }

        return 'none';
      },
    };
  }, [followingIds, followerIds]);

  const handleSearch = useCallback(async () => {
    const trimmed = query.trim();

    if (!trimmed) {
      setResults([]);
      setTotal(0);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await socialService.searchPlayers({ username: trimmed });
      setResults(data.players || []);
      setTotal(data.total || (data.players || []).length);
    } catch (err) {
      setError(err.message || 'Search failed');
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleAction = useCallback(
    async (playerId) => {
      const relation = relationLookup.getStatus(playerId);

      try {
        setActionPlayerId(playerId);

        if (relation === 'following') {
          await socialService.unfollowPlayer(playerId);
          setFollowingIds((prev) => prev.filter((id) => id !== playerId));
          return;
        }

        if (relation === 'follower_only') {
          await socialService.followBackPlayer(playerId);
          setFollowingIds((prev) => (prev.includes(playerId) ? prev : [...prev, playerId]));
          return;
        }

        await socialService.followPlayer(playerId);
        setFollowingIds((prev) => (prev.includes(playerId) ? prev : [...prev, playerId]));
      } catch (err) {
        setError(err.message || 'Action failed');
      } finally {
        setActionPlayerId(null);
      }
    },
    [relationLookup]
  );

  const getActionButtonMeta = (playerId) => {
    const relation = relationLookup.getStatus(playerId);

    if (relation === 'following') {
      return {
        text: 'Unfollow',
        style: styles.unfollowButton,
      };
    }

    if (relation === 'follower_only') {
      return {
        text: 'Follow back',
        style: styles.followBackButton,
      };
    }

    return {
      text: 'Add friend',
      style: styles.addButton,
    };
  };

  const renderPlayer = ({ item }) => {
    const buttonMeta = getActionButtonMeta(item.player_id);

    return (
      <View style={styles.resultRow}>
        <TouchableOpacity
          style={styles.playerInfoPressable}
          activeOpacity={0.85}
          onPress={() => router.push(`/social/${item.player_id}`)}
        >
          <View style={styles.avatarFrameOuter}>
            <View style={styles.avatarFrameInner}>
              <Image
                source={{ uri: item.player_avatar || DEFAULT_AVATAR }}
                style={styles.avatarImage}
              />
            </View>
          </View>

          <View style={styles.playerTextContainer}>
            <Text style={styles.playerName}>{item.player_name || item.username}</Text>
            <Text style={styles.playerUsername}>@{item.username}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, buttonMeta.style]}
          onPress={() => handleAction(item.player_id)}
          disabled={actionPlayerId === item.player_id}
          activeOpacity={0.85}
        >
          {actionPlayerId === item.player_id ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.actionButtonText}>{buttonMeta.text}</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a192f', '#172b4a', '#0a192f']} style={styles.background}>
        <View style={styles.searchHeader}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={gameScale(20)} color="#fff" />
          </TouchableOpacity>

          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={gameScale(16)} color="#CDE8FF" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              style={styles.searchInput}
              placeholder="Search username"
              placeholderTextColor="rgba(255,255,255,0.6)"
              returnKeyType="search"
              onSubmitEditing={handleSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity style={styles.searchButton} onPress={handleSearch} activeOpacity={0.85}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.resultMetaRow}>
          <Ionicons name="people" size={gameScale(16)} color="#D7F2FF" />
          <Text style={styles.resultMetaText}>{total} players found</Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => String(item.player_id)}
            renderItem={renderPlayer}
            contentContainerStyle={[
              styles.listContainer,
              results.length === 0 && styles.emptyListContainer,
            ]}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                Search for players by username to add friends.
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
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: gameScale(10),
    marginBottom: gameScale(10),
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
    marginRight: gameScale(8),
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: gameScale(1),
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: gameScale(12),
    paddingHorizontal: gameScale(10),
    height: gameScale(40),
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    marginLeft: gameScale(8),
    fontFamily: 'DynaPuff',
    fontSize: gameScale(12),
  },
  searchButton: {
    marginLeft: gameScale(8),
    paddingHorizontal: gameScale(10),
    paddingVertical: gameScale(8),
    borderRadius: gameScale(10),
    backgroundColor: '#087EA1',
    borderWidth: gameScale(1),
    borderColor: 'rgba(255,255,255,0.3)',
  },
  searchButtonText: {
    color: '#fff',
    fontFamily: 'DynaPuff',
    fontSize: gameScale(11),
  },
  resultMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: gameScale(14),
    marginBottom: gameScale(8),
    gap: gameScale(6),
  },
  resultMetaText: {
    color: '#D7F2FF',
    fontFamily: 'DynaPuff',
    fontSize: gameScale(12),
  },
  errorText: {
    color: '#FF9B9B',
    fontFamily: 'DynaPuff',
    fontSize: gameScale(11),
    paddingHorizontal: gameScale(14),
    marginBottom: gameScale(8),
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: gameScale(14),
    paddingBottom: gameScale(18),
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#D2E9FF',
    fontFamily: 'DynaPuff',
    fontSize: gameScale(12),
    textAlign: 'center',
    paddingHorizontal: gameScale(16),
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: gameScale(10),
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: gameScale(12),
    borderWidth: gameScale(1),
    borderColor: 'rgba(255,255,255,0.2)',
    padding: gameScale(8),
  },
  playerInfoPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
    width: gameScale(44),
    height: gameScale(44),
    borderRadius: gameScale(8),
  },
  playerTextContainer: {
    marginLeft: gameScale(10),
    flex: 1,
  },
  playerName: {
    color: '#fff',
    fontFamily: 'Grobold',
    fontSize: gameScale(15),
  },
  playerUsername: {
    color: '#C5E8F2',
    fontFamily: 'DynaPuff',
    fontSize: gameScale(10),
    marginTop: gameScale(1),
  },
  actionButton: {
    borderRadius: gameScale(9),
    minWidth: gameScale(88),
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: gameScale(8),
    paddingHorizontal: gameScale(10),
    borderWidth: gameScale(1),
  },
  addButton: {
    backgroundColor: '#0A7FB8',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  unfollowButton: {
    backgroundColor: '#8B3D3D',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  followBackButton: {
    backgroundColor: '#0B9568',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  actionButtonText: {
    color: '#fff',
    fontFamily: 'DynaPuff',
    fontSize: gameScale(10),
  },
});
