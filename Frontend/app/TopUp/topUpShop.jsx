import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { ActivityIndicator, Dimensions, Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform, Modal } from 'react-native';
import SpriteActivityIndicator from '../Components/Actual Game/Loading/SpriteActivityIndicator';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { gameScale } from '../Components/Responsiveness/gameResponsive';
import { topUpShopService } from '../services/topUpShopService';
import { TOP_UP_CATEGORIES, TOP_UP_CATEGORY_MATCHERS } from '../services/topUpShopData';
import { TOP_UP_COVER_URL, TOP_UP_BOARD_URL, TOP_UP_SHOP_BG_URL } from '../services/preloader/universalAssetPreloader/topUpMethods';
import { universalAssetPreloader } from '../services/preloader/universalAssetPreloader';
import BackButton from '../Components/Actual Game/Back/BackButton';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Conditionally require react-native-iap to prevent crashing on Expo Go
const IAP = !isExpoGo ? require('react-native-iap') : null;


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

// Generate a mock purchase token for testing (when backend has MOCK_IAP=true)
const generateMockToken = () => `TEST_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export default function TopUpShop() {
  const params = useLocalSearchParams();
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchasingItemId, setPurchasingItemId] = useState(null);
  const purchaseInFlight = useRef(false);
  const [selectedCategory, setSelectedCategory] = useState(
    typeof params.category === 'string' && params.category && params.category !== 'all'
      ? params.category
      : 'coins'
  );

  const [customAlert, setCustomAlert] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  const showAlert = useCallback((title, message, buttons = []) => {
    const defaultButtons = buttons.length > 0 ? buttons : [{ text: 'OK', onPress: () => { } }];
    setCustomAlert({
      visible: true,
      title,
      message,
      buttons: defaultButtons,
    });
  }, []);

  const closeAlert = useCallback(() => {
    setCustomAlert(prev => ({ ...prev, visible: false }));
  }, []);

  const handleAlertButtonPress = useCallback((button) => {
    setCustomAlert(prev => ({ ...prev, visible: false }));
    if (button.onPress) {
      setTimeout(() => {
        button.onPress();
      }, 100);
    }
  }, []);

  // Initialize standard Google Play Billing (IAP) for standalone builds
  useEffect(() => {
    if (isExpoGo) {
      console.log('[TopUpShop] Running in Expo Go: using mock purchase flow.');
      return;
    }

    console.log('[TopUpShop] Running in Standalone Build: initializing Google Play Billing.');
    let purchaseUpdateSubscription;
    let purchaseErrorSubscription;

    const initIAP = async () => {
      try {
        await IAP.initConnection();
        console.log('[TopUpShop] IAP Connection initialized successfully.');

        if (Platform.OS === 'android') {
          await IAP.flushFailedPurchasesCachedAsPendingAndroid();
        }

        // Listen for successful transactions
        purchaseUpdateSubscription = IAP.purchaseUpdatedListener(async (purchase) => {
          console.log('[TopUpShop] Purchase updated:', purchase);
          const receipt = purchase.transactionReceipt;
          if (receipt) {
            try {
              const token = purchase.purchaseToken || purchase.transactionId;

              // Verify the purchase with our secure backend verification endpoint
              const result = await topUpShopService.verifyPurchase(purchase.productId, token);

              // Fulfill and close the transaction on Google Play Console
              await IAP.finishTransaction({ purchase, isConsumable: true });
              console.log('[TopUpShop] Transaction finished successfully.');

              // Display success dialog
              showAlert(
                'Purchase Successful',
                result?.message || 'Your purchase was completed successfully.',
              );
            } catch (err) {
              console.error('[TopUpShop] Verification or completion failed:', err);
              showAlert('Verification Failed', err?.message || 'We could not verify your purchase. Please contact support.');
            } finally {
              purchaseInFlight.current = false;
              setPurchasingItemId(null);
            }
          }
        });

        // Listen for transaction errors (e.g. user cancelled)
        purchaseErrorSubscription = IAP.purchaseErrorListener((error) => {
          console.warn('[TopUpShop] Purchase error:', error);
          if (error?.code !== 'E_USER_CANCELLED') {
            showAlert('Purchase Failed', error?.message || 'Something went wrong with the purchase.');
          }
          purchaseInFlight.current = false;
          setPurchasingItemId(null);
        });

      } catch (err) {
        console.error('[TopUpShop] Failed to initialize IAP:', err);
      }
    };

    initIAP();

    return () => {
      if (purchaseUpdateSubscription) purchaseUpdateSubscription.remove();
      if (purchaseErrorSubscription) purchaseErrorSubscription.remove();
      IAP.endConnection();
    };
  }, [showAlert]);

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

  const handlePurchase = useCallback(async (item) => {
    if (purchaseInFlight.current) return;

    if (isExpoGo) {
      // ----------------- EXPO GO MOCK FLOW -----------------
      const priceLabel = `PHP ${Number(item.price_php || 0).toLocaleString()}`;
      showAlert(
        'Confirm Purchase (Mock)',
        `Buy "${item.name}" for ${priceLabel}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Buy',
            onPress: async () => {
              if (purchaseInFlight.current) return;
              purchaseInFlight.current = true;
              setPurchasingItemId(item.item_id);

              try {
                const purchaseToken = generateMockToken();
                const result = await topUpShopService.verifyPurchase(item.item_id, purchaseToken);
                showAlert(
                  'Purchase Successful',
                  result?.message || 'Your purchase was completed successfully.',
                );
              } catch (err) {
                showAlert('Purchase Failed', err?.message || 'Something went wrong. Please try again.');
              } finally {
                purchaseInFlight.current = false;
                setPurchasingItemId(null);
              }
            },
          },
        ],
      );
    } else {
      // ----------------- NATIVE STANDALONE FLOW -----------------
      purchaseInFlight.current = true;
      setPurchasingItemId(item.item_id);

      try {
        console.log(`[TopUpShop] Requesting native purchase for SKU: ${item.item_id}`);
        // requestPurchase triggers the official Google Play Billing Bottom Sheet
        await IAP.requestPurchase({
          skus: [item.item_id],
          andDangerouslyFinishTransactionAutomaticallyIOS: false,
        });
        // The purchaseUpdatedListener will handle backend verification & finishTransaction
      } catch (err) {
        console.error('[TopUpShop] Failed to request purchase:', err);
        showAlert('Purchase Error', err?.message || 'Failed to open the Google Play Store billing popup.');
        purchaseInFlight.current = false;
        setPurchasingItemId(null);
      }
    }
  }, [showAlert]);

  const filteredCatalog = useMemo(() => {
    const matcher = TOP_UP_CATEGORY_MATCHERS[selectedCategory];
    if (!matcher) return catalog;
    return catalog.filter(matcher);
  }, [catalog, selectedCategory]);

  const rows = useMemo(
    () => groupFilteredItems(filteredCatalog, selectedCategory),
    [filteredCatalog, selectedCategory]
  );

  const getImageUri = (productImage) => {
    if (!productImage) return null;
    return universalAssetPreloader.getCachedAssetPath(productImage);
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
            {rows.map((row, rowIndex) => {
              const isEnergyRow = row.items.some(i => String(i.item_id || '').includes('energy'));
              return (
                <View key={`row-${rowIndex}`} style={[styles.row, isEnergyRow && styles.energyRow]}>
                  {row.items.map((item) => {
                    const imageUri = getImageUri(item.product_image);
                    const isPair = row.type === 'pair';

                    return (
                      <Pressable
                        key={item.item_id}
                        onPress={() => handlePurchase(item)}
                        disabled={purchasingItemId === item.item_id}
                        style={({ pressed }) => [
                          isPair ? styles.halfCell : styles.fullCell,
                          pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                        ]}
                      >
                        {imageUri ? (
                          <Image
                            source={{ uri: imageUri }}
                            style={[
                              styles.itemImage,
                              purchasingItemId === item.item_id && { opacity: 0.5 },
                            ]}
                            resizeMode="contain"
                          />
                        ) : (
                          <View style={styles.imagePlaceholder}>
                            <Text style={styles.placeholderText}>{item.name}</Text>
                          </View>
                        )}
                        {purchasingItemId === item.item_id && (
                          <View style={styles.purchaseOverlay}>
                            <ActivityIndicator color="#ffd84a" size="large" />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
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
      </ImageBackground>

      {/* Custom Themed Game Modal */}
      <Modal
        transparent={true}
        visible={customAlert.visible}
        animationType="fade"
        onRequestClose={closeAlert}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{customAlert.title}</Text>

            <View style={styles.modalDivider} />

            <Text style={styles.modalMessage}>{customAlert.message}</Text>

            <View style={[
              styles.modalButtonsContainer,
              customAlert.buttons.length === 1 && { justifyContent: 'center' }
            ]}>
              {customAlert.buttons.map((btn, index) => {
                const isCancel = btn.style === 'cancel' || btn.text.toLowerCase() === 'cancel' || btn.text.toLowerCase() === 'no';
                const gradientColors = isCancel ? ['#6b4420', '#3e2208'] : ['#ffd84a', '#c98930'];
                const textColor = isCancel ? 'rgba(255, 230, 180, 0.85)' : '#fff8e1';
                const textShadowColor = isCancel ? '#2a1500' : '#4a2c00';

                return (
                  <View
                    key={`alert-btn-${index}`}
                    style={[
                      styles.modalButtonWrapper,
                      customAlert.buttons.length === 1 ? { width: gameScale(140), flex: 0 } : { flex: 1 }
                    ]}
                  >
                    {/* 3D Shadow Layer */}
                    <View style={[
                      styles.modalButtonShadow,
                      { backgroundColor: '#2a1500' }
                    ]} />

                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => handleAlertButtonPress(btn)}
                      style={styles.modalButton}
                    >
                      <LinearGradient
                        colors={gradientColors}
                        style={styles.modalButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                      >
                        {/* Highlight overlay for 3D effect */}
                        <View style={styles.modalButtonHighlight} />

                        <Text style={[
                          styles.modalButtonText,
                          { color: textColor, textShadowColor }
                        ]}>
                          {btn.text}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
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
  energyRow: {
    marginTop: gameScale(-90),
    marginBottom: gameScale(-80),
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

  // --- Purchase overlay spinner ---
  purchaseOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: gameScale(12),
  },

  // --- Custom Themed Modal ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: gameScale(20),
  },
  modalCard: {
    width: '85%',
    maxWidth: gameScale(320),
    backgroundColor: 'rgba(29, 21, 13, 0.98)',
    borderWidth: gameScale(3),
    borderColor: '#c98930',
    borderRadius: gameScale(16),
    padding: gameScale(20),
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },
  modalTitle: {
    fontFamily: 'Grobold',
    fontSize: gameScale(18),
    color: '#ffd84a',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 2,
    marginBottom: gameScale(12),
  },
  modalDivider: {
    width: '100%',
    height: gameScale(2),
    backgroundColor: '#c98930',
    marginBottom: gameScale(16),
    opacity: 0.5,
  },
  modalMessage: {
    fontFamily: 'Grobold',
    fontSize: gameScale(13),
    color: '#fff8e1',
    textAlign: 'center',
    lineHeight: gameScale(18),
    marginBottom: gameScale(20),
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: gameScale(12),
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalButtonWrapper: {
    height: gameScale(36),
  },
  modalButtonShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    borderRadius: gameScale(10),
  },
  modalButton: {
    flex: 1,
    marginBottom: gameScale(3),
    borderRadius: gameScale(10),
  },
  modalButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: gameScale(10),
    borderWidth: gameScale(1),
    borderColor: 'rgba(255, 215, 100, 0.25)',
    overflow: 'hidden',
    paddingHorizontal: gameScale(8),
  },
  modalButtonHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderTopLeftRadius: gameScale(10),
    borderTopRightRadius: gameScale(10),
  },
  modalButtonText: {
    fontFamily: 'Grobold',
    fontSize: gameScale(13),
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
    zIndex: 2,
  },
});
