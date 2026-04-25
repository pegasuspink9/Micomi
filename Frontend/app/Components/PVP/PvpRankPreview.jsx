import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { gameScale } from '../Responsiveness/gameResponsive';
import { playerService } from '../../services/playerService';
import { universalAssetPreloader } from '../../services/preloader/universalAssetPreloader';

const { width } = Dimensions.get('window');

const PvpRankPreview = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);

  // Border colors object removed as it's no longer needed for complex layers

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await playerService.getPlayerProfile();

        if (!mounted) {
          return;
        }

        setProfile({
          playerRankName: data?.player_rank_name || 'Unranked',
          playerRankImage: data?.player_rank_image || null,
          currentPoints: data?.player_rank_progress?.player_current_points || 0,
          requiredPoints: data?.player_rank_progress?.player_required_points || 0,
          nextRankName: data?.player_rank_progress?.player_next_rank_name || 'Unknown',
        });
      } catch (fetchError) {
        if (mounted) {
          setError(fetchError?.message || 'Failed to load player rank');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const rankImageSource = useMemo(() => {
    const sourceUrl = profile?.playerRankImage;
    if (!sourceUrl) {
      return null;
    }

    const cached = universalAssetPreloader.getCachedAssetPath(sourceUrl);
    return { uri: cached || sourceUrl };
  }, [profile?.playerRankImage]);

  return (
    <TouchableOpacity
      style={styles.previewContainer}
      activeOpacity={0.88}
      onPress={() => router.push('/pvp-rank-tiers')}
    >
      {/* Single wrapper for the blue border instead of nested ones */}
      <View style={styles.cardWrapper}>
        <LinearGradient
          colors={['#1e3a5f', '#0d1f33']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.headerTitle}>Player Rank</Text>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <View style={styles.contentRow}>
              <View style={styles.leftCol}>
                {rankImageSource ? (
                  <Image source={rankImageSource} style={styles.rankImage} resizeMode="contain" />
                ) : (
                  <View style={styles.rankImagePlaceholder} />
                )}
              </View>

              <View style={styles.rightCol}>
                <Text style={styles.rankNameText} numberOfLines={1}>
                  {profile?.playerRankName || 'Unranked'}
                </Text>
                <Text style={styles.rankPointsText} numberOfLines={1}>
                  {profile?.currentPoints || 0}
                </Text>
                <Text style={styles.rankSubText}>
                  {profile?.requiredPoints || 0} more to {profile?.nextRankName || 'Unknown'}
                </Text>
              </View>
            </View>
          )}
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  previewContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  // New single card wrapper style replacing the nested borders
  cardWrapper: {
    width: '100%',
    maxWidth: width,
    borderRadius: gameScale(12),
    borderWidth: gameScale(2), // Slightly thicker single border
    borderColor: '#4a90d9', // Solid blue color
    overflow: 'hidden', // Important to clip the large absolute image
    backgroundColor: '#1e3a5f',
    shadowColor: '#000',
    shadowOffset: { width: gameScale(1), height: gameScale(2) },
    shadowOpacity: 0.5,
    shadowRadius: gameScale(4),
    elevation: 6,
  },
  gradient: {
    width: '100%',
    alignSelf: 'stretch',
    paddingHorizontal: gameScale(12),
    paddingVertical: gameScale(12),
  },
  headerTitle: {
    color: '#fff',
    fontFamily: 'Grobold',
    marginBottom: gameScale(2),
    fontSize: gameScale(15), // Reduced margin
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    zIndex: 3, // Ensure header is on top
  },
  loadingWrap: {
    minHeight: gameScale(64),
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ffb6b6',
    fontSize: gameScale(11),
    fontFamily: 'DynaPuff',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: gameScale(70), // Ensure row has height for vertical centering
  },
  leftCol: {
    // Fixed width to define the column space
    width: gameScale(70),
    height: '100%', // Take full height of the row
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative', // Needed for absolute positioning of child image
    zIndex: 1, // Lower z-index than text
  },
  rightCol: {
    flex: 1,
    justifyContent: 'center',
    zIndex: 2, // Higher z-index ensures text is on top of the image bleed
    paddingLeft: gameScale(10), // Add spacing here instead of gap
  },
  rankImage: {
    position: 'absolute', // Make absolute
    width: gameScale(180), // Much bigger dimension
    height: gameScale(180),
    left: gameScale(-50), 
    // Center vertically roughly based on parent height
    top: gameScale(-55), 
    opacity: 0.4, // Fade it out so text is readable
  },
  rankImagePlaceholder: {
    width: gameScale(52),
    height: gameScale(52),
    borderRadius: gameScale(26),
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  rankNameText: {
    color: '#f4e7d1',
    fontSize: gameScale(15), // Slightly larger
    fontFamily: 'Grobold',
    textShadowColor: 'rgba(0,0,0,0.8)', // Stronger shadow for readability over image
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  rankPointsText: {
    color: '#ffd700',
    fontSize: gameScale(16), // Slightly larger
    fontFamily: 'Grobold',
    marginTop: gameScale(2),
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  rankSubText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: gameScale(10),
    fontFamily: 'DynaPuff',
    marginTop: gameScale(2),
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
});

export default React.memo(PvpRankPreview);