import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gameScale } from '../Responsiveness/gameResponsive';
import { playerService } from '../../services/playerService';
import { universalAssetPreloader } from '../../services/preloader/universalAssetPreloader';

const { width } = Dimensions.get('window');

const PvpRankPreview = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);

  const borderColors = {
    outerBg: '#1e3a5f',
    outerBorderTop: '#0d1f33',
    outerBorderBottom: '#2d5a87',
    middleBg: '#152d4a',
    middleBorderTop: '#4a90d9',
    middleBorderBottom: '#0a1929',
    innerBg: 'rgba(74, 144, 217, 0.15)',
    innerBorder: 'rgba(74, 144, 217, 0.3)',
  };

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
    <View style={styles.previewContainer}>
      <View
        style={[
          styles.cardBorderOuter,
          {
            backgroundColor: borderColors.outerBg,
            borderTopColor: borderColors.outerBorderTop,
            borderLeftColor: borderColors.outerBorderTop,
            borderBottomColor: borderColors.outerBorderBottom,
            borderRightColor: borderColors.outerBorderBottom,
          },
        ]}
      >
        <View
          style={[
            styles.cardBorderMiddle,
            {
              backgroundColor: borderColors.middleBg,
              borderTopColor: borderColors.middleBorderTop,
              borderLeftColor: borderColors.middleBorderTop,
              borderBottomColor: borderColors.middleBorderBottom,
              borderRightColor: borderColors.middleBorderBottom,
            },
          ]}
        >
          <View
            style={[
              styles.cardBorderInner,
              {
                backgroundColor: borderColors.innerBg,
                borderColor: borderColors.innerBorder,
              },
            ]}
          >
            <LinearGradient
              colors={['#1e3a5f', '#0d1f33']}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.headerTitle}>Players Rank</Text>

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
                    <Text style={styles.rankSubText} numberOfLines={1}>
                      {profile?.requiredPoints || 0} to {profile?.nextRankName || 'Unknown'}
                    </Text>
                  </View>
                </View>
              )}
            </LinearGradient>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  previewContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  cardBorderOuter: {
    width: '100%',
    maxWidth: width,
    borderWidth: gameScale(1),
    borderRadius: gameScale(12),
    shadowColor: '#000',
    shadowOffset: { width: gameScale(1), height: gameScale(1) },
    shadowOpacity: 0.6,
    shadowRadius: gameScale(2),
    elevation: 8,
    overflow: 'hidden',
  },
  cardBorderMiddle: {
    borderWidth: gameScale(1),
    padding: gameScale(1),
    borderRadius: gameScale(10),
    overflow: 'hidden',
  },
  cardBorderInner: {
    borderRadius: gameScale(8),
    borderWidth: gameScale(1),
    overflow: 'hidden',
  },
  gradient: {
    width: '100%',
    alignSelf: 'stretch',
    borderRadius: gameScale(6),
    paddingHorizontal: gameScale(12),
    paddingVertical: gameScale(12),
    backgroundColor: '#1e3a5f',
  },
  headerTitle: {
    color: '#fff',
    fontFamily: 'Grobold',
    marginBottom: gameScale(8),
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
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
    gap: gameScale(10),
  },
  leftCol: {
    width: gameScale(62),
    height: gameScale(62),
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightCol: {
    flex: 1,
    justifyContent: 'center',
  },
  rankImage: {
    width: gameScale(62),
    height: gameScale(62),
  },
  rankImagePlaceholder: {
    width: gameScale(52),
    height: gameScale(52),
    borderRadius: gameScale(26),
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  rankNameText: {
    color: '#f4e7d1',
    fontSize: gameScale(13),
    fontFamily: 'Grobold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  rankPointsText: {
    color: '#ffd700',
    fontSize: gameScale(14),
    fontFamily: 'Grobold',
    marginTop: gameScale(2),
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  rankSubText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: gameScale(10),
    fontFamily: 'DynaPuff',
    marginTop: gameScale(2),
  },
});

export default React.memo(PvpRankPreview);
