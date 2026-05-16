import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { gameScale } from '../Components/Responsiveness/gameResponsive';
import { topUpShopService } from '../services/topUpShopService';
import { TOP_UP_CATEGORIES, TOP_UP_CATEGORY_MATCHERS, formatPhpPrice, formatTopUpQuantity } from '../services/topUpShopData';

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
            {filteredCatalog.map((item) => {
              const category = item?.item_id?.includes('coins')
                ? 'Coins'
                : item?.item_id?.includes('diamonds')
                  ? 'Diamonds'
                  : item?.item_id?.includes('energy')
                    ? 'Energy'
                    : item?.type || 'Item';

              return (
                <View key={item.item_id} style={styles.card}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.cardTitleBlock}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemId}>{item.item_id}</Text>
                    </View>
                    <View style={styles.pricePill}>
                      <Text style={styles.priceText}>{formatPhpPrice(item.price_php)}</Text>
                    </View>
                  </View>

                  <Text style={styles.description}>{item.description}</Text>

                  <View style={styles.metaRow}>
                    <View style={styles.metaPill}>
                      <Text style={styles.metaText}>{category}</Text>
                    </View>
                    <View style={styles.metaPillSoft}>
                      <Text style={styles.metaTextSoft}>item_id driven</Text>
                    </View>
                  </View>

                  <View style={styles.contentsList}>
                    {(item.contents || []).map((content) => (
                      <View key={`${item.item_id}-${content.item_id}`} style={styles.contentRow}>
                        <Text style={styles.contentName}>{content.item_id}</Text>
                        <Text style={styles.contentQty}>x{formatTopUpQuantity(content.qty)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}

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
  listContent: {
    paddingBottom: gameScale(28),
    gap: gameScale(12),
  },
  card: {
    borderRadius: gameScale(18),
    padding: gameScale(16),
    backgroundColor: 'rgba(8, 19, 31, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: gameScale(10),
  },
  cardTitleBlock: {
    flex: 1,
  },
  itemName: {
    color: '#fff',
    fontSize: gameScale(18),
    fontFamily: 'DynaPuff',
  },
  itemId: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: gameScale(10),
    marginTop: gameScale(3),
  },
  pricePill: {
    paddingHorizontal: gameScale(12),
    paddingVertical: gameScale(7),
    borderRadius: gameScale(999),
    backgroundColor: '#ffd84a',
    alignSelf: 'flex-start',
  },
  priceText: {
    color: '#1d2936',
    fontSize: gameScale(11),
    fontFamily: 'DynaPuff',
  },
  description: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: gameScale(12),
    lineHeight: gameScale(18),
    marginTop: gameScale(10),
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: gameScale(8),
    marginTop: gameScale(12),
  },
  metaPill: {
    paddingHorizontal: gameScale(10),
    paddingVertical: gameScale(6),
    borderRadius: gameScale(999),
    backgroundColor: 'rgba(255, 216, 74, 0.15)',
  },
  metaPillSoft: {
    paddingHorizontal: gameScale(10),
    paddingVertical: gameScale(6),
    borderRadius: gameScale(999),
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  metaText: {
    color: '#ffd84a',
    fontSize: gameScale(10),
    fontFamily: 'DynaPuff',
  },
  metaTextSoft: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: gameScale(10),
  },
  contentsList: {
    marginTop: gameScale(12),
    gap: gameScale(8),
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: gameScale(9),
    paddingHorizontal: gameScale(12),
    borderRadius: gameScale(12),
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  contentName: {
    color: '#fff',
    fontSize: gameScale(12),
    flex: 1,
    paddingRight: gameScale(8),
  },
  contentQty: {
    color: '#ffd84a',
    fontSize: gameScale(12),
    fontFamily: 'DynaPuff',
  },
});
