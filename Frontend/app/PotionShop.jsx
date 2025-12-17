import React, { useState, useEffect, useRef } from "react";
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
  Animated, 
  Easing,   
} from "react-native";
import {
  scale,
  scaleWidth,
  scaleHeight,
  hp,
  RESPONSIVE,
  gameScale,
} from '../app/Components/Responsiveness/gameResponsive';
import { useLevelData } from '../app/hooks/useLevelData';
import { gameService } from './services/gameService';
import { universalAssetPreloader } from '../app/services/preloader/universalAssetPreloader';
import { Video } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing as ReanimatedEasing,
  cancelAnimation
} from 'react-native-reanimated';


const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const transformPotionData = (potionShop = []) => {
  return potionShop.map(potion => ({
    id: potion.potion_id,
    name: potion.potion_name,
    price: potion.potion_price,
    quantity: potion.player_owned_quantity,
    image: potion.potion_url,
    description: potion.description,
    type: potion.potion_type,
    potion_id: potion.potion_id,
  }));
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

// Potion Sprite Component for animated images
const PotionSprite = ({ icon, disabled = false, frameSize = gameScale(120) }) => {
  const SPRITE_COLUMNS = 6;
  const SPRITE_ROWS = 4;
  const TOTAL_FRAMES = 24;
  const FRAME_DURATION = 40;

  const frameIndex = useSharedValue(0);

  useEffect(() => {
    if (!disabled) {
      frameIndex.value = withRepeat(
        withTiming(TOTAL_FRAMES - 1, {
          duration: TOTAL_FRAMES * FRAME_DURATION,
          easing: ReanimatedEasing.linear,
        }),
        -1,
        false
      );
    } else {
      cancelAnimation(frameIndex);
      frameIndex.value = 0;
    }
    return () => cancelAnimation(frameIndex);
  }, [disabled]);

  const spriteSheetStyle = useAnimatedStyle(() => {
    const index = Math.floor(frameIndex.value);
    const col = index % SPRITE_COLUMNS;
    const row = Math.floor(index / SPRITE_COLUMNS);
    return {
      transform: [
        { translateX: -col * frameSize },
        { translateY: -row * frameSize },
      ],
    };
  });

  return (
    <View style={[styles.spriteContainer, { width: frameSize, height: frameSize, opacity: disabled ? 0.3 : 1, transform: [{ translateX: -frameSize/2 }, { translateY: -frameSize/2 }] }]}>
      <Reanimated.View style={[
        styles.spriteSheet,
        {
          width: frameSize * SPRITE_COLUMNS,
          height: frameSize * SPRITE_ROWS
        },
        spriteSheetStyle
      ]}>
        <Image
          source={{ uri: icon }}
          style={styles.spriteImage}
          resizeMode="stretch"
        />
      </Reanimated.View>
    </View>
  );
};

// --- ANIMATION COMPONENT FOR DROPPING EFFECT ---
const PotionDropAnimation = ({ imageUri, onAnimationComplete }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 1500, // Slower drop duration
      useNativeDriver: true,
      easing: Easing.in(Easing.quad), // Gravity-like acceleration
    }).start(() => {
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    });
  }, []);

  // STARTING POSITION: Approximate center of the Detail Modal Potion Image
  const startX = SCREEN_WIDTH * 0.5 - scaleWidth(60); 
  const startY = SCREEN_HEIGHT * 0.35; 

  // END POSITION: Center of the Inventory Cabinet at bottom
  const endY = SCREEN_HEIGHT - scaleHeight(5);
  const endX = SCREEN_WIDTH / 2 - scaleWidth(30); 

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [startY, endY],
  });

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [startX, endX],
  });

  const scaleAnim = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.1], // Shrink as it enters the inventory
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [1, 1, 0], // Fade out at the very end
  });

  return (
    <Animated.View
      style={[
        styles.droppingPotionContainer,
        {
          transform: [
            { translateX },
            { translateY },
            { scale: scaleAnim }
          ],
          opacity
        },
      ]}
    >
      <PotionSprite icon={imageUri} frameSize={gameScale(300)} />
    </Animated.View>
  );
};
// --------------------------------------------------

export default function PotionShop() {
  const params = useLocalSearchParams(); 
  const router = useRouter()
  
  const levelId = parseInt(params.levelId) || 5; 
  const playerId = parseInt(params.playerId) || 11; 
  const levelData = params.levelData ? JSON.parse(params.levelData) : null; 

  const [selected, setSelected] = useState(null);
  const [potions, setPotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playerCoins, setPlayerCoins] = useState(0);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [buyingPotion, setBuyingPotion] = useState(false); 
  
  // State for dropping animation
  const [droppingPotion, setDroppingPotion] = useState(null);

  const fetchPotionData = async () => {
    try {
      // Only set main loading on initial load to avoid flickering during drops
      if(potions.length === 0) setLoading(true);
      setError(null);
      
      const response = await gameService.getShopPotions(playerId);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch potion shop');
      }

      const { potionShop, player_info } = response.data;
      
      const transformedPotions = transformPotionData(potionShop);
      setPotions(transformedPotions);
      setPlayerCoins(player_info?.coins || 0);
      
      if (transformedPotions.length > 0 && !assetsLoading) {
        setAssetsLoading(true);
        await preloadPotionAssets(transformedPotions);
        setAssetsLoading(false);
      }

    } catch (err) {
      setError(err.message || 'Failed to load potion shop');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPotionData();
  }, [levelId, playerId]); 

  const handleBuyPotion = async (potion) => {
    if (buyingPotion) return; 

    setBuyingPotion(true);
    setError(null);

    try {
      const response = await gameService.buyPotion(playerId, potion.potion_id); 

      if (response.success) {
        // 1. Trigger Animation BEFORE fetching new data
        const cachedImage = getCachedImagePath(potion.image);
        setDroppingPotion(cachedImage);

        // 2. Wait for animation to mostly finish before updating UI
        await new Promise(resolve => setTimeout(resolve, 1500));

        await fetchPotionData();
        // Close the modal after drop
        setSelected(null);

      } else {
        setError(response.error || 'Purchase failed');
      }
    } catch (purchaseError) {
      setError(purchaseError.message || 'Unable to complete purchase. Please try again.');
    } finally {
      setBuyingPotion(false);
    }
  };

  const preloadPotionAssets = async (potionData) => {
    try {
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

      if (assets.length === 0) return;

      await Promise.allSettled(
        assets.map(asset => 
          universalAssetPreloader.downloadSingleAsset(
            asset.url,
            asset.category,
            () => {}
          )
        )
      );
    } catch (error) {
      console.error('❌ Error preloading potion assets:', error);
    }
  };

  const getCachedImagePath = (url) => {
    return universalAssetPreloader.getCachedAssetPath(url);
  };

  const handleRetry = () => {
    setError(null);
    fetchPotionData();
  };

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
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
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

        <View style={styles.backButtonContainer}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}  // Navigate back
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row' }}>
            <Text style={styles.backButtonText}>{"<"}</Text>
            <Text style={styles.backButtonTextBack}>Back</Text>
          </View>
        </TouchableOpacity>
        </View>
        
        <View style={styles.topFrame}>
          <Video
            source={{ uri: 'https://micomi-assets.me/Hero%20Selection%20Components/Shi-Shi%20Shop.mp4' }}
            style={styles.ImageBackgroundTop}
            shouldPlay
            isLooping
            resizeMode="contain"
            useNativeControls={false}
            isMuted={true}
          />
        </View>
        
        <View style={styles.bottomFrame}>
          <ImageBackground 
            source={{ uri: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1760334965/shop_holder_deydxu.png' }} 
            style={styles.ImageBackgroundBottom}
            resizeMode="contain"
          >
          </ImageBackground>

          <View style={styles.potionsOverlay}>
             <PotionsGrid data={potions} onSelect={setSelected} getCachedImagePath={getCachedImagePath} />
            
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

          {/* NEW INVENTORY CABINET WITH 3-LAYER BORDER */}
          <View style={styles.cabinetOuterBorder}>
            <View style={styles.cabinetMiddleBorder}>
              <View style={styles.cabinetInnerBorder}>
                <View style={styles.inventoryCabinet}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.inventoryScroll}>
                    {potions.filter(p => p.quantity > 0).map((potion, index) => (
                      <View key={`inv-${potion.id}`} style={styles.inventorySlot}>
                        <View style={styles.inventoryImageContainer}>
                          <PotionSprite 
                            icon={getCachedImagePath(potion.image)} 
                            frameSize={gameScale(70)}
                          />
                        </View>
                        <View style={styles.inventoryCountBadge}>
                          <Text style={styles.inventoryCountText}>{potion.quantity}</Text>
                        </View>
                        {/* Vertical Separator */}
                        <View style={styles.cabinetSeparator} />
                      </View>
                    ))}
                    {potions.filter(p => p.quantity > 0).length === 0 && (
                      <Text style={styles.emptyInventoryText}>No potions yet</Text>
                    )}
                  </ScrollView>
                </View>
              </View>
            </View>
          </View>

        </View>

        {/* DROPPING POTION ANIMATION OVERLAY */}
        {droppingPotion && (
          <PotionDropAnimation 
            imageUri={droppingPotion} 
            onAnimationComplete={() => setDroppingPotion(null)}
          />
        )}

      </ImageBackground>
    </View>
  );
}

function PotionsGrid({ data, onSelect, getCachedImagePath }) {
  return (
    <ScrollView 
      contentContainerStyle={styles.gridWrap}
      showsVerticalScrollIndicator={false}
    >
      {data.map((potion) => {
        const colors = getPotionColors(potion.name);
        const cachedImagePath = getCachedImagePath(potion.image);
        
        return (
          <View key={potion.id} style={styles.cardCell}>
            <Pressable
              onPress={() => onSelect(potion)} 
              style={({ pressed }) => [
                styles.potionFrame,
                { backgroundColor: colors.frameColor },
                pressed && { transform: [{ translateY: 1 }] },
              ]}
            >
               {/* --- CHANGED: Name Tag Moved to Header --- */}
               <View style={styles.nameTagHeader}>
                  <Text style={styles.nameText}>{potion.name}</Text>
               </View>
               
               {/* --- 3D DOTS (Bolts/Rivets) --- */}
               <View style={[styles.cornerDot, styles.dotTopLeft]} />
               <View style={[styles.cornerDot, styles.dotTopRight]} />
               <View style={[styles.cornerDot, styles.dotBottomLeft]} />
               <View style={[styles.cornerDot, styles.dotBottomRight]} />

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
                    
                    <PotionSprite 
                      icon={cachedImagePath} 
                    />
                    
                    {/* Name container removed from bottom */}
                  </View>
                </View>
              </View>
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}

function DetailView({ selected, onBack, playerCoins, getCachedImagePath, onBuy, buyingPotion }) {
  const colors = getPotionColors(selected.name);
  const cannotBuy = playerCoins < selected.price;
  const cachedImagePath = getCachedImagePath(selected.image);
  

  const buttonBorderColors = {
    outerBg: '#01547dff',
    outerBorderTop: '#0d1f33',
    outerBorderBottom: '#01547dff',
    middleBg: '#152d4a',
    middleBorderTop: '#01547dff',
    middleBorderBottom: '#0a1929',
    innerBg: 'rgba(74, 144, 217, 0.15)',
    innerBorder: 'rgba(74, 144, 217, 0.3)',
  };

  const buttonSelectedBorderColors = {
    outerBg: '#a77125ff',
    outerBorderTop: '#a77125ff',
    outerBorderBottom: '#a77125ff',
    middleBg: '#a77125ff',
    middleBorderTop: '#a77125ff',
    middleBorderBottom: '#a77125ff',
    innerBg: '#a77125ff',
    innerBorder: '#a77125ff',
  };

  const buttonDisabledBorderColors = {
    outerBg: '#6b6b6e',
    outerBorderTop: '#4a4a4c',
    outerBorderBottom: '#8e8e91',
    middleBg: '#5a5a5d',
    middleBorderTop: '#9e9ea1',
    middleBorderBottom: '#3a3a3c',
    innerBg: 'rgba(158, 158, 161, 0.15)',
    innerBorder: 'rgba(158, 158, 161, 0.3)',
  };

  
  const renderButton = (title, onPress, isDisabled, isBuyButton = false) => {
    const buttonColors = isDisabled ? buttonDisabledBorderColors : buttonSelectedBorderColors;

    return (
      <View style={styles.buttonContainer}>
        {/* 3-Layer Border - Outer */}
        <View style={[
          styles.buttonBorderOuter,
          {
            backgroundColor: buttonColors.outerBg,
            borderTopColor: buttonColors.outerBorderTop,
            borderLeftColor: buttonColors.outerBorderTop,
            borderBottomColor: buttonColors.outerBorderBottom,
            borderRightColor: buttonColors.outerBorderBottom,
          }
        ]}>
          {/* 3-Layer Border - Middle */}
          <View style={[
            styles.buttonBorderMiddle,
            {
              backgroundColor: buttonColors.middleBg,
              borderTopColor: buttonColors.middleBorderTop,
              borderLeftColor: buttonColors.middleBorderTop,
              borderBottomColor: buttonColors.middleBorderBottom,
              borderRightColor: buttonColors.middleBorderBottom,
            }
          ]}>
            {/* 3-Layer Border - Inner (Touchable) */}
            <TouchableOpacity 
              style={[
                styles.buttonBorderInner,
                {
                  backgroundColor: buttonColors.innerBg,
                  borderColor: buttonColors.innerBorder,
                }
              ]}
              onPress={onPress}
              disabled={isDisabled}
            >
              <View style={styles.buttonInnerContent}>
                <View style={styles.buttonHighlight} />
                <View style={styles.buttonShadow} />
                <Text style={[
                  styles.buttonText,
                  isDisabled && styles.buttonTextDisabled
                ]}>
                  {title}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };


   return (
    <View style={[styles.detailCard, { borderColor: colors.border }]}>
      <View style={[styles.potionFrame, { 
        backgroundColor: colors.frameColor, 
        width: SCREEN_WIDTH * 0.45, 
        height: SCREEN_WIDTH * 0.55 
      }]}>
         {/* --- 3D DOTS for Detail View too --- */}
         <View style={[styles.cornerDot, styles.dotTopLeft]} />
         <View style={[styles.cornerDot, styles.dotTopRight]} />
         <View style={[styles.cornerDot, styles.dotBottomLeft]} />
         <View style={[styles.cornerDot, styles.dotBottomRight]} />

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
              
              <PotionSprite 
                icon={cachedImagePath} 
                frameSize={gameScale(200)}
              />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.detailInfo}>
        <Text style={styles.detailTitle}>{selected.name} Potion</Text>
        <Text style={styles.detailText}>Price: {selected.price} coins</Text>
        <Text style={styles.detailDescription}>{selected.description}</Text>
      </View>

      <View style={styles.detailActions}>
        {renderButton(
          buyingPotion ? 'Buying...' : (playerCoins < selected.price ? 'Not Enough Coins' : 'Buy'),
          () => onBuy(selected),
          cannotBuy || buyingPotion,
          true
        )}
        {renderButton('Back', onBack, buyingPotion)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ... existing styles ...
  container: {
    flex: 1
  },
  
  droppingPotionContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 9999, 
    elevation: 20,
    width: gameScale(100),
    height: gameScale(100),
    justifyContent: 'center',
    alignItems: 'center',
  },
  droppingImage: {
    width: gameScale(100),
    height: gameScale(100),
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
    // Needed for positioning dots and header
    position: 'relative', 
    marginTop: scaleHeight(15), // Add space for the header tag
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
  
  nameText: {
    color: '#ffffffff',
    fontSize: SCREEN_WIDTH * 0.026,
    fontFamily: 'Grobold',
    textAlign: 'center',
    textShadowColor: '#000000aa',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },

  buttonContainer: {
    flex: 1,
    marginHorizontal: scaleWidth(5),
  },
  buttonBorderOuter: {
    borderRadius: scale(5),
    borderWidth: scale(1),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.3,
    shadowRadius: scale(4),
    elevation: 4,
  },
  buttonBorderMiddle: {
    borderRadius: scale(5),
    borderWidth: scale(1),
  },
  buttonBorderInner: {
    borderRadius: scale(5),
    borderWidth: scale(1),
    overflow: 'hidden',
  },
  buttonInnerContent: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: RESPONSIVE.margin.xs,
    paddingHorizontal: RESPONSIVE.margin.sm,
  },
  buttonHighlight: {
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderTopLeftRadius: RESPONSIVE.borderRadius.xs,
    borderTopRightRadius: RESPONSIVE.borderRadius.xs,
    pointerEvents: 'none',
  },
  buttonShadow: {
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    height: '30%',
    backgroundColor: 'rgba(0, 0, 0, 0.15)', 
    borderBottomLeftRadius: RESPONSIVE.borderRadius.xs,
    borderBottomRightRadius: RESPONSIVE.borderRadius.xs,
    pointerEvents: 'none',
  },
  buttonText: {
    fontSize: RESPONSIVE.fontSize.sm,
    color: '#ffffff', 
    textAlign: 'center',
    fontFamily: 'DynaPuff', 
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: scale(1), height: scale(1) },
    textShadowRadius: scale(2),
    zIndex: 1,
  },
  buttonTextDisabled: {
    color: '#f2f2f7',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
  },

  
  // --- NEW 3D DOTS STYLES ---
  cornerDot: {
    position: 'absolute',
    width: scale(5),
    height: scale(5),
    borderRadius: scale(2.5),
    backgroundColor: '#d4af37', // Gold/Brass color
    borderWidth: 1,
    borderColor: '#8b4513',
    zIndex: 5,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.5,
    elevation: 2,
  },
  dotTopLeft: {
    top: 4,
    left: 4,
  },
  dotTopRight: {
    top: 4,
    right: 4,
  },
  dotBottomLeft: {
    bottom: 4,
    left: 4,
  },
  dotBottomRight: {
    bottom: 4,
    right: 4,
  },
  // ---------------------------

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
  spriteContainer: {
    overflow: 'hidden',
    position: 'absolute',
    zIndex: 2,
    top: '50%',
    left: '50%',
  },
  spriteSheet: {
    // Dynamic size set in-line
  },
  spriteImage: {
    width: '100%',
    height: '100%',
  },
  // INVENTORY CABINET STYLES WITH 3-LAYER BORDER
  cabinetOuterBorder: {
    position: 'absolute',
    bottom: gameScale(-80),
    left: 0,
    right: 0,
    backgroundColor: '#943f02ff', 
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 3, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 20,
    zIndex: 200,
  },
  cabinetMiddleBorder: {
    flex: 1,
    backgroundColor: '#8b371eff',
    padding: 3,   
  },
  cabinetInnerBorder: {
    flex: 1,
    backgroundColor: '#3e2723', 
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    overflow: 'hidden',
  },
  inventoryCabinet: {
    flex: 1,
    backgroundColor: '#58362eff', 
    justifyContent: 'center',
  },
  inventoryScroll: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  inventorySlot: {
    width: scaleWidth(80),
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  inventoryImageContainer: {
    width: scaleWidth(60),
    height: scaleWidth(60),
    justifyContent: 'center',
    alignItems: 'center',
  },
  inventoryCountBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 3,
  },
  inventoryCountText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'DynaPuff',
  },
  cabinetSeparator: {
    position: 'absolute',
    right: 0,
    top: 2,
    bottom: 15,
    width: 2,
    height: '100%',
    backgroundColor: '#3E2723', 
    borderRightWidth: 1,
    borderRightColor: '#5D4037', 
  },
  emptyInventoryText: {
    color: '#a1887f',
    fontFamily: 'DynaPuff',
    fontSize: 16,
    alignSelf: 'center',
    width: '100%',
    textAlign: 'center',
    marginTop: 0,
  },
  backButtonContainer: {
    position: 'absolute',
    top: scaleHeight(20), 
    left: scaleWidth(20),
    zIndex: 1000, 
  },
  backButton: {
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(8),
  },
  backButtonText: {
    color: '#fff',
    fontSize: scaleWidth(50),
    fontFamily: 'MusicVibes'
  },
  backButtonTextBack: {
    color: '#fff',
    fontSize: scaleWidth(20),
    top: scaleHeight(15),
    left: scaleWidth(10),
    fontFamily: 'MusicVibes'
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#fff', fontSize: 16, fontFamily: 'DynaPuff', marginTop: 16 },
  subLoadingText: { color: '#fff', fontSize: 12, fontFamily: 'DynaPuff', marginTop: 8 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  errorText: { color: '#ff6b6b', fontSize: 16, fontFamily: 'DynaPuff', textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: '#2563eb', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryText: { color: '#fff', fontSize: 14, fontFamily: 'DynaPuff' },
});