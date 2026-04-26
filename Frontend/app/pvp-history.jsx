import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

// Local image assets for stats
const POINTS_ICON = require('../app/Components/icons/points.png');
const COINS_ICON = require('../app/Components/icons/coins.png');

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
  return `${mm}/${dd}/${yyyyy }`;
};

const toLabel = (value) => {
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }

  return String(value);
};

const resolveImageUri = (url) => {
  if (!url) {
    return null;
  }

  const cached = universalAssetPreloader.getCachedAssetPath(url);
  return cached || url;
};

export default function PvpHistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await pvpService.getDailyMatchHistory();
      setHistory(Array.isArray(response) ? response : []);
    } catch (loadError) {
      setError(loadError?.message || 'Failed to load match history');
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => {
      const aTime = new Date(a?.date || 0).getTime();
      const bTime = new Date(b?.date || 0).getTime();
      return bTime - aTime;
    });
  }, [history]);

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
                <Text style={styles.headerTitle}>PvP Match History</Text>
                <View style={styles.headerSpacer} />
              </View>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.loadingText}>Loading history...</Text>
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={loadHistory}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <ScrollView
                  style={styles.historyScrollView}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.historyContent}
                  nestedScrollEnabled
                >
                  {sortedHistory.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No match history yet.</Text>
                    </View>
                  ) : (
                    sortedHistory.map((item, index) => {
                      const characterAvatar = resolveImageUri(item?.character?.character_avatar);
                      const characterPlayerAvatar = resolveImageUri(item?.character?.player_avatar);
                      const playerRankImage = resolveImageUri(item?.character?.player_rank_image);
                      
                      const enemyAvatar = resolveImageUri(item?.enemy?.enemy_avatar);
                      const enemyPlayerAvatar = resolveImageUri(item?.enemy?.player_avatar);
                      const enemyRankImage = resolveImageUri(item?.enemy?.player_rank_image);
                      
                      const status = toLabel(item?.match_status).toUpperCase();
                      const isWin = status === 'WIN';
                      const isLoss = status === 'LOSS' || status === 'LOSE';

                      return (
                        <View key={item?.match_id || `history-${index}`} style={[styles.cardOuter, isLoss && styles.cardOuterLoss]}>
                          
                          {/* Background Container (Fills the entire card) */}
                          <View style={styles.cardBackgroundContainer}>
                            {/* Player Background (Left Half, Blue) */}
                            <View style={[styles.sideBackground, styles.sideBackgroundPlayer]}>
                              
                              {/* Rank Image Container - Centered absolutely behind character */}
                              <View style={styles.rankImageContainer}>
                                {playerRankImage ? (
                                  <Image source={{ uri: playerRankImage }} style={styles.rankBackgroundImage} resizeMode="contain" />
                                ) : (
                                  <View style={[styles.rankBackgroundImage, styles.avatarPlaceholder]} />
                                )}
                              </View>
                              
                              {/* Character Avatar (On top of rank, still behind content) */}
                              {characterAvatar ? (
                                <Image source={{ uri: characterAvatar }} style={styles.characterBackgroundImage} resizeMode="cover" />
                              ) : (
                                <View style={[styles.characterBackgroundImage, styles.avatarPlaceholder]} />
                              )}
                            </View>

                            {/* Enemy Background (Right Half, Red) */}
                            <View style={[styles.sideBackground, styles.sideBackgroundEnemy]}>
                              {/* Rank Image Container (Reversed) - Centered absolutely behind character */}
                              <View style={styles.rankImageContainer}>
                                {enemyRankImage ? (
                                  <Image source={{ uri: enemyRankImage }} style={[styles.rankBackgroundImage, styles.reversedBackground]} resizeMode="contain" />
                                ) : (
                                  <View style={[styles.rankBackgroundImage, styles.reversedBackground, styles.avatarPlaceholder]} />
                                )}
                              </View>

                              {/* Enemy Avatar (Reversed) (On top of rank) */}
                              {enemyAvatar ? (
                                <Image source={{ uri: enemyAvatar }} style={[styles.characterBackgroundImage, styles.reversedBackground]} resizeMode="cover" />
                              ) : (
                                <View style={[styles.characterBackgroundImage, styles.reversedBackground, styles.avatarPlaceholder]} />
                              )}
                            </View>
                          </View>

                          {/* Content Layer (On top of all backgrounds) */}
                          <View style={styles.cardContentLayer}>

                            {/* Header: Player Info & Enemy Info */}
                            <View style={styles.cardHeader}>
                              {/* Player Info (Left) */}
                              <View style={styles.playerInfoRow}>
                                {characterPlayerAvatar ? (
                                  <Image source={{ uri: characterPlayerAvatar }} style={styles.circularAvatar} resizeMode="cover" />
                                ) : (
                                  <View style={[styles.circularAvatar, styles.avatarPlaceholder]} />
                                )}
                                <View>
                                    <Text style={styles.playerName}>{toLabel(item?.character?.player_name)}</Text>
                                    <Text style={styles.heroName}>Hero: {toLabel(item?.character?.character_name)}</Text>
                                </View>
                              </View>
                              {/* Enemy Info (Right - Swapped Order) */}
                              <View style={[styles.playerInfoRow, styles.reversedPlayerInfo]}>
                                {enemyPlayerAvatar ? (
                                  <Image source={{ uri: enemyPlayerAvatar }} style={styles.circularAvatar} resizeMode="cover" />
                                ) : (
                                  <View style={[styles.circularAvatar, styles.avatarPlaceholder]} />
                                )}
                                <View style={{alignItems: 'flex-end'}}>
                                    <Text style={styles.playerName}>{toLabel(item?.enemy?.player_name)}</Text>
                                    <Text style={styles.heroName}>Hero: {toLabel(item?.enemy?.enemy_name)}</Text>
                                </View>
                              </View>
                            </View>

                            {/* Center: Status & Stats */}
                            <View style={styles.cardCenterContent}>
                              {/* Player Stats (Left, Bottom) */}
                              <View style={styles.statsContainer}>
                                <View style={styles.statItem}>
                                  <Image source={POINTS_ICON} style={styles.statIcon} resizeMode="contain" />
                                  <Text style={styles.sideText}>{toLabel(item?.character?.points)}</Text>
                                </View>
                                <View style={styles.statItem}>
                                  <Image source={COINS_ICON} style={styles.statIcon} resizeMode="contain" />
                                  <Text style={styles.sideText}>{toLabel(item?.character?.coins)}</Text>
                                </View>
                              </View>

                              {/* Status (Centered Vertically) */}
                              <View style={styles.statusContainer}>
                                <Text style={[styles.statusText, isWin && styles.statusTextWin, isLoss && styles.statusTextLoss]}>{status}</Text>
                              </View>

                              {/* Enemy Stats (Right, Bottom) */}
                              <View style={[styles.statsContainer, styles.reversedStats]}>
                                <View style={styles.statItem}>
                                  <Image source={POINTS_ICON} style={styles.statIcon} resizeMode="contain" />
                                  <Text style={styles.sideTextRight}>{toLabel(item?.enemy?.points)}</Text>
                                </View>
                                <View style={styles.statItem}>
                                  <Image source={COINS_ICON} style={styles.statIcon} resizeMode="contain" />
                                  <Text style={styles.sideTextRight}>{toLabel(item?.enemy?.coins)}</Text>
                                </View>
                              </View>
                            </View>

                            {/* Footer: Date (Bottom) */}
                            <View style={styles.cardFooter}>
                              <Text style={styles.dateText}>{formatDateFiveYear(item?.date)}</Text>
                            </View>

                          </View>
                        </View>
                      );
                    })
                  )}
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
  historyScrollView: {
    flex: 1,
  },
  historyContent: {
    paddingHorizontal: gameScale(8),
    paddingVertical: gameScale(10),
    gap: gameScale(10),
  },
  emptyContainer: {
    paddingVertical: gameScale(50),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Grobold',
    fontSize: gameScale(13),
  },
  // Card Styles
  cardOuter: {
    borderRadius: gameScale(12),
    borderWidth: gameScale(2), // Thicker border for win/loss
    borderColor: '#4a90d9', // Default win/draw border
    backgroundColor: '#1e3a5f',
    overflow: 'hidden',
    height: gameScale(180), // Fixed height for the card
    position: 'relative',
  },
  cardOuterLoss: {
    borderColor: '#ff4d4d', // Red border for loss
  },

  // Background Layer
  cardBackgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 0,
  },
  sideBackground: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center', // Center content (like rank image) vertically
    alignItems: 'center', // Center content (like rank image) horizontally
  },
  sideBackgroundPlayer: {
    backgroundColor: 'rgba(0, 0, 255, 0.3)', // Blue tint
  },
  sideBackgroundEnemy: {
    backgroundColor: 'rgba(255, 0, 0, 0.3)', // Red tint
  },

  // Rank Image Styling
  rankImageContainer: {
    position: 'absolute', // Position absolutely within sideBackground
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center', // Center image vertically
    alignItems: 'center', // Center image horizontally
    zIndex: 1, // Behind character avatar
  },
  rankBackgroundImage: {
    width: gameScale(300), 
    height: gameScale(300),
    opacity: 0.6, 
  },

  // Character Avatar Styling
  characterBackgroundImage: {
    position: 'absolute', // Position absolutely within sideBackground
    top: 0,
    left: gameScale(-60), // Shift player avatar slightly to the right
    right: 0,
    bottom: 0,
    width: gameScale(290),
    height: gameScale(290),
    alignSelf: 'center',
    opacity: 1, // Full opacity for character avatars
    zIndex: 2, // Character is on top of rank
  },
  reversedBackground: {
    transform: [{ scaleX: -1 }], // Flip enemy background
  },

  // Content Layer
  cardContentLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3, // Content on top of all backgrounds
    padding: gameScale(8),
    justifyContent: 'space-between', // Header, Center, Footer
  },

  // Header (Player Info)
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Align to top
  },
  playerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gameScale(8),
  },
  reversedPlayerInfo: {
    flexDirection: 'row-reverse',
  },
  circularAvatar: {
    width: gameScale(36),
    height: gameScale(36),
    borderRadius: gameScale(18),
    borderWidth: gameScale(1),
    borderColor: 'rgba(255,255,255,0.8)',
  },
  playerName: {
    color: '#fff',
    fontSize: gameScale(12),
    fontFamily: 'Grobold',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  heroName: {
    color: '#eaf5ff', // Lighter text color for hero name
    fontSize: gameScale(10),
    fontFamily: 'DynaPuff',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  // Center (Status & Stats)
  cardCenterContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end', // Align stats to bottom
    justifyContent: 'space-between',
    paddingHorizontal: gameScale(4),
    marginBottom: gameScale(4),
  },
  statusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1, // Take up remaining space in center
    marginBottom: gameScale(30), // Push status up slightly
  },
  statusText: {
    color: '#ffd700', // Default yellow
    fontSize: gameScale(40), // Larger font for status
    fontFamily: 'Grobold',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    textAlign: 'center',
  },
  statusTextWin: {
    color: '#06c32c', // Green for win
  },
  statusTextLoss: {
    color: '#ff4d4d', // Red for loss
  },
  statsContainer: {
    gap: gameScale(4),
    alignItems: 'flex-start',
  },
  reversedStats: {
    alignItems: 'flex-end',
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    width: gameScale(24),
    height: gameScale(24),
    marginBottom: gameScale(2),
  },
  sideText: {
    color: '#f4e7d1',
    fontSize: gameScale(10),
    fontFamily: 'DynaPuff',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  sideTextRight: {
    color: '#f4e7d1',
    fontSize: gameScale(10),
    fontFamily: 'DynaPuff',
    textAlign: 'right',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  // Footer (Date)
  cardFooter: {
    alignItems: 'center',
    marginTop: gameScale(4),
  },
  dateText: {
    color: '#eaf5ff',
    fontSize: gameScale(10),
    fontFamily: 'DynaPuff',
    opacity: 0.8,
  },

  avatarPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});