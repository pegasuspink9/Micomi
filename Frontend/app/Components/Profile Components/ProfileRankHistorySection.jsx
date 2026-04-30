import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { gameScale } from '../Responsiveness/gameResponsive';
import { universalAssetPreloader } from '../../services/preloader/universalAssetPreloader';

const POINTS_ICON = require('../icons/points.png');
const COINS_ICON = require('../icons/coins.png');

const toLabel = (value) => {
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }

  return String(value);
};

const formatDate = (isoDate) => {
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

const resolveImageUri = (url) => {
  if (!url) {
    return null;
  }

  const cached = universalAssetPreloader.getCachedAssetPath(url);
  return cached || url;
};

const ProfileRankHistorySection = ({ history = [], loading = false, error = null, onRetry }) => {
  const limitedHistory = useMemo(() => history.slice(0, 10), [history]);

  return (
    <View style={styles.historySection}>
      <Text style={styles.sectionTitle}>History</Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
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
          {!limitedHistory.length ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No match history yet.</Text>
            </View>
          ) : (
            limitedHistory.map((item, index) => {
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
                        <View style={styles.cardBackgroundContainer}>
                          <View style={[styles.sideBackground, styles.sideBackgroundPlayer]}>
                            <View style={styles.rankImageContainer}>
                              {playerRankImage ? (
                                <Image source={{ uri: playerRankImage }} style={styles.rankBackgroundImage} resizeMode="contain" />
                              ) : (
                                <View style={[styles.rankBackgroundImage, styles.avatarPlaceholder]} />
                              )}
                            </View>

                            {characterAvatar ? (
                              <Image source={{ uri: characterAvatar }} style={styles.characterBackgroundImage} resizeMode="cover" />
                            ) : (
                              <View style={[styles.characterBackgroundImage, styles.avatarPlaceholder]} />
                            )}
                          </View>

                          <View style={[styles.sideBackground, styles.sideBackgroundEnemy]}>
                            <View style={styles.rankImageContainer}>
                              {enemyRankImage ? (
                                <Image source={{ uri: enemyRankImage }} style={[styles.rankBackgroundImage, styles.reversedBackground]} resizeMode="contain" />
                              ) : (
                                <View style={[styles.rankBackgroundImage, styles.reversedBackground, styles.avatarPlaceholder]} />
                              )}
                            </View>

                            {enemyAvatar ? (
                              <Image source={{ uri: enemyAvatar }} style={[styles.characterBackgroundImage, styles.reversedBackground]} resizeMode="cover" />
                            ) : (
                              <View style={[styles.characterBackgroundImage, styles.reversedBackground, styles.avatarPlaceholder]} />
                            )}
                          </View>
                        </View>

                        <View style={styles.cardContentLayer}>
                          <View style={styles.cardHeader}>
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

                            <View style={[styles.playerInfoRow, styles.reversedPlayerInfo]}>
                              {enemyPlayerAvatar ? (
                                <Image source={{ uri: enemyPlayerAvatar }} style={styles.circularAvatar} resizeMode="cover" />
                              ) : (
                                <View style={[styles.circularAvatar, styles.avatarPlaceholder]} />
                              )}
                              <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.playerName}>{toLabel(item?.enemy?.player_name)}</Text>
                                <Text style={styles.heroName}>Hero: {toLabel(item?.enemy?.enemy_name)}</Text>
                              </View>
                            </View>
                          </View>

                          <View style={styles.cardCenterContent}>
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

                            <View style={styles.statusContainer}>
                              <Text style={[styles.statusText, isWin && styles.statusTextWin, isLoss && styles.statusTextLoss]}>{status}</Text>
                            </View>

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

                          <View style={styles.cardFooter}>
                            <Text style={styles.dateText}>{formatDate(item?.date)}</Text>
                          </View>
                        </View>
                      </View>
                    );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  historySection: {
    marginBottom: gameScale(16),
    paddingHorizontal: gameScale(12),
  },
  sectionTitle: {
    fontSize: gameScale(35),
    color: 'white',
    fontFamily: 'MusicVibes',
    marginBottom: gameScale(14),
    textAlign: 'center',
    textShadowColor: '#000000ff',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  historyScrollView: {
    maxHeight: gameScale(540),
  },
  historyContent: {
    paddingHorizontal: gameScale(8),
    paddingVertical: gameScale(10),
    gap: gameScale(10),
  },
  loadingContainer: {
    minHeight: gameScale(180),
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
    minHeight: gameScale(180),
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
  emptyContainer: {
    minHeight: gameScale(180),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Grobold',
    fontSize: gameScale(13),
  },
  cardOuter: {
    borderRadius: gameScale(12),
    borderWidth: gameScale(2),
    borderColor: '#4a90d9',
    backgroundColor: '#1e3a5f',
    overflow: 'hidden',
    height: gameScale(180),
    position: 'relative',
  },
  cardOuterLoss: {
    borderColor: '#ff4d4d',
  },
  cardBackgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 0,
  },
  sideBackground: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideBackgroundPlayer: {
    backgroundColor: 'rgba(0, 0, 255, 0.3)',
  },
  sideBackgroundEnemy: {
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
  },
  rankImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  rankBackgroundImage: {
    width: gameScale(300),
    height: gameScale(300),
    opacity: 0.6,
  },
  characterBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: gameScale(-60),
    right: 0,
    bottom: 0,
    width: gameScale(290),
    height: gameScale(290),
    alignSelf: 'center',
    opacity: 1,
    zIndex: 2,
  },
  reversedBackground: {
    transform: [{ scaleX: -1 }],
  },
  cardContentLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
    padding: gameScale(8),
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    color: '#eaf5ff',
    fontSize: gameScale(10),
    fontFamily: 'DynaPuff',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  cardCenterContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: gameScale(4),
    marginBottom: gameScale(4),
  },
  statusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginBottom: gameScale(30),
  },
  statusText: {
    color: '#ffd700',
    fontSize: gameScale(40),
    fontFamily: 'Grobold',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    textAlign: 'center',
  },
  statusTextWin: {
    color: '#06c32c',
  },
  statusTextLoss: {
    color: '#ff4d4d',
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

export default ProfileRankHistorySection;
