import React, { useState, useEffect } from "react";
import { 
  Text, 
  View, 
  StyleSheet,
  ImageBackground,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  scale,
  scaleWidth,
  scaleHeight,
  hp,
  RESPONSIVE,
} from '../app/Components/Responsiveness/gameResponsive';
import { useLevelData } from '../app/hooks/useLevelData';
import { universalAssetPreloader } from '../app/services/preloader/universalAssetPreloader';
import { Video } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router'; //  Add for dynamic params
import LevelCompletionModal from '../app/Components/GameOver And Win/LevelCompletionModal'; //  Add for completion modal

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const transformPotionData = (potionShop = []) => {
  return potionShop.map(potion => ({
    id: potion.potion_id,
    name: getPotionDisplayName(potion.potion_type),
    price: potion.potion_price,
    quantity: potion.player_owned_quantity,
    image: potion.potion_url,
    description: potion.description,
    type: potion.potion_type,
    limit: potion.limit,
    boughtInLevel: potion.boughtInLevel,
    remainToBuy: potion.remainToBuy,
    potion_id: potion.potion_id,
  }));
};

//  Helper function for display names
const getPotionDisplayName = (potionType) => {
  const typeMap = {
    'health': 'Health',
    'hint': 'Hint',
    'strong': 'Strong',
    'mana': 'Mana',
    'freeze': 'Freeze',
    'speed': 'Speed',
    'immune': 'Immune'
  };
  return typeMap[potionType] || potionType.charAt(0).toUpperCase() + potionType.slice(1);
};

const getPotionColors = (name) => {
  const brown = '#943f02ff';
  return {
    background: brown,
    border: brown,
    frameColor: brown,
    innerColor: brown,
    pressedColor: brown,
  };
};

export default function PotionShop() {
  const router = useRouter(); //  Add router for navigation
  const params = useLocalSearchParams(); //  Get dynamic params
  
  //  Dynamic levelId and playerId from navigation params
  const levelId = parseInt(params.levelId) || 5; // Fallback to 5 if not provided
  const playerId = parseInt(params.playerId) || 11; // Fallback to 11 if not provided
  const levelData = params.levelData ? JSON.parse(params.levelData) : null; // Optional level data

  const [selected, setSelected] = useState(null);
  const [potions, setPotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playerCoins, setPlayerCoins] = useState(0);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [buyingPotion, setBuyingPotion] = useState(false); 
  const [showLevelCompletion, setShowLevelCompletion] = useState(false); //  Add for completion modal
  const { getLevelPreview, buyPotion } = useLevelData(); 

  const fetchPotionData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🧪 Fetching potion shop for player ${playerId}, level ${levelId}`);
      
      const response = await getLevelPreview(levelId, playerId); //  Use dynamic levelId
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch potion shop');
      }

      const { potionShop, player_info } = response.data;
      
      // Transform and set potion data
      const transformedPotions = transformPotionData(potionShop);
      setPotions(transformedPotions);
      setPlayerCoins(player_info?.player_coins || 0);
      
      console.log(`🧪 Loaded ${transformedPotions.length} potions from shop for level ${levelId}`);

      //  Preload potion images (only if not already loading)
      if (transformedPotions.length > 0 && !assetsLoading) {
        setAssetsLoading(true);
        await preloadPotionAssets(transformedPotions);
        setAssetsLoading(false);
      }

    } catch (err) {
      console.error('❌ Error fetching potion data:', err);
      setError(err.message || 'Failed to load potion shop');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPotionData();
  }, [levelId, playerId]); //  Re-fetch if params change

  const handleBuyPotion = async (potion) => {
    if (buyingPotion) return; // Prevent multiple purchases

    setBuyingPotion(true);
    setError(null);

    try {
      const response = await buyPotion(playerId, levelId, potion.potion_id); //  Use dynamic IDs

      if (response.success) {
        console.log('🛒 Purchase successful!', response);

        await fetchPotionData();

        // Close detail view
        setSelected(null);
      } else {
        console.error('❌ Purchase failed:', response.error || response);
        setError(response.error || 'Purchase failed');
      }
    } catch (purchaseError) {
      console.error('❌ Purchase failed:', purchaseError);
      setError(purchaseError.message || 'Unable to complete purchase. Please try again.');
    } finally {
      setBuyingPotion(false);
    }
  };

  //  Handle shop completion (Finish button)
  const handleFinishShop = () => {
    console.log('🏁 Finishing shop level');
    setShowLevelCompletion(true);
  };

  //  Handle next level navigation (like LevelCompletionModal)
  const handleNextLevel = () => {
    const nextLevelId = levelId + 1; //  Simulate next level (customize based on your map logic)
    console.log(`🚀 Navigating to next level ${nextLevelId}`);
    
    router.push({
      pathname: '/GamePlay', // Or '/PotionShop' if next is another shop
      params: {
        playerId,
        levelId: nextLevelId,
        levelData: JSON.stringify({}), // Pass empty or fetch new levelData
      }
    });
  };

  //  Preload potion assets (unchanged)
  const preloadPotionAssets = async (potionData) => {
    try {
      console.log('🧪 Starting potion asset preloading...');
      
      const assets = potionData
        .filter(potion => potion.image && typeof potion.image === 'string')
        .map(potion => ({
          url: potion.image,
          name: `potion_${potion.type}`,
          type: 'image',
          category: 'potion_shop',
          potionId: potion.id,
          potionType: potion.type,
          potionName: potion.name
        }));

      console.log(`🧪 Found ${assets.length} potion assets to preload`);

      if (assets.length === 0) return;

      const results = await Promise.allSettled(
        assets.map(asset => 
          universalAssetPreloader.downloadSingleAsset(
            asset.url,
            asset.category,
            (progress) => {
              console.log(`🧪 Downloading ${asset.potionName}: ${Math.round(progress.progress * 100)}%`);
            }
          )
        )
      );

      const successful = results.filter(result => result.status === 'fulfilled' && result.value.success);
      console.log(`🧪 Preloaded ${successful.length}/${assets.length} potion assets`);

    } catch (error) {
      console.error('❌ Error preloading potion assets:', error);
    }
  };

  const getCachedImagePath = (url) => {
    return universalAssetPreloader.getCachedAssetPath(url);
  };

  //  Enhanced retry function
  const handleRetry = () => {
    setError(null);
    fetchPotionData();
  };

  //  Loading state with buying indicator
  if (loading) {
    return (
      <View style={styles.container}>
        <ImageBackground 
          source={{ uri: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1759901895/labBackground_otqad4.jpg' }} 
          style={styles.ImageBackgroundContainer} 
          resizeMode="cover"
        >
          <View style={styles.backgroundOverlay} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>
              {buyingPotion ? "Processing Purchase..." : "Loading Potion Shop..."}
            </Text>
            {assetsLoading && (
              <Text style={styles.subLoadingText}>Preparing assets...</Text>
            )}
          </View>
        </ImageBackground>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ImageBackground 
          source={{ uri: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1759901895/labBackground_otqad4.jpg' }} 
          style={styles.ImageBackgroundContainer} 
          resizeMode="cover"
        >
          <View style={styles.backgroundOverlay} />
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>❌ {error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={handleRetry} //  Use proper retry function
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </View>
    );
  }



  return (
    <View style={styles.container}>
      <ImageBackground 
        source={{ uri: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1759901895/labBackground_otqad4.jpg' }} 
        style={styles.ImageBackgroundContainer} 
        resizeMode="cover"
      >
        <View style={styles.backgroundOverlay} />
        
        {/* Top Frame - 40% */}
        <View style={styles.topFrame}>
          <Video
            source={{ uri: 'https://res.cloudinary.com/dpbocuozx/video/upload/v1760423233/lv_0_20251014141918_dvsmzk.mp4' }}
            style={styles.ImageBackgroundTop}
            shouldPlay
            isLooping
            resizeMode="contain"
            useNativeControls={false}
            isMuted={true}
          />
        </View>
        
        {/* Bottom Frame - 60% */}
        <View style={styles.bottomFrame}>
          <ImageBackground 
            source={{ uri: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1760334965/shop_holder_deydxu.png' }} 
            style={styles.ImageBackgroundBottom}
            resizeMode="contain"
          >
          </ImageBackground>

          <View style={styles.potionsOverlay}>
             <PotionsGrid data={potions} onSelect={setSelected} getCachedImagePath={getCachedImagePath} />
            

            {/*  Add Finish Button */}
            <TouchableOpacity style={styles.finishButton} onPress={handleFinishShop}>
              <Text style={styles.finishText}>Finish</Text>
            </TouchableOpacity>

            {selected && (
              <View style={styles.detailOverlay}>
                <DetailView 
                  selected={selected} 
                  onBack={() => setSelected(null)}
                  playerCoins={playerCoins}
                  getCachedImagePath={getCachedImagePath}
                  onBuy={handleBuyPotion} 
                  buyingPotion={buyingPotion}
                />
              </View>
            )}
          </View>
        </View>

      </ImageBackground>
      <LevelCompletionModal
        visible={showLevelCompletion}
        onRetry={() => setShowLevelCompletion(false)} // Close modal
        onHome={() => router.back()} // Go back to map
        onNextLevel={handleNextLevel} // Navigate to next level
        completionRewards={{
          feedbackMessage: "Potion Shop completed! Stock up and continue your adventure.",
          currentTotalPoints: 0,
          currentExpPoints: 0,
          coinsEarned: 0
        }}
        nextLevel={{
          level_id: levelId + 1,
          level_number: levelId + 1,
          is_unlocked: true
        }}
        isLoading={false}
      />
    </View>
  );
}

//  Updated PotionsGrid (unchanged)
function PotionsGrid({ data, onSelect, getCachedImagePath }) {
  return (
    <ScrollView 
      contentContainerStyle={styles.gridWrap}
      showsVerticalScrollIndicator={false}
    >
      {data.map((potion) => {
        const colors = getPotionColors(potion.name);
        const isOut = potion.quantity === 0;
        const cachedImagePath = getCachedImagePath(potion.image);
        
        return (
          <View key={potion.id} style={styles.cardCell}>
            <Pressable
              onPress={() => onSelect(potion)} //  Allow selecting any potion
              style={({ pressed }) => [
                styles.potionFrame,
                { backgroundColor: colors.frameColor },
                isOut && styles.outOfStockSlot,
                pressed && { transform: [{ translateY: 1 }] },
              ]}
            >
              <View
                style={[
                  styles.potionSlot,
                  {
                    backgroundColor: colors.border,
                    borderTopColor: colors.innerColor,
                    borderLeftColor: colors.innerColor,
                    borderBottomColor: colors.frameColor,
                    borderRightColor: colors.frameColor,
                  },
                ]}
              >
                <View style={styles.potionSlotInner}>
                  <View style={styles.potionSlotContent}>
                    <View style={styles.potionHighlight} />
                    <View style={styles.potionShadow} />
                    
                    <Image 
                      source={{ uri: cachedImagePath }} 
                      style={[styles.potionImage, isOut && styles.potionImageDisabled]} 
                    />
                    
                    <View style={[styles.countContainer, isOut && styles.countContainerDisabled]}>
                      <Text style={styles.shopInfoText}>
                          {potion.remainToBuy}/{potion.limit}
                      </Text>
                    </View>
                    <View style={styles.nameContainer}>
                      <Text style={[styles.nameText, isOut && styles.nameTextDisabled]}>
                        {potion.name}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </Pressable>
            
            <View style={styles.shopInfo}>
               <Text style={styles.countText}>Stock: {potion.quantity}</Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

//  Updated DetailView with buy functionality
function DetailView({ selected, onBack, playerCoins, getCachedImagePath, onBuy, buyingPotion }) {
  const colors = getPotionColors(selected.name);
  const isOut = selected.quantity === 0;
  const cannotBuy = selected.remainToBuy === 0 || playerCoins < selected.price;
  const cachedImagePath = getCachedImagePath(selected.image);

  return (
    <View style={[styles.detailCard, { borderColor: colors.border }]}>
      <View style={[styles.potionFrame, { 
        backgroundColor: colors.frameColor, 
        width: SCREEN_WIDTH * 0.45, 
        height: SCREEN_WIDTH * 0.55 
      }]}>
        <View
          style={[
            styles.potionSlot,
            {
              backgroundColor: colors.border,
              borderTopColor: colors.innerColor,
              borderLeftColor: colors.innerColor,
              borderBottomColor: colors.frameColor,
              borderRightColor: colors.frameColor,
            },
          ]}
        >
          <View style={styles.potionSlotInner}>
            <View style={styles.potionSlotContent}>
              <View style={styles.potionHighlight} />
              <View style={styles.potionShadow} />
              
              <Image 
                source={{ uri: cachedImagePath }} 
                style={styles.potionImageDetail} 
              />
              
              <View style={styles.countContainerDetail}>
                <Text style={styles.countTextDetail}>{selected.quantity}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.detailInfo}>
        <Text style={styles.detailTitle}>{selected.name} Potion</Text>
        <Text style={styles.detailText}>Price: {selected.price} coins</Text>
        <Text style={styles.detailText}>Owned: {selected.quantity}</Text>
        <Text style={styles.detailText}>Can buy: {selected.remainToBuy}/{selected.limit}</Text>
        <Text style={styles.detailDescription}>{selected.description}</Text>
      </View>

      <View style={styles.detailActions}>
        <TouchableOpacity
          style={[
            styles.buyButton, 
            cannotBuy || buyingPotion ? styles.keyDisabled : styles.keyActive 
          ]}
          disabled={cannotBuy || buyingPotion} //  Disable when buying
          onPress={() => onBuy(selected)} 
        >
          <Text style={[styles.actionText, styles.keyText]}>
            {buyingPotion ? 'Buying...' : 
             selected.remainToBuy === 0 ? 'Limit Reached' : 
             playerCoins < selected.price ? 'Not Enough Coins' : 'Buy'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.backButton, styles.keyActive]}
          activeOpacity={0.9}
          onPress={onBack}
          disabled={buyingPotion} //  Disable back button while buying
        >
          <Text style={[styles.actionText, styles.keyText]}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  purchaseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },

  purchaseModal: {
    backgroundColor: 'rgba(16, 7, 83, 0.9)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffd700',
  },

  purchaseText: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.04,
    fontFamily: 'DynaPuff',
    marginTop: 12,
    textAlign: 'center',
  },

  // ...keep all existing styles...
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.04,
    fontFamily: 'DynaPuff',
    marginTop: 16,
  },

  subLoadingText: {
    color: '#ffffff94',
    fontSize: SCREEN_WIDTH * 0.03,
    fontFamily: 'DynaPuff',
    marginTop: 8,
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },

  errorText: {
    color: '#ff6b6b',
    fontSize: SCREEN_WIDTH * 0.04,
    fontFamily: 'DynaPuff',
    textAlign: 'center',
    marginBottom: 16,
  },

  retryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },

  retryText: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.035,
    fontFamily: 'DynaPuff',
  },

  coinsContainer: {
    position: 'absolute',
    top: scaleHeight(20),
    right: scaleWidth(20),
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ffd700',
  },

  coinsText: {
    color: '#ffd700',
    fontSize: SCREEN_WIDTH * 0.035,
    fontFamily: 'DynaPuff'
  },

  shopInfo: {
    marginTop: 4,
    alignItems: 'center',
  },

  shopInfoText: {
    color: '#ffffff94',
    fontSize: SCREEN_WIDTH * 0.025,
    fontFamily: 'DynaPuff',
    textAlign: 'center',
  },

  container: {
    flex: 1
  },
  ImageBackgroundContainer: {
    width: '100%',
    height: '100%',
    alignContent: 'center',
  },
  ImageBackgroundTop:{
    width: scaleWidth(460),
    height: scaleHeight(400),
  },
  ImageBackgroundBottom: {
    width: scaleWidth(700),
    height: scaleHeight(810),
    alignContent: 'center',
    top: scaleHeight(130),
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.54)', 
  },
  topFrame: {
    height: hp(40),
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: scale(20),
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
  },
  bottomFrame: {
    height: hp(60),
    justifyContent: 'center',
    alignItems: 'center',
  },

  potionsOverlay: {
    position: 'absolute',
    zIndex: 100,
    justifyContent: 'center',
    marginTop: scaleHeight(-130)
  },

  detailOverlay: {
    position: 'absolute',
    right: scaleWidth(68),
    top: scaleHeight(6),
    zIndex: 200,
    alignItems: 'center',
  },

  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: scaleWidth(30),
  },
  cardCell: {
    width: '30%',    
    marginBottom: scaleHeight(20),
    alignItems: 'center',
  },

  potionFrame: {
    width: scaleWidth(100),
    aspectRatio: scaleWidth(140) / scaleHeight(200),
    borderRadius: SCREEN_WIDTH * 0.03,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(0, 0, 0, 0.4)',
    borderRightWidth: 2,
    borderRightColor: 'rgba(0, 0, 0, 0.3)',
  },

  
  potionSlot: {
    flex: 1,
    borderRadius: SCREEN_WIDTH * 0.025,
    position: 'relative',
    overflow: 'visible',
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  outOfStockSlot: {
    opacity: 0.4,
  },
  potionSlotInner: {
    flex: 1,
    borderRadius: SCREEN_WIDTH * 0.02,
    padding: 2,
    overflow: 'hidden',
  },
  potionSlotContent: {
    flex: 1,
    borderRadius: SCREEN_WIDTH * 0.015,
    backgroundColor: '#ffffff7b',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.3)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.2)',
  },
  potionHighlight: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderTopLeftRadius: SCREEN_WIDTH * 0.015,
    borderTopRightRadius: SCREEN_WIDTH * 0.015,
  },
  potionShadow: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '30%',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderBottomLeftRadius: SCREEN_WIDTH * 0.015,
    borderBottomRightRadius: SCREEN_WIDTH * 0.015,
  },
  potionImage: {
    position: 'absolute',
    width: scaleWidth(120),
    height: scaleHeight(200),
    borderRadius: 8,
    zIndex: 2,
    resizeMode: 'contain',
  },
  potionImageDetail:{
    position: 'absolute',
    width: scaleWidth(200),
    height: scaleHeight(200),
    borderRadius: 8,
  },
  potionImageDisabled: {
    opacity: 0.3,
  },
  countContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    borderBottomLeftRadius: 10,
    minWidth: scaleWidth(30),
    height: scaleHeight(24),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(112, 63, 0, 1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
    elevation: 3,
    zIndex: 3,
  },
  countContainerDetail:{
    position: 'absolute',
    top: 0,
    right: 0,
    borderBottomLeftRadius: 10,
    minWidth: scaleWidth(50),
    height: scaleHeight(30),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(112, 63, 0, 1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
    elevation: 3,
    zIndex: 3,
  },
  countContainerDisabled: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderColor: '#666',
  },
  countText: {
    color: 'white',
    fontSize: SCREEN_WIDTH * 0.03,
    fontFamily: 'DynaPuff',
  },
  countTextDetail: {
    color: 'white',
    fontSize: SCREEN_WIDTH * 0.05,
    fontFamily: 'DynaPuff',
  },
  nameContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: SCREEN_WIDTH * 0.03,
    borderTopRightRadius: SCREEN_WIDTH * 0.03,
    zIndex: 3,
  },
  nameText: {
    color: '#fbf7f794',
    fontSize: SCREEN_WIDTH * 0.03,
    fontFamily: 'DynaPuff',
    textAlign: 'center',
  },
  nameTextDisabled: {
    color: '#666',
  },
  metaRow: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'DynaPuff',
  },

  detailCard: {
    padding: 10,
    top: scaleHeight(-100),
    borderWidth: scale(4),
    borderRadius: 12,
    width: scaleWidth(250),
    backgroundColor: 'rgba(87, 32, 5, 1)',
    alignItems: 'center',
  },
  detailInfo: {
    marginTop: 12,
    marginBottom: 8,
    alignSelf: 'flex-start',
    marginLeft: SCREEN_WIDTH * 0.07
  },
  detailTitle: {
    color: '#ffffffff',
    fontSize: SCREEN_WIDTH * 0.04,
    fontFamily: 'DynaPuff',
    marginBottom: 4,
  },
  detailText: {
    color: '#bcbcbcff',
    fontSize: SCREEN_WIDTH * 0.03,
    fontFamily: 'DynaPuff',
  },

  detailDescription: {
    color: '#e9e1d9ff',
    fontSize: SCREEN_WIDTH * 0.025,
    fontFamily: 'DynaPuff',
    marginTop: 6,
    textAlign: 'justify',
    marginBottom: 6,
    lineHeight: SCREEN_WIDTH * 0.04,
    maxWidth: scaleWidth(200),
  },

  detailActions: {
    flexDirection: 'row',
    marginTop: 8,
    width: scaleWidth(180),
    alignSelf: 'center',
    gap:10
    
  },

  keyActive: {
    backgroundColor: '#ffffffff',          
    borderColor: '#8f0000ff',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: -1, height: 3 }, 
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 4,
    transform: [{ translateY: 0 }],        
  },
  keyDisabled: {
    backgroundColor: '#e1e1e1',
    borderColor: '#bfbfbf',
  },
  keyText: {
    fontFamily: 'DynaPuff',
    color: '#111827',   
  },

  buyButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginRight: scaleWidth(6),
  },
  backButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000000ff',
    backgroundColor: '#f3f4f6',
  },

  actionText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'DynaPuff'
  },

  finishButton: {
    position: 'absolute',
    bottom: scaleHeight(20),
    alignSelf: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  finishText: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.04,
    fontFamily: 'DynaPuff',
    fontWeight: 'bold',
    textAlign: 'center',
  },

});