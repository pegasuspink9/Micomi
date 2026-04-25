import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { gameScale } from '../Responsiveness/gameResponsive';
import { pvpService } from '../../services/pvpService';
import { universalAssetPreloader } from '../../services/preloader/universalAssetPreloader';

// Local image assets for stats
const POINTS_ICON = require('../icons/points.png');
const COINS_ICON = require('../icons/coins.png');

// --- Helper Functions (Unchanged) ---
const formatDateFiveYear = (isoDate) => {
  if (!isoDate) return 'N/A';
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  const dd = String(parsed.getDate()).padStart(2, '0');
  const yyyyy = String(parsed.getFullYear()).padStart(5, '0');
  return `${mm}/${dd}/${yyyyy}`;
};

const toLabel = (value) => {
  if (value === null || value === undefined || value === '') return 'N/A';
  return String(value);
};

const resolveImageUri = (url) => {
  if (!url) return null;
  const cached = universalAssetPreloader.getCachedAssetPath(url);
  return cached || url;
};
// ------------------------------------

const PvpMatchHistoryPreview = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    let mounted = true;
    const loadHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const history = await pvpService.getDailyMatchHistory();
        if (!mounted) return;
        setMatches(Array.isArray(history) ? history : []);
      } catch (fetchError) {
        if (mounted) setError(fetchError?.message || 'Failed to load match history');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadHistory();
    return () => { mounted = false; };
  }, []);

  const firstMatch = useMemo(() => {
    return Array.isArray(matches) && matches.length > 0 ? matches[0] : null;
  }, [matches]);

  // --- Loading/Error/Empty States (Kept mostly same, just adjusted container height) ---
  const renderPlaceholderCard = (content) => (
    <TouchableOpacity activeOpacity={0.88} onPress={() => router.push('/pvp-history')}>
      <View style={[styles.cardOuter, styles.centerContentCard]}>
        {content}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return renderPlaceholderCard(
      <>
        <ActivityIndicator size="small" color="#fff" />
        <Text style={styles.placeholderText}>Loading latest match...</Text>
      </>
    );
  }

  if (error) {
    return renderPlaceholderCard(
      <>
        <Text style={[styles.placeholderText, styles.errorText]} numberOfLines={1}>{error}</Text>
        <Text style={styles.tapText}>Tap to view full history</Text>
      </>
    );
  }

  if (!firstMatch) {
    return renderPlaceholderCard(
      <>
        <Text style={styles.placeholderText}>No match history yet.</Text>
        <Text style={styles.tapText}>Tap to view full history</Text>
      </>
    );
  }

  // --- Main Card Content ---
  const item = firstMatch;
  const characterAvatar = resolveImageUri(item?.character?.character_avatar);
  const characterPlayerAvatar = resolveImageUri(item?.character?.player_avatar);
  const playerRankImage = resolveImageUri(item?.character?.player_rank_image);

  const enemyAvatar = resolveImageUri(item?.enemy?.enemy_avatar);
  const enemyPlayerAvatar = resolveImageUri(item?.enemy?.player_avatar);
  const enemyRankImage = resolveImageUri(item?.enemy?.player_rank_image);

  const status = toLabel(item?.match_status).toUpperCase();
  const isWin = status === 'WIN';
  const isLoss = status === 'LOSS' || status === 'LOSE';

  const renderAvatar = (uri) => (
    uri ? <Image source={{ uri }} style={styles.circularAvatar} resizeMode="cover" />
      : <View style={[styles.circularAvatar, styles.avatarPlaceholder]} />
  );

  return (
    <TouchableOpacity activeOpacity={0.88} onPress={() => router.push('/pvp-history')}>
      <View style={[styles.cardOuter, isLoss && styles.cardOuterLoss]}>
        {/* Background Container */}
        <View style={styles.cardBackgroundContainer}>
          {/* Player Side Background */}
          <View style={[styles.sideBackground, styles.sideBackgroundPlayer]}>
            <View style={styles.rankImageContainer}>
              {playerRankImage && <Image source={{ uri: playerRankImage }} style={styles.rankBackgroundImage} resizeMode="contain" />}
            </View>
            {characterAvatar && <Image source={{ uri: characterAvatar }} style={styles.characterBackgroundImage} resizeMode="cover" />}
          </View>

          {/* Enemy Side Background */}
          <View style={[styles.sideBackground, styles.sideBackgroundEnemy]}>
            <View style={styles.rankImageContainer}>
              {enemyRankImage && <Image source={{ uri: enemyRankImage }} style={[styles.rankBackgroundImage, styles.reversedBackground]} resizeMode="contain" />}
            </View>
            {enemyAvatar && <Image source={{ uri: enemyAvatar }} style={[styles.characterBackgroundImage, styles.reversedBackground]} resizeMode="cover" />}
          </View>
        </View>

        {/* Content Layer */}
        <View style={styles.cardContentLayer}>
          {/* Header: Player Names & Avatars */}
          <View style={styles.cardHeader}>
            <View style={styles.playerInfoRow}>
              {renderAvatar(characterPlayerAvatar)}
              <View>
                <Text style={styles.playerName} numberOfLines={1}>{toLabel(item?.character?.player_name)}</Text>
                <Text style={styles.heroName} numberOfLines={1}>{toLabel(item?.character?.character_name)}</Text>
              </View>
            </View>
            <View style={[styles.playerInfoRow, styles.reversedPlayerInfo]}>
              {renderAvatar(enemyPlayerAvatar)}
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.playerName} numberOfLines={1}>{toLabel(item?.enemy?.player_name)}</Text>
                <Text style={styles.heroName} numberOfLines={1}>{toLabel(item?.enemy?.enemy_name)}</Text>
              </View>
            </View>
          </View>

          {/* Center Body: Stats -> Status/Date <- Stats */}
          <View style={styles.cardBody}>
            {/* Player Stats (Horizontal Row) */}
            <View style={styles.statsRowLeft}>
              <View style={styles.statItemHorizontal}>
                <Image source={POINTS_ICON} style={styles.statIconSmall} resizeMode="contain" />
                <Text style={styles.statText}>{toLabel(item?.character?.points)}</Text>
              </View>
              <View style={styles.statItemHorizontal}>
                <Image source={COINS_ICON} style={styles.statIconSmall} resizeMode="contain" />
                <Text style={styles.statText}>{toLabel(item?.character?.coins)}</Text>
              </View>
            </View>

            {/* Center Status and Date */}
            <View style={styles.statusContainer}>
              <Text style={[styles.statusText, isWin && styles.statusTextWin, isLoss && styles.statusTextLoss]}>
                {status}
              </Text>
              <Text style={styles.dateText}>Click to show full history</Text>
            </View>

            {/* Enemy Stats (Horizontal Row Reversed) */}
            <View style={styles.statsRowRight}>
              <View style={styles.statItemHorizontalReverse}>
                <Text style={styles.statTextRight}>{toLabel(item?.enemy?.points)}</Text>
                <Image source={POINTS_ICON} style={styles.statIconSmall} resizeMode="contain" />
              </View>
              <View style={styles.statItemHorizontalReverse}>
                <Text style={styles.statTextRight}>{toLabel(item?.enemy?.coins)}</Text>
                <Image source={COINS_ICON} style={styles.statIconSmall} resizeMode="contain" />
              </View>
            </View>
          </View>
           {/* Footer Removed to save space - date moved to center body */}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // --- Card Container ---
  cardOuter: {
    borderRadius: gameScale(10), // Slightly tighter radius
    borderWidth: gameScale(2),
    borderColor: '#4a90d9',
    backgroundColor: '#1e3a5f',
    overflow: 'hidden',
    height: gameScale(120), // Reduced height slightly to feel more compact
    width: '100%',
    marginBottom: gameScale(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: gameScale(2) },
    shadowOpacity: 0.3,
    shadowRadius: gameScale(4),
    elevation: 6,
  },
  cardOuterLoss: {
    borderColor: '#ff4d4d',
  },
  centerContentCard: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: gameScale(16),
  },
  //Placeholder styles
  placeholderText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: gameScale(12),
    fontFamily: 'Grobold',
    textAlign: 'center',
  },
  errorText: { color: '#ffb6b6' },
  tapText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: gameScale(9),
    fontFamily: 'DynaPuff',
    marginTop: gameScale(4),
  },

  // --- Background Layer (Toned down for preview) ---
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
  sideBackgroundPlayer: { backgroundColor: 'rgba(0, 0, 150, 0.2)' }, // Darker, more transparent tint
  sideBackgroundEnemy: { backgroundColor: 'rgba(150, 0, 0, 0.2)' },

  rankImageContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  rankBackgroundImage: {
    width: '90%', // Relative sizing
    height: '90%',
  },
  characterBackgroundImage: {
    position: 'absolute',
    // Adjust positioning to center them better in the tighter space
    left: '-10%',
    width: '120%',
    height: '120%',
    alignSelf: 'center',
    zIndex: 2,
    top: '10%', // Push down slightly
  },
  reversedBackground: { transform: [{ scaleX: -1 }] },

  // --- Content Layer ---
  cardContentLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
    padding: gameScale(6), // Tighter padding
    justifyContent: 'space-between',
  },

  // Header
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  playerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gameScale(6), // Reduced gap
    flex: 1, // Allow text to take space
  },
  reversedPlayerInfo: { flexDirection: 'row-reverse' },
  circularAvatar: {
    width: gameScale(30), // Smaller avatar
    height: gameScale(30),
    borderRadius: gameScale(15),
    borderWidth: gameScale(1),
    borderColor: 'rgba(255,255,255,0.8)',
    backgroundColor: '#333',
  },
  playerName: {
    color: '#fff',
    fontSize: gameScale(11), // Smaller font
    fontFamily: 'Grobold',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  heroName: {
    color: '#ccc',
    fontSize: gameScale(9), // Smaller font
    fontFamily: 'DynaPuff',
  },

  // Body Section (The biggest change)
  cardBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end', // Align everything to the bottom of the body space
    justifyContent: 'space-between',
    paddingBottom: gameScale(2),
  },
  // Center Status
  statusContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 2, // Give center slightly more priority
    paddingHorizontal: gameScale(4),
  },
  statusText: {
    color: '#ffd700',
    fontSize: gameScale(24), // Much smaller font
    fontFamily: 'Grobold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    textAlign: 'center',
    lineHeight: gameScale(24), // Tight line height
  },
  statusTextWin: { color: '#06c32c' },
  statusTextLoss: { color: '#ff4d4d' },
  dateText: {
    color: 'rgba(234, 245, 255, 0.7)',
    fontSize: gameScale(8),
    fontFamily: 'DynaPuff',
    textAlign: 'center',
    marginTop: gameScale(0),
  },

  statsRowLeft: {
    flex: 1.5,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: gameScale(6),
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  statsRowRight: {
    flex: 1.5,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: gameScale(6),
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  statItemHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItemHorizontalReverse: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconSmall: {
    width: gameScale(14), // Much smaller icons
    height: gameScale(14),
    marginRight: gameScale(2),
  },
  statText: {
    color: '#f4e7d1',
    fontSize: gameScale(10),
    fontFamily: 'DynaPuff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  statTextRight: {
    color: '#f4e7d1',
    fontSize: gameScale(10),
    fontFamily: 'DynaPuff',
    textAlign: 'right',
    marginRight: gameScale(2),
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },

  avatarPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});

export default React.memo(PvpMatchHistoryPreview);