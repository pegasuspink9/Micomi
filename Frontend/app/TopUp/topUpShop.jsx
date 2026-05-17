import React, { useCallback, useMemo, useState } from 'react';
import { Dimensions, Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import SpriteActivityIndicator from '../Components/Actual Game/Loading/SpriteActivityIndicator';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { gameScale } from '../Components/Responsiveness/gameResponsive';
import { topUpShopService } from '../services/topUpShopService';
import { TOP_UP_CATEGORIES, TOP_UP_CATEGORY_MATCHERS } from '../services/topUpShopData';
import { TOP_UP_IMAGE_MAP, TOP_UP_COVER_URL, TOP_UP_BOARD_URL, TOP_UP_SHOP_BG_URL } from '../services/preloader/universalAssetPreloader/topUpMethods';
import { universalAssetPreloader } from '../services/preloader/universalAssetPreloader';
import BackButton from '../Components/Actual Game/Back/BackButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const getCategoryFromItemId = (itemId) => {
  const id = String(itemId || '').toLowerCase();
  if (id.includes('coins')) return 'coins';
  if (id.includes('diamonds')) return 'diamonds';
  if (id.includes('energy')) return 'energy';
  return 'coins';
};

// Layout rules:
// Coins & Diamonds: first 2 items side-by-side (row), 3rd item full-width (row)
// Energy: each item full-width (one per row) since they're horizontal images
const groupItemsByLayout = (items) => {
  const coins = items.filter(i => getCategoryFromItemId(i.item_id) === 'coins');
  const diamonds = items.filter(i => getCategoryFromItemId(i.item_id) === 'diamonds');
  const energy = items.filter(i => getCategoryFromItemId(i.item_id) === 'energy');

  const rows = [];

  // Coins rows
  if (coins.length >= 2) rows.push({ items: coins.slice(0, 2), type: 'pair' });
  if (coins.length >= 3) rows.push({ items: [coins[2]], type: 'full' });
  if (coins.length === 1) rows.push({ items: [coins[0]], type: 'full' });

  // Diamonds rows
  if (diamonds.length >= 2) rows.push({ items: diamonds.slice(0, 2), type: 'pair' });
  if (diamonds.length >= 3) rows.push({ items: [diamonds[2]], type: 'full' });
  if (diamonds.length === 1) rows.push({ items: [diamonds[0]], type: 'full' });

  // Energy rows — each one is full-width
  energy.forEach(item => rows.push({ items: [item], type: 'full' }));

  return rows;
};

const groupFilteredItems = (items, category) => {
  const rows = [];

  if (category === 'energy') {
    // Each energy item is full-width
    items.forEach(item => rows.push({ items: [item], type: 'full' }));
  } else {
    // coins / diamonds: first 2 paired, 3rd full
    if (items.length >= 2) rows.push({ items: items.slice(0, 2), type: 'pair' });
    if (items.length >= 3) rows.push({ items: [items[2]], type: 'full' });
    if (items.length === 1) rows.push({ items: [items[0]], type: 'full' });
  }

  return rows;
};

// Cover image aspect ratio (adjust if the actual image differs)
const COVER_ASPECT_RATIO = 16 / 9;
const COVER_HEIGHT = SCREEN_WIDTH / COVER_ASPECT_RATIO;
const BOARD_HEIGHT = gameScale(90);

// Brown gradient colors for tabs (matching MissionTabButton pattern)
const getTabGradientColors = (isActive) => {
  if (isActive) {
    return ['#c98930', '#7a4a12']; // Bright warm brown
  }
  return ['#6b4420', '#3e2208']; // Dark muted brown
};

const TAB_SHADOW_COLOR = '#2a1500';

export default function TopUpShop() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(
    typeof params.category === 'string' && params.category && params.category !== 'all'
      ? params.category
      : 'coins'
  );

  const loadCatalog = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await topUpShopService.getCatalog();
      setCatalog(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || 'Failed to load top up shop');
      setCatalog([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCatalog();
    }, [loadCatalog])
  );

  const filteredCatalog = useMemo(() => {
    const matcher = TOP_UP_CATEGORY_MATCHERS[selectedCategory];
    if (!matcher) return catalog;
    return catalog.filter(matcher);
  }, [catalog, selectedCategory]);

  const rows = useMemo(
    () => groupFilteredItems(filteredCatalog, selectedCategory),
    [filteredCatalog, selectedCategory]
  );

  const getImageUri = (itemId) => {
    const remoteUrl = TOP_UP_IMAGE_MAP[itemId];
    if (!remoteUrl) return null;
    return universalAssetPreloader.getCachedAssetPath(remoteUrl);
  };

  const coverUri = universalAssetPreloader.getCachedAssetPath(TOP_UP_COVER_URL) || TOP_UP_COVER_URL;
  const boardUri = universalAssetPreloader.getCachedAssetPath(TOP_UP_BOARD_URL) || TOP_UP_BOARD_URL;
  const shopBgUri = universalAssetPreloader.getCachedAssetPath(TOP_UP_SHOP_BG_URL) || TOP_UP_SHOP_BG_URL;

  return (
    <View style={styles.screen}>
      {/* Cover image at the top edge */}
      <View style={styles.coverContainer}>
        <Image
          source={{ uri: coverUri }}
          style={styles.coverImage}
          resizeMode="cover"
        />

        {/* Back button — BackButton component with brown tint */}
        <BackButton
          tintColor="#6b3a1f"
          tintOpacity={0.7}
          width={gameScale(60)}
          height={gameScale(60)}
          containerStyle={styles.backButtonContainer}
        />

        {/* Board at the bottom edge of cover */}
        <Image
          source={{ uri: boardUri }}
          style={styles.boardImage}
          resizeMode="contain"
        />
      </View>

      {/* Shop background covering from the board downward */}
      <ImageBackground
        source={{ uri: shopBgUri }}
        style={styles.shopBackground}
        resizeMode="cover"
      >
        {/* Category tabs — MissionTabButton style but brown */}
        <View style={styles.tabsContainer}>
          {TOP_UP_CATEGORIES.map((category) => {
            const active = selectedCategory === category.key;
            const gradientColors = getTabGradientColors(active);

            return (
              <View key={category.key} style={styles.capsuleWrapper}>
                {/* 3D Shadow Layer */}
                <View style={[
                  styles.capsuleShadow,
                  { backgroundColor: TAB_SHADOW_COLOR },
                  active && styles.capsuleShadowActive,
                ]} />

                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => setSelectedCategory(category.key)}
                  style={[styles.capsuleButton, active && styles.capsuleButtonActive]}
                >
                  <LinearGradient
                    colors={gradientColors}
                    style={styles.capsuleGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                  >
                    {/* Highlight overlay for 3D effect */}
                    <View style={styles.capsuleHighlight} />

                    <Text style={[styles.capsuleText, active && styles.capsuleTextActive]}>
                      {category.label}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.stateWrap}>
            <SpriteActivityIndicator size={gameScale(50)} />
            <Text style={styles.stateText}>Loading catalog...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateWrap}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={loadCatalog}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {rows.map((row, rowIndex) => (
              <View key={`row-${rowIndex}`} style={styles.row}>
                {row.items.map((item) => {
                  const imageUri = getImageUri(item.item_id);
                  const isPair = row.type === 'pair';

                  return (
                    <Pressable
                      key={item.item_id}
                      style={({ pressed }) => [
                        isPair ? styles.halfCell : styles.fullCell,
                        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                      ]}
                    >
                      {imageUri ? (
                        <Image
                          source={{ uri: imageUri }}
                          style={styles.itemImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={styles.imagePlaceholder}>
                          <Text style={styles.placeholderText}>{item.name}</Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            ))}

            {!filteredCatalog.length && (
              <View style={styles.stateWrap}>
                <Text style={styles.stateText}>No items found for this category.</Text>
              </View>
            )}
          </ScrollView>
        )}
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#081521',
  },

  // --- Cover ---
  coverContainer: {
    width: SCREEN_WIDTH,
    height: COVER_HEIGHT,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  backButtonContainer: {
    position: 'absolute',
    zIndex: 10,
    left: gameScale(10)
  },
  boardImage: {
    zIndex: 999999,
    position: 'absolute',
    bottom: gameScale(-30),
    left: 0,
    width: '100%',
    height: BOARD_HEIGHT,
  },

  // --- Shop Background (from board downward) ---
  shopBackground: {
    flex: 1,
    marginTop: gameScale(-15),
  },

  // --- Tabs (MissionTabButton style, brownish) ---
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: gameScale(44),
    marginBottom: gameScale(16),
    paddingHorizontal: gameScale(18),
    gap: gameScale(10),
  },
  capsuleWrapper: {
    flex: 1,
    height: gameScale(38),
  },
  capsuleShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    borderRadius: gameScale(12),
  },
  capsuleShadowActive: {
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  capsuleButton: {
    flex: 1,
    marginBottom: gameScale(4),
    borderRadius: gameScale(12),
  },
  capsuleButtonActive: {
    marginBottom: 0,
    marginTop: gameScale(4),
  },
  capsuleGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: gameScale(12),
    borderWidth: gameScale(1),
    borderColor: 'rgba(255,215,100,0.25)',
    overflow: 'hidden',
  },
  capsuleHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderTopLeftRadius: gameScale(12),
    borderTopRightRadius: gameScale(12),
  },
  capsuleText: {
    fontFamily: 'Grobold',
    fontSize: gameScale(12),
    color: 'rgba(255, 230, 180, 0.85)',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 2,
    zIndex: 2,
  },
  capsuleTextActive: {
    color: '#fff8e1',
    textShadowOffset: { width: 1, height: 1 },
  },

  // --- States ---
  stateWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: gameScale(40),
    gap: gameScale(12),
  },
  stateText: {
    color: '#fff',
    fontSize: gameScale(13),
    textAlign: 'center',
  },
  errorText: {
    color: '#ffb4b4',
    textAlign: 'center',
    fontSize: gameScale(13),
  },
  retryButton: {
    paddingHorizontal: gameScale(18),
    paddingVertical: gameScale(10),
    borderRadius: gameScale(12),
    backgroundColor: '#ffd84a',
  },
  retryText: {
    color: '#1d2936',
    fontFamily: 'Grobold',
  },

  // --- Layout ---
  listContent: {
    paddingBottom: gameScale(28),
    paddingHorizontal: gameScale(18),
  },
  row: {
    flexDirection: 'row',
    marginBottom: gameScale(-50),
  },
  halfCell: {
    flex: 1,
  },
  fullCell: {
    flex: 1,
  },

  // --- Image ---
  itemImage: {
    width: '100%',
    height: undefined,
    aspectRatio: 1,
    borderRadius: gameScale(12),
  },

  // --- Fallback placeholder ---
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: gameScale(12),
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: gameScale(12),
    fontFamily: 'Grobold',
    textAlign: 'center',
  },
});
