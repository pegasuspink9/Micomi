import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { gameScale } from '../Responsiveness/gameResponsive';
import { pvpService } from '../../services/pvpService';

const { width } = Dimensions.get('window');

const formatDateFiveYear = (isoDate) => {
  if (!isoDate) {
    return 'N/A';
  }

  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return 'N/A';
  }

  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  const dd = String(parsed.getDate()).padStart(2, '0');
  const yyyyy = String(parsed.getFullYear()).padStart(5, '0');
  return `${mm}/${dd}/${yyyyy}`;
};

const PvpMatchHistoryPreview = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [matches, setMatches] = useState([]);

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

    const loadHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const history = await pvpService.getDailyMatchHistory();

        if (!mounted) {
          return;
        }

        setMatches(Array.isArray(history) ? history : []);
      } catch (fetchError) {
        if (mounted) {
          setError(fetchError?.message || 'Failed to load match history');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadHistory();

    return () => {
      mounted = false;
    };
  }, []);

  const firstMatch = useMemo(() => {
    return Array.isArray(matches) && matches.length > 0 ? matches[0] : null;
  }, [matches]);

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={styles.previewContainer}
      onPress={() => router.push('/pvp-history')}
    >
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
              <Text style={styles.headerTitle}>Match History</Text>

              {loading ? (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              ) : error ? (
                <Text style={styles.errorText} numberOfLines={2}>{error}</Text>
              ) : firstMatch ? (
                <View>
                  <Text style={styles.previewText} numberOfLines={1}>
                    ID: {firstMatch.match_id || 'N/A'}
                  </Text>
                  <Text style={styles.previewText} numberOfLines={1}>
                    Status: {String(firstMatch.match_status || 'unknown').toUpperCase()}
                  </Text>
                  <Text style={styles.previewText} numberOfLines={1}>
                    Date: {formatDateFiveYear(firstMatch.date)}
                  </Text>
                </View>
              ) : (
                <Text style={styles.previewText}>No history yet</Text>
              )}

              <Text style={styles.tapText}>Tap to view full history</Text>
            </LinearGradient>
          </View>
        </View>
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
    minHeight: gameScale(110),
    justifyContent: 'space-between',
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
    minHeight: gameScale(38),
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ffb6b6',
    fontSize: gameScale(10),
    fontFamily: 'DynaPuff',
  },
  previewText: {
    color: '#f4e7d1',
    fontSize: gameScale(10),
    fontFamily: 'Grobold',
    marginBottom: gameScale(3),
  },
  tapText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: gameScale(9),
    fontFamily: 'DynaPuff',
    marginTop: gameScale(6),
  },
});

export default React.memo(PvpMatchHistoryPreview);
