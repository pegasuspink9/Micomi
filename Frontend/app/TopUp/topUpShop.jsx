import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { gameScale } from '../Components/Responsiveness/gameResponsive';
import { topUpShopService } from '../services/topUpShopService';
import { TOP_UP_CATEGORIES, TOP_UP_CATEGORY_MATCHERS } from '../services/topUpShopData';
import { TOP_UP_IMAGE_MAP } from '../services/preloader/universalAssetPreloader/topUpMethods';
import { universalAssetPreloader } from '../services/preloader/universalAssetPreloader';

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
  if (category === 'all') return groupItemsByLayout(items);

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

export default function TopUpShop() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(
    typeof params.category === 'string' && params.category ? params.category : 'all'
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
    if (selectedCategory === 'all') return catalog;
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

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#081521', '#0e2436', '#18324a']} style={styles.background}>
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.8} onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={gameScale(22)} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Top Ups Shop</Text>
            <Text style={styles.subtitle}>Choose a category and browse the catalog</Text>
          </View>
        </View>

        <View style={styles.filterRow}>
          {TOP_UP_CATEGORIES.map((category) => {
            const active = selectedCategory === category.key;
            return (
              <Pressable
                key={category.key}
                onPress={() => setSelectedCategory(category.key)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{category.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.stateWrap}>
            <ActivityIndicator size="large" color="#ffd84a" />
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
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#081521',
  },
  background: {
    flex: 1,
    paddingTop: gameScale(48),
    paddingHorizontal: gameScale(18),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gameScale(12),
    marginBottom: gameScale(16),
  },
  backButton: {
    width: gameScale(42),
    height: gameScale(42),
    borderRadius: gameScale(14),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: gameScale(22),
    fontFamily: 'DynaPuff',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: gameScale(11),
    marginTop: gameScale(2),
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: gameScale(8),
    marginBottom: gameScale(14),
  },
  filterChip: {
    paddingHorizontal: gameScale(14),
    paddingVertical: gameScale(8),
    borderRadius: gameScale(999),
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  filterChipActive: {
    backgroundColor: '#ffd84a',
    borderColor: '#ffd84a',
  },
  filterChipText: {
    color: '#dfe9f5',
    fontSize: gameScale(12),
    fontFamily: 'DynaPuff',
  },
  filterChipTextActive: {
    color: '#1d2936',
  },
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
    fontFamily: 'DynaPuff',
  },

  // --- Layout ---
  listContent: {
    paddingBottom: gameScale(28),
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
    fontFamily: 'DynaPuff',
    textAlign: 'center',
  },
});
