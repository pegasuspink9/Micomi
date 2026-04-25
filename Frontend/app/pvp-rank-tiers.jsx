import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { gameScale } from './Components/Responsiveness/gameResponsive';
import { pvpService } from './services/pvpService';
import { universalAssetPreloader } from './services/preloader/universalAssetPreloader';

const resolveImageUri = (url) => {
  if (!url) {
    return null;
  }

  const cached = universalAssetPreloader.getCachedAssetPath(url);
  return cached || url;
};

const toLabel = (value) => {
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }

  return String(value);
};

export default function PvpRankTiersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tiers, setTiers] = useState([]);

  const loadRankTiers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await pvpService.getRankTiers();
      setTiers(Array.isArray(response) ? response : []);
    } catch (loadError) {
      setError(loadError?.message || 'Failed to load rank tiers');
      setTiers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRankTiers();
    }, [loadRankTiers])
  );

  const sortedTiers = useMemo(() => {
    return [...tiers].sort((a, b) => {
      const aId = Number(a?.rank_id || 0);
      const bId = Number(b?.rank_id || 0);
      return aId - bId;
    });
  }, [tiers]);

  return (
    <View style={styles.container}>
      <View style={styles.sectionPadding}>
        <View style={styles.panelOuter}>
          <View style={styles.panelMiddle}>
            <View style={styles.panelInner}>
              <View style={styles.headerRow}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>PvP Rank Tiers</Text>
                <View style={styles.headerSpacer} />
              </View>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.loadingText}>Loading rank tiers...</Text>
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={loadRankTiers}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <ScrollView
                  style={styles.scrollView}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContent}
                  nestedScrollEnabled
                >
                  <View style={styles.grid}>
                    {sortedTiers.map((tier) => {
                      const imageUri = resolveImageUri(tier?.image);
                      return (
                        // Renamed style from tierCard to tierContainer for clarity
                        <View key={String(tier?.rank_id || tier?.name)} style={styles.tierContainer}>
                          <View style={styles.imageWrap}>
                            {imageUri ? (
                              <Image source={{ uri: imageUri }} style={styles.tierImage} resizeMode="contain" />
                            ) : (
                              <View style={[styles.tierImage, styles.imagePlaceholder]} />
                            )}
                          </View>

                          <Text style={styles.tierName} numberOfLines={1}>
                            {toLabel(tier?.name)}
                          </Text>
                          {/* Grouped details for better spacing without the card background */}
                          <View style={styles.detailsGroup}>
                            <Text style={styles.tierDetail} numberOfLines={1}>
                              Min: <Text style={styles.detailValue}>{toLabel(tier?.minPoints)}</Text>
                            </Text>
                            <Text style={styles.tierDetail} numberOfLines={1}>
                              Max: <Text style={styles.detailValue}>{tier?.maxPoints === null ? 'No Limit' : toLabel(tier?.maxPoints)}</Text>
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a192f',
  },
  sectionPadding: {
    flex: 1,
    paddingHorizontal: gameScale(6),
    paddingVertical: gameScale(20),
  },
  panelOuter: {
    flex: 1,
    borderRadius: gameScale(16),
    borderWidth: gameScale(1),
    borderTopColor: '#0d1f33',
    borderLeftColor: '#0d1f33',
    borderBottomColor: '#2d5a87',
    borderRightColor: '#2d5a87',
    backgroundColor: '#1e3a5f',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: gameScale(4) },
    shadowOpacity: 0.35,
    shadowRadius: gameScale(6),
    elevation: 8,
    overflow: 'hidden',
  },
  panelMiddle: {
    flex: 1,
    borderRadius: gameScale(14),
    borderWidth: gameScale(1),
    borderTopColor: '#4a90d9',
    borderLeftColor: '#4a90d9',
    borderBottomColor: '#0a1929',
    borderRightColor: '#0a1929',
    backgroundColor: '#152d4a',
    padding: gameScale(1),
    overflow: 'hidden',
  },
  panelInner: {
    flex: 1,
    borderRadius: gameScale(12),
    borderWidth: gameScale(1),
    borderColor: 'rgba(74, 144, 217, 0.35)',
    backgroundColor: '#0f2742',
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: gameScale(10),
    paddingVertical: gameScale(12),
    borderBottomWidth: gameScale(1),
    borderBottomColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(0,0,0,0.2)', // Added slight darken for header separation
  },
  headerTitle: {
    color: '#fff',
    fontFamily: 'Grobold',
    fontSize: gameScale(18),
  },
  headerSpacer: {
    width: gameScale(52),
  },
  backButton: {
    minWidth: gameScale(52),
    paddingVertical: gameScale(5),
    paddingHorizontal: gameScale(9),
    borderRadius: gameScale(8),
    borderWidth: gameScale(1),
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(0,0,0,0.22)',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontFamily: 'Grobold',
    fontSize: gameScale(12),
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: gameScale(13),
    fontFamily: 'DynaPuff',
    marginTop: gameScale(8),
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: gameScale(16),
  },
  errorText: {
    color: '#ffb6b6',
    fontSize: gameScale(12),
    fontFamily: 'DynaPuff',
    textAlign: 'center',
    marginBottom: gameScale(12),
  },
  retryButton: {
    paddingHorizontal: gameScale(18),
    paddingVertical: gameScale(8),
    borderRadius: gameScale(10),
    borderWidth: gameScale(1),
    borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(0, 93, 200, 0.8)',
  },
  retryButtonText: {
    color: '#fff',
    fontFamily: 'Grobold',
    fontSize: gameScale(12),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: gameScale(10),
    paddingVertical: gameScale(20), // Increased vertical padding for the whole list
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: gameScale(24), // Increased gap between rows since there are no cards
  },
  // --- Changed Styles Start Here ---
  tierContainer: {
    width: '48.5%',
    // Removed background, borders, and border radius
    alignItems: 'center',
    paddingBottom: gameScale(10),
  },
  imageWrap: {
    width: '100%',
    height: gameScale(150), // Significantly increased height
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: gameScale(14), // More space between image and text
  },
  tierImage: {
    width: gameScale(180), // Significantly increased image size
    height: gameScale(180),
  },
  imagePlaceholder: {
    borderRadius: gameScale(70), // Adjusted for new size (half of width/height)
    backgroundColor: 'rgba(255,255,255,0.08)', // Made slightly more transparent
  },
  tierName: {
    color: '#fff',
    fontSize: gameScale(17), // Slightly larger font to pop without card bg
    fontFamily: 'Grobold',
    marginTop: gameScale(5),
    marginBottom: gameScale(6),
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  detailsGroup: {
    alignItems: 'center',
    paddingHorizontal: gameScale(10),
  },
  tierDetail: {
    color: '#aaa', // Slightly dimmer label color
    fontSize: gameScale(12), // Slightly larger font
    fontFamily: 'DynaPuff',
    textAlign: 'center',
    marginBottom: gameScale(2),
  },
  detailValue: {
    color: '#dcecff', // Brighter value color
    fontFamily: 'Grobold', // Different font for values for emphasis
  },
  // --- Changed Styles End Here ---
});