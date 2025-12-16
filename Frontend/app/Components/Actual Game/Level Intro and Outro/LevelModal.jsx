import { ImageBackground } from 'expo-image';
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, Modal, Pressable, StyleSheet, Dimensions, Image, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { levelService } from '../../../services/levelService';
import { useRouter } from 'expo-router';
import PotionShop from '../../../PotionShop';
import ShopLevelModal from './ShopLevelModal'; 
import BossLevelModal from './BossLevelModal';
import {WebView} from 'react-native-webview';
import { gameScale, BASE_HEIGHT} from '../../Responsiveness/gameResponsive';
import { universalAssetPreloader } from '../../../services/preloader/universalAssetPreloader';

const LevelModal = ({ 
  visible = false,
  onClose = () => {},
  onPlay = () => {},
  levelId = null,
  playerId = 11,
  levelData = null,
  navigation = null 
}) => {
  const router = useRouter();
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false); 

  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const playButtonSlideAnim = useRef(new Animated.Value(100)).current;
  const backgroundOpacityAnim = useRef(new Animated.Value(0)).current;
  
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  

  const [showWebView, setShowWebView] = useState(false); 

  const getCachedAssetUrl = useCallback((url) => {
    if (!url) return url;
    return universalAssetPreloader.getCachedAssetPath(url);
  }, []);

  useEffect(() => {
    if (visible && levelId && !levelData) {
      fetchLevelPreview();
    }
  }, [visible, levelId, levelData]);

  useEffect(() => {
    if (visible) {
      startEntranceAnimation();
      startContinuousAnimations();
    } else {
      resetAnimations();
    }
  }, [visible]);

  //  Smooth continuous animations
  const startContinuousAnimations = () => {
    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1.1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        })
      ])
    ).start();

    // Scan line animation
    Animated.sequence([
    // First scan
    Animated.timing(scanLineAnim, {
      toValue: 2,
      duration: 3000,
      easing: Easing.linear,
      useNativeDriver: true,
    }),
    // Reset to top
    Animated.timing(scanLineAnim, {
      toValue: 0,
      duration: 100,
      easing: Easing.linear,
      useNativeDriver: true,
    }),
    // Second scan
    Animated.timing(scanLineAnim, {
      toValue: 2,
      duration: 3000,
      easing: Easing.linear,
      useNativeDriver: true,
    })
  ]).start();
  };

  const handlePlayPress = useCallback(() => {
  if (isAnimating) return;
  
  const levelType = displayData?.level?.level_type;
  
  console.log('🎮 Play button pressed:', {
    levelId,
    playerId,
    levelData: displayData,
    levelType
  });

  handleModalClose();

  setTimeout(() => {
    try {
      if (levelType === "shopButton") {
        // Navigate to PotionShop for shop levels
        router.push({
          pathname: '/PotionShop',
          params: {
            playerId: playerId,
            levelId: levelId,
            levelData: JSON.stringify(displayData || {})
          }
        });
      } else if (levelType === "micomiButton") {
        // Navigate to Micomic for comic levels
        router.push({
          pathname: '/Micomic',
          params: {
            playerId: playerId,
            levelId: levelId
          }
        });
      } else {
        // Existing GamePlay navigation for other levels
        router.push({
          pathname: '/GamePlay', 
          params: {
            playerId: playerId,
            levelId: levelId,
            levelData: JSON.stringify(displayData || {})
          }
        });
      }
    } catch (error) {
      console.error('Navigation error:', error);
      onPlay({
        playerId,
        levelId,
        levelData: displayData
      });
    }
  }, 100);
}, [isAnimating, playerId, levelId, displayData, handleModalClose, router, onPlay]);

  //  Much smoother entrance animation
  const startEntranceAnimation = () => {
    setIsAnimating(true);
    
    // Reset all values for smooth entrance
    scaleAnim.setValue(0.3);
    rotateAnim.setValue(0);
    opacityAnim.setValue(0);
    slideAnim.setValue(-200);
    playButtonSlideAnim.setValue(100);
    backgroundOpacityAnim.setValue(0);
    bounceAnim.setValue(0);

    //  Staggered smooth entrance
    Animated.parallel([
      // Background fade in
      Animated.timing(backgroundOpacityAnim, {
        toValue: 1,
        duration: 100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      
      // Main modal entrance
      Animated.sequence([
        Animated.delay(100),
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 60,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 50,
            easing: Easing.out(Easing.back(1.2)),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 100,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
        ])
      ]),
      
      // Play button entrance (delayed)
      Animated.sequence([
        Animated.delay(400),
        Animated.spring(playButtonSlideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        })
      ]),
      
      // Subtle bounce effect
      Animated.sequence([
        Animated.delay(600),
        Animated.spring(bounceAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        })
      ])
    ]).start(() => {
      setIsAnimating(false);
    });
  };

  //  Smooth exit animation
  const handleModalClose = () => {
    setIsAnimating(true);
    
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 250,
        easing: Easing.in(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(playButtonSlideAnim, {
        toValue: 150,
        duration: 200,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(backgroundOpacityAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsAnimating(false);
      onClose();
    });
  };

  const resetAnimations = () => {
    scaleAnim.setValue(0.3);
    rotateAnim.setValue(0);
    opacityAnim.setValue(0);
    slideAnim.setValue(-200);
    playButtonSlideAnim.setValue(100);
    backgroundOpacityAnim.setValue(0);
    bounceAnim.setValue(0);
    glowAnim.setValue(0);
    scanLineAnim.setValue(0);
    setIsAnimating(false);
  };

  const fetchLevelPreview = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`🎮 Fetching level preview for level ${levelId}, player ${playerId}`);
      
      //  Load cached assets into memory first
      await universalAssetPreloader.loadCachedAssets('game_animations');
      await universalAssetPreloader.loadCachedAssets('game_images');
      
      const response = await levelService.getLevelPreview(levelId);
      console.log('📊 Level preview response:', response);
      
      if (response.success) {
        //  Transform avatar URLs to use cached paths
        const transformedData = transformPreviewDataWithCache(response.data);
        setPreviewData(transformedData);
      } else {
        setError('Failed to load level data');
      }
    } catch (err) {
      console.error('❌ Error fetching level preview:', err);
      setError('Failed to load level data');
    } finally {
      setLoading(false);
    }
  };

  const transformPreviewDataWithCache = (data) => {
    if (!data) return data;

    const transformed = { ...data };

    // Transform enemy avatar
    if (transformed.enemy?.enemy_avatar) {
      const cachedPath = universalAssetPreloader.getCachedAssetPath(transformed.enemy.enemy_avatar);
      if (cachedPath !== transformed.enemy.enemy_avatar) {
        console.log(`📦 LevelModal: Using cached enemy avatar`);
        transformed.enemy = {
          ...transformed.enemy,
          enemy_avatar: cachedPath
        };
      }
    }

    // Transform character avatar
    if (transformed.character?.character_avatar) {
      const cachedPath = universalAssetPreloader.getCachedAssetPath(transformed.character.character_avatar);
      if (cachedPath !== transformed.character.character_avatar) {
        console.log(`📦 LevelModal: Using cached character avatar`);
        transformed.character = {
          ...transformed.character,
          character_avatar: cachedPath
        };
      }
    }

    return transformed;
  };



  const displayData = useMemo(() => {
    const data = previewData || levelData;
    if (!data) return null;
    
    // Transform if not already transformed
    return transformPreviewDataWithCache(data);
  }, [previewData, levelData]);
  
  if (!displayData && !loading) {
    return null;
  }

  const mappedLevelData = displayData ? {
    level_number: displayData.level?.level_number || 1,
    level_type: displayData.enemy?.enemy_name || 'Unknown Enemy',
    level_difficulty: displayData.level?.level_difficulty?.toUpperCase() || 'UNKNOWN',
    level_title: displayData.level?.level_title || 'Untitled Level',
    content: displayData.level?.content || 'No description available.',
    points_reward: displayData.level?.total_points || 0,
    coins_reward: displayData.level?.total_coins || 0,
    is_unlocked: true,
    enemy_name: displayData.enemy?.enemy_name || 'Unknown',
    enemy_health: displayData.enemy?.enemy_health || 0,
    enemy_damage: displayData.enemy?.enemy_damage || 0,
    enemy_avatar: displayData.enemy?.enemy_avatar || null,
    character_name: displayData.character?.character_name || 'Unknown',
    character_health: displayData.character?.character_health || 0,
    character_avatar: displayData.character?.character_avatar || null,
    energy_cost: displayData.energy || 0,
    player_coins: displayData.player_info?.player_coins || 0
  } : {};

  //  Smooth interpolations
  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['20deg', '0deg'],
  });

  const scaleInterpolate = scaleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.9, 1],
  });

  const bounceInterpolate = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });

  const glowInterpolate = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

   const scanLineTranslate = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [gameScale(-50), gameScale(BASE_HEIGHT * 0.4 + 50)],
  });

  const isShopLevel = displayData?.level?.level_type === "shopButton";
  const isBossLevel = displayData?.level?.level_type === "bossButton"; 
  const potionShopData = displayData?.potionShop || [];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
    >
      <Animated.View 
        style={[
          styles.modalOverlay,
          {
            opacity: backgroundOpacityAnim,
          }
        ]}
      >
        {loading && (
          <Animated.View 
            style={[
              styles.loadingContainer,
              {
                opacity: opacityAnim,
                transform: [
                  { scale: scaleAnim },
                  { translateY: slideAnim }
                ],
              }
            ]}
          >
            <Text style={styles.loadingText}>Loading level data...</Text>
          </Animated.View>
        )}
        
        {error && (
          <Animated.View 
            style={[
              styles.errorContainer,
              {
                opacity: opacityAnim,
                transform: [
                  { scale: scaleAnim },
                  { translateY: slideAnim }
                ],
              }
            ]}
          >
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={fetchLevelPreview}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </Animated.View>
        )}

        {displayData && (
          <Animated.View 
            style={[
              styles.robotHead,
              {
                opacity: opacityAnim,
                transform: [
                  { scale: scaleInterpolate },
                  { rotateX: rotateInterpolate },
                  { translateY: Animated.add(slideAnim, bounceInterpolate) },
                ],
              }
            ]}
          >
            <View style={styles.outerBorder}>
              <View style={styles.visor}>
                <ImageBackground
                source={{ uri: isShopLevel ? 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1759901895/labBackground_otqad4.jpg' :  
                    'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1759901895/labBackground_otqad4.jpg' }}
            imageStyle={styles.backgroundImage} 
            resizeMode="cover"
>
                  <LinearGradient
                    colors={[
                      'rgba(15, 55, 95, 1)',
                      'rgba(15, 55, 95,  0.15)',
                      'rgba(15, 55, 95,  0.15)',
                      'rgba(15, 55, 95,  0.13)',
                      'rgba(15, 55, 95,  0.15)',
                      'rgba(15, 55, 95,  0.15)',
                      'rgba(29, 76, 124, 1)',
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.visorGlass}
                  >
                    <View style={styles.techGrid} />

                    {/*  Animated scan line */}
                    <Animated.View 
                      style={[
                        styles.scanLine,
                        {
                          transform: [{ translateY: scanLineTranslate }]
                        }
                      ]} 
                    />

                    <View style={styles.modalContent}>
                      <Animated.View 
                        style={[
                          styles.textContainer,
                          {
                            transform: [{ scale: bounceAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 1.02]
                            })}]
                          }
                        ]}
                      >
                         <Text style={styles.levelTitle}>
                          {isShopLevel ? "Potion Shop" : `Level: ${mappedLevelData.level_number}`}
                        </Text>
                      </Animated.View>

                      {isShopLevel ? (
                        <ShopLevelModal potionShopData={potionShopData} opacityAnim={opacityAnim} bounceAnim={bounceAnim} />
                      ) : isBossLevel ? (
                          <BossLevelModal bossData={displayData?.enemy} opacityAnim={opacityAnim} bounceAnim={bounceAnim} glowAnim={glowAnim} /> 
                        ) : (
                        mappedLevelData.enemy_avatar && (
                          <Animated.View 
                            style={[
                              styles.enemyAvatarContainer,
                              {
                                transform: [
                                  { scale: bounceAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [1, 1.03]
                                  })}
                                ]
                              }
                            ]}
                          >
                            <View style={styles.enemyFoundContainer}>
                              <View style={styles.curvedEnemyFoundContainer}>
                                {'Bug Found!'.split('').map((char, index, array) => {
                                  const totalChars = array.length;
                                  const centerIndex = (totalChars - 1) / 2;
                                  const distanceFromCenter = index - centerIndex;
                                  const maxRotation = -1; 
                                  const rotationAngle = (distanceFromCenter / centerIndex) * maxRotation;
                                  const radiusOffset = Math.abs(distanceFromCenter) * 2;
                                  
                                  return (
                                    <Animated.Text 
                                      key={index}
                                      style={[
                                        styles.curvedEnemyFoundCharacter,
                                        {
                                          opacity: glowInterpolate,
                                          transform: [
                                            { rotate: `${rotationAngle}deg` },
                                            { translateY: radiusOffset }
                                          ],
                                        }
                                      ]}
                                    >
                                      {char}
                                    </Animated.Text>
                                  );
                                })}
                              </View>
                            </View>

                            <View style={styles.avatarFrame}>
                              {/* This View now acts as the circular frame, using the original styles */}
                              <Animated.View 
                                style={[
                                  styles.enemyAvatar,
                                  {
                                    opacity: glowInterpolate,
                                    overflow: 'hidden', // Clip the image inside
                                    justifyContent: 'center', // Center the image horizontally
                                    alignItems: 'center',     // Center the image vertically
                                  }
                                ]}
                              >
                                {/* The Image is now inside the frame and can be sized independently */}
                                <Image 
                                  source={{ uri: mappedLevelData.enemy_avatar }}
                                  style={{
                                    width: gameScale(170), 
                                    marginBottom: gameScale(-10),
                                    height: '100%',       // Fill the height of the frame
                                  }}
                                  resizeMode="cover"
                                />
                              </Animated.View>

                              <Animated.View 
                                style={[
                                  styles.enemyAvatarGlow,
                                  {
                                    opacity: glowInterpolate,
                                    transform: [
                                      { scale: glowInterpolate }
                                    ]
                                  }
                                ]} 
                              />
                            </View>

                            <View style={styles.enemyNameContainer}>
                              <View style={styles.curvedTextContainer}>
                                {mappedLevelData.enemy_name.split('').map((char, index, array) => {
                                  const totalChars = array.length;
                                  const centerIndex = (totalChars - 1) / 2;
                                  const distanceFromCenter = index - centerIndex;
                                  const maxRotation = 10;
                                  const rotationAngle = (distanceFromCenter / centerIndex) * maxRotation;
                                  const radiusOffset = gameScale(Math.abs(distanceFromCenter) * 8)
                                  
                                  return (
                                    <Animated.Text 
                                      key={index}
                                      style={[
                                        styles.curvedCharacter,
                                        {
                                          opacity: glowInterpolate,
                                          transform: [
                                            { rotate: `${rotationAngle}deg` },
                                            { translateY: -radiusOffset }
                                          ],
                                        }
                                      ]}
                                    >
                                      {char}
                                    </Animated.Text>
                                  );
                                })}
                              </View>
                            </View>
                          </Animated.View>
                        )
                      )}
                    
                      <Animated.View 
                        style={[
                          styles.contentContainer,
                          {
                            opacity: opacityAnim,
                            transform: [
                              { translateY: slideAnim.interpolate({
                                inputRange: [-200, 0],
                                outputRange: [50, 0]
                              })}
                            ]
                          }
                        ]}
                      >
                        <Text style={styles.contentText}>
                          {isShopLevel ? "Stock up on potions before continuing your adventure!" : mappedLevelData.content}
                        </Text>
                      </Animated.View>

                      {isBossLevel && (
                        <Pressable style={styles.showProjectButton} onPress={() => setShowWebView(true)}>
                          <Text style={styles.showProjectText}>Show Project</Text>
                        </Pressable>
                      )}

                      <Animated.View 
                        style={[
                          styles.rewardContainer,
                          {
                            opacity: opacityAnim,
                            transform: [
                              { translateY: slideAnim.interpolate({
                                inputRange: [-200, 0],
                                outputRange: [80, 0]
                              })}
                            ]
                          }
                        ]}
                      >
                        <View style={styles.rewardFrames}>
                          <View style={styles.rewardSection}>
                            <Text style={styles.sectionLabel}>Hero</Text>
                            <View style={styles.rewardFrame}>
                              <View style={styles.rewardBox}>
                                <View style={styles.rewardIconContainer}>
                                  {mappedLevelData.character_avatar ? (
                                    <Image 
                                      source={{ uri: mappedLevelData.character_avatar }}
                                      style={styles.heroAvatar}
                                      resizeMode="cover"
                                    />
                                  ) : (
                                    <Text style={styles.rewardIcon}>👤</Text>
                                  )}
                                </View>
                              </View>
                            </View>
                          </View>
                          
                          <View style={styles.rewardSection}>
                            <Text style={styles.sectionLabel}>Rewards</Text>
                            <View style={styles.rewardSubFrames}>
                              <View style={styles.rewardItem}>
                                <Image 
                                  source={{uri: 'https://github.com/user-attachments/assets/cdbba724-147a-41fa-89c5-26e7252c66cd'}} 
                                  style={styles.rewardImage}
                                  resizeMode="cover"
                                />
                                <Text style={styles.rewardText}>{mappedLevelData.coins_reward}</Text>
                              </View>

                              <View style={styles.rewardItem}>
                                <Image 
                                  source={{uri: 'https://github.com/user-attachments/assets/4e1d0813-aa7d-4dcf-8333-a1ff2cd0971e'}} 
                                  style={styles.rewardImage}
                                  resizeMode="cover"
                                />
                                <Text style={styles.rewardText}>{mappedLevelData.points_reward}</Text>
                              </View> 
                            </View>
                          </View>

                          <View style={styles.rewardSection}>
                            <Text style={styles.sectionLabel}>Energy Cost</Text>
                            <View style={styles.rewardItem}>
                              <Image 
                                source={{uri: 'https://github.com/user-attachments/assets/4e1d0813-aa7d-4dcf-8333-a1ff2cd0971e'}} 
                                style={styles.rewardImage}
                                resizeMode="cover"
                              />
                              <Text style={styles.rewardText}>{mappedLevelData.energy_cost}</Text>
                            </View>
                          </View>
                        </View>
                      </Animated.View>
                    </View>
                  </LinearGradient>
                </ImageBackground>
              </View>
            </View>

             <Pressable 
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.closeButtonPressed
                ]}
                onPress={handleModalClose}
                disabled={isAnimating}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            
            {/*  Smooth close button */}
            <Animated.View
              style={{
                opacity: opacityAnim,
                transform: [
                  { scale: scaleAnim },
                  { rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['45deg', '0deg']
                  })}
                ]
              }}
            >
             
            </Animated.View>
          </Animated.View>
        )}

        {displayData && !loading && !error && (
          <Animated.View 
            style={[
               styles.playButtonContainer,
              isBossLevel && styles.playButtonContainerBoss,
              {
                opacity: opacityAnim,
                transform: [
                  { 
                    scale: scaleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1]
                    })
                  },
                  { translateY: playButtonSlideAnim },
                ],
              }
            ]}
          >
            <Pressable 
              style={({ pressed }) => [
                styles.playButtonOuter,
                pressed && styles.playButtonPressed,
                {
                  shadowOpacity: pressed ? 0.3 : 0.6,
                  transform: pressed ? [{ translateY: 3 }, { scale: 0.98 }] : [{ translateY: 0 }, { scale: 1 }]
                }
              ]}
              onPress={handlePlayPress}
              disabled={isAnimating}
            >
              <LinearGradient
                colors={[
                  'rgba(0, 159, 227, 0.76)',
                  'rgba(0, 159, 227, 0.76)'
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.playButtonMiddle}
              >
                <Animated.Text 
                  style={[
                    styles.playButtonText,
                    {
                      opacity: glowInterpolate,
                    }
                  ]}
                >
                  {isShopLevel ? "ENTER SHOP" : "PLAY"}
                </Animated.Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}
      </Animated.View>
         <Modal
        visible={showWebView}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowWebView(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.webviewContainer}>
            <WebView
              source={{ html: '<html><head><title>Hello World</title><style>body { font-family: Arial, sans-serif; font-size: 24px; text-align: center; margin: 50px; }</style></head><body><h1>Hello World</h1><p>This is a placeholder for the project content.</p></body></html>' }}
              style={styles.webview}
              scalesPageToFit={true}
              startInLoadingState={false}
              javaScriptEnabled={true}
              domStorageEnabled={true}
            />
            <Pressable style={styles.closeWebViewButton} onPress={() => setShowWebView(false)}>
              <Text style={styles.closeWebViewText}>X</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      
    </Modal>
    
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardItem: {
    alignItems: 'center',
    marginHorizontal: gameScale(5),
  },
  rewardImage: {
    width: gameScale(39),
    height: gameScale(39),
    borderRadius: gameScale(4),
    marginBottom: gameScale(5),
  },
  rewardText: {
    fontSize: gameScale(16),
    color: '#FFD700',
    fontFamily: 'DynaPuff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: gameScale(1), height: gameScale(1) },
    textShadowRadius: gameScale(2),
  },
  loadingContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: gameScale(25),
    borderRadius: gameScale(15),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: gameScale(10) },
    shadowOpacity: 0.3,
    shadowRadius: gameScale(20),
    elevation: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: gameScale(18),
    fontFamily: 'DynaPuff',
  },
  errorContainer: {
    backgroundColor: 'rgba(220, 38, 38, 0.95)',
    padding: gameScale(25),
    borderRadius: gameScale(15),
    alignItems: 'center',
    maxWidth: gameScale(312),
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: gameScale(10) },
    shadowOpacity: 0.3,
    shadowRadius: gameScale(20),
    elevation: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: gameScale(16),
    textAlign: 'center',
    marginBottom: gameScale(15),
    fontFamily: 'DynaPuff',
  },
  retryButton: {
    backgroundColor: '#fff',
    paddingHorizontal: gameScale(25),
    paddingVertical: gameScale(12),
    borderRadius: gameScale(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: gameScale(2) },
    shadowOpacity: 0.2,
    shadowRadius: gameScale(4),
    elevation: 4,
  },
  retryText: {
    color: '#dc2626',
    fontSize: gameScale(16),
    fontWeight: 'bold',
  },
  robotHead: {
    alignSelf: 'center',
    marginTop: gameScale(-169),
    width: gameScale(332),
    position: 'relative',
  },
  enemyAvatarContainer: {
    alignItems: 'center',
    zIndex: 10,
  },
  enemyFoundContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: gameScale(47),
  },
  curvedEnemyFoundContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  curvedEnemyFoundCharacter: {
    fontSize: gameScale(12),
    color: '#ff6b6b',
    fontFamily: 'DoongaSlash',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: gameScale(1), height: gameScale(1) },
    textShadowRadius: gameScale(3),
    marginHorizontal: gameScale(2),
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  enemyNameContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: gameScale(66),
  },
  curvedTextContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  curvedCharacter: {
    fontSize: gameScale(31),
    color: '#ffffffff',
    fontFamily: 'MusicVibes',
    textAlign: 'center',
    textShadowColor: 'rgba(4, 4, 4, 0.9)',
    textShadowOffset: { width: gameScale(1), height: gameScale(1) },
    textShadowRadius: gameScale(2),
    marginHorizontal: gameScale(0.7),
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  avatarFrame: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  enemyAvatar: {
    width: gameScale(109),
    height: gameScale(109),
    borderRadius: gameScale(59),
    borderWidth: gameScale(4),
    borderColor: 'rgba(0, 0, 0, 1)',
    shadowColor: 'rgba(239, 68, 68, 1)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: gameScale(20),
    elevation: 20,
  },
  enemyAvatarGlow: {
    position: 'absolute',
    top: gameScale(-8),
    left: gameScale(-8),
    width: gameScale(127),
    height: gameScale(127),
    borderRadius: gameScale(67),
    backgroundColor: 'rgba(52, 2, 2, 1)',
    borderColor: 'rgba(104, 0, 5, 1)',
    borderWidth: gameScale(12),
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: gameScale(25),
    zIndex: -1,
  },
  outerBorder: {
    backgroundColor: 'rgba(33, 81, 152, 1)',
    borderRadius: gameScale(47),
    padding: gameScale(4),
    shadowColor: '#ffffffff',
    shadowOffset: {
      width: 0,
      height: gameScale(15),
    },
    shadowOpacity: 0.6,
    shadowRadius: gameScale(20),
    elevation: 25,
    borderTopWidth: gameScale(3),
    borderTopColor: '#ffffffff',
    borderLeftWidth: gameScale(2),
    borderLeftColor: '#ffffffff',
    borderBottomWidth: gameScale(4),
    borderBottomColor: '#ffffffff',
    borderRightWidth: gameScale(3),
    borderRightColor: '#ffffffff',
  },
  antenna: {
    position: 'absolute',
    alignSelf: 'center',
    top: gameScale(-137),
    zIndex: 5,
    width: gameScale(195),
    height: gameScale(195),
  },
  visor: {
    backgroundColor: '#def8ffff',
    padding: gameScale(4),
    marginBottom: gameScale(-140),
    borderTopLeftRadius: gameScale(59),
    borderTopRightRadius: gameScale(47),
    borderBottomLeftRadius: gameScale(23),
    borderBottomRightRadius: gameScale(23),
    borderTopWidth: gameScale(2),
    borderTopColor: '#002c38ff',
    borderLeftWidth: gameScale(1),
    borderLeftColor: '#002c38ff',
    borderBottomWidth: gameScale(3),
    borderBottomColor: '#002c38ff',
    borderRightWidth: gameScale(2),
    borderRightColor: '#002c38ff',
    shadowColor: '#002c38ff',
    shadowOffset: {
      width: 0,
      height: gameScale(5),
    },
    shadowOpacity: 0.3,
    shadowRadius: gameScale(8),
    elevation: 10,
  },
  visorGlass: {
    minHeight: gameScale(338),
    position: 'relative',
    overflow: 'hidden',
    borderTopLeftRadius: gameScale(59),
    borderTopRightRadius: gameScale(43),
    borderBottomLeftRadius: gameScale(21),
    borderBottomRightRadius: gameScale(21),
    borderWidth: gameScale(2),
    borderTopColor: 'rgba(0, 255, 255, 0.4)',
    borderLeftColor: 'rgba(30, 144, 255, 0.5)',
    borderBottomColor: 'rgba(65, 105, 225, 0.6)',
    borderRightColor: 'rgba(100, 149, 237, 0.5)',
  },
  techGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: gameScale(1),
    backgroundColor: 'rgba(40, 255, 255, 1)',
    shadowColor: 'rgba(0, 255, 255, 1)',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 1,
    shadowRadius: gameScale(15),
    zIndex: 99,
  },
  backgroundImage: {
    borderTopLeftRadius: gameScale(59),
    borderTopRightRadius: gameScale(43),
    borderBottomLeftRadius: gameScale(21),
    borderBottomRightRadius: gameScale(21),
  },
  modalContent: {
    alignItems: 'center',
    zIndex: 3,
  },
  textContainer: {
    backgroundColor: 'rgba(63, 118, 220, 0.9)',
    width: gameScale(273),
    borderBottomLeftRadius: gameScale(390),
    borderBottomRightRadius: gameScale(390),
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    borderWidth: gameScale(2),
    borderColor: 'rgba(255, 255, 255, 1)',
    shadowColor: 'rgba(255, 255, 255, 0.8)',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 1,
    shadowRadius: gameScale(8),
    elevation: 10,
  },
  levelTitle: {
    fontSize: gameScale(54),
    color: '#ffffff',
    fontFamily: 'MusicVibes',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 1)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: gameScale(15),
  },
  levelInfo: {
    alignItems: 'center',
    width: '100%',
  },
  levelType: {
    fontSize: gameScale(18),
    color: '#ffffff',
    fontFamily: 'FunkySign',
    textAlign: 'center',
    textShadowColor: 'rgba(30, 144, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: gameScale(5),
  },
  energyCost: {
    fontSize: gameScale(12),
    color: '#e0e0e0',
    fontFamily: 'DynaPuff',
    textAlign: 'center',
    marginTop: gameScale(2),
    textShadowColor: 'rgba(5, 150, 105, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: gameScale(3),
  },
  contentText: {
    fontSize: gameScale(11),
    color: '#ffffffff',
    textAlign: 'center',
    fontFamily: 'DynaPuff',
    textShadowColor: 'rgba(135, 206, 250, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: gameScale(3),
  },
  contentContainer: {
    padding: gameScale(10),
    width: '100%',
    marginBottom: gameScale(7),
    backgroundColor: 'rgba(12, 73, 139, 0.6)',
    borderTopWidth: gameScale(2),
    borderBottomWidth: gameScale(2),
    borderColor: 'rgba(255, 255, 255, 1)',
  },
  rewardContainer: {
    alignItems: 'center',
    marginBottom: gameScale(10),
    width: '100%',
  },
  rewardSection: {
    alignItems: 'center',
    flex: 1,
  },
  rewardLabel: {
    fontSize: gameScale(16),
    color: '#ffffff',
    fontWeight: '600',
    fontFamily: 'DynaPuff',
    textShadowColor: 'rgba(0, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: gameScale(5),
  },
  rewardFrames: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: gameScale(5),
  },
  rewardFrame: {
    borderRadius: gameScale(1),
    shadowOpacity: 1,
    shadowRadius: gameScale(5),
    minWidth: gameScale(47),
  },
  rewardBox: {
    borderRadius: gameScale(4),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: gameScale(59),
  },
  sectionLabel: {
    fontSize: gameScale(14),
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: gameScale(5),
    fontFamily: 'DynaPuff',
    textShadowColor: 'rgba(0, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: gameScale(5),
    textAlign: 'center',
  },
  rewardSubFrames: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  rewardIconContainer: {
    borderWidth: gameScale(2),
    backgroundColor: 'rgba(248, 248, 248, 0.4)',
    width: '100%',
    height: gameScale(59),
    borderRadius: gameScale(3),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: 'rgba(0, 255, 255, 0.8)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: gameScale(3),
  },
  heroLabel: {
    fontSize: gameScale(8),
    color: '#fff7f7ff',
    fontWeight: 'bold',
    position: 'absolute',
    top: gameScale(2),
    textAlign: 'center',
  },
  heroAvatar: {
    width: gameScale(39),
    height: gameScale(78),
    borderRadius: gameScale(16),
    position: 'absolute',
  },
  energyLabel: {
    fontSize: gameScale(8),
    color: '#fff7f7ff',
    fontWeight: 'bold',
    position: 'absolute',
    top: gameScale(2),
    textAlign: 'center',
  },
  energyIcon: {
    fontSize: gameScale(16),
    textAlign: 'center',
    position: 'absolute',
    top: gameScale(10),
  },
  rewardIcon: {
    fontSize: gameScale(23),
    textAlign: 'center',
    position: 'absolute',
    top: gameScale(4),
  },
  rewardPointsInside: {
    fontSize: gameScale(11),
    color: '#FFD700',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    textAlign: 'center',
    position: 'absolute',
    bottom: gameScale(4),
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: gameScale(1), height: gameScale(1) },
    textShadowRadius: gameScale(2),
  },
  statusContainer: {
    width: '100%',
    alignItems: 'center',
  },
  statusIndicator: {
    paddingHorizontal: gameScale(20),
    paddingVertical: gameScale(8),
    borderWidth: gameScale(1),
    borderRadius: gameScale(8),
    borderColor: 'rgba(0, 255, 255, 0.5)',
    backgroundColor: '#34c759',
    shadowColor: 'rgba(0, 255, 255, 0.8)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: gameScale(5),
  },
  statusText: {
    color: '#fff',
    fontSize: gameScale(16),
    fontFamily: 'FunkySign',
    textShadowColor: 'rgba(0, 255, 255, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: gameScale(3),
  },
  closeButton: {
    position: 'absolute',
    top: gameScale(17),
    right: gameScale(8),
    width: gameScale(38),
    height: gameScale(38),
    borderRadius: gameScale(19),
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#dc2626',
    shadowOffset: {
      width: 0,
      height: gameScale(8),
    },
    shadowOpacity: 0.5,
    shadowRadius: gameScale(12),
    elevation: 15,
    borderTopWidth: gameScale(3),
    borderTopColor: '#fca5a5',
    borderLeftWidth: gameScale(2),
    borderLeftColor: '#f87171',
    borderBottomWidth: gameScale(4),
    borderBottomColor: '#b91c1c',
    borderRightWidth: gameScale(3),
    borderRightColor: '#dc2626',
  },
  closeButtonPressed: {
    transform: [{ translateY: 2 }, { scale: 0.95 }],
    borderTopWidth: gameScale(1),
    borderLeftWidth: gameScale(1),
    borderBottomWidth: gameScale(2),
    borderRightWidth: gameScale(2),
    shadowOpacity: 0.2,
    shadowRadius: gameScale(6),
    elevation: 8,
  },
  closeButtonText: {
    fontSize: gameScale(28),
    color: '#fff',
    fontWeight: 'bold',
    lineHeight: gameScale(28),
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: gameScale(1), height: gameScale(1) },
    textShadowRadius: gameScale(2),
  },
  playButtonContainer: {
    position: 'absolute',
    bottom: gameScale(90),
    alignItems: 'center',
  },
  playButtonContainerBoss: {
    bottom: gameScale(40),
  },
  playButtonOuter: {
    backgroundColor: '#d0d0d0ff',
    padding: gameScale(4),
    borderRadius: gameScale(31),
    shadowColor: '#1e40af',
    shadowOffset: {
      width: 0,
      height: gameScale(12),
    },
    shadowOpacity: 0.6,
    shadowRadius: gameScale(20),
    elevation: 25,
    borderTopWidth: gameScale(3),
    borderTopColor: '#01142bff',
    borderLeftWidth: gameScale(2),
    borderLeftColor: '#088486ff',
    borderBottomWidth: gameScale(4),
    borderBottomColor: '#01142bff',
    borderRightWidth: gameScale(3),
    borderRightColor: '#088486ff',
  },
  playButtonMiddle: {
    padding: gameScale(4),
    borderRadius: gameScale(29),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: gameScale(137),
    minHeight: gameScale(59),
    borderTopWidth: gameScale(2),
    borderTopColor: '#f1f1f1a6',
    borderLeftWidth: gameScale(1),
    borderLeftColor: '#22c5baaf',
    borderBottomWidth: gameScale(3),
    borderBottomColor: '#f1f1f1a6',
    borderRightWidth: gameScale(2),
    borderRightColor: '#22c5baaf',
  },
  playButtonText: {
    fontSize: gameScale(39),
    color: '#ffffffe0',
    fontFamily: 'FunkySign',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: gameScale(1), height: gameScale(1) },
    textShadowRadius: gameScale(3),
  },
  playButtonPressed: {
    shadowOpacity: 0.3,
    shadowRadius: gameScale(10),
    elevation: 15,
  },
  showProjectButton: {
    backgroundColor: '#017252ff',
    paddingHorizontal: gameScale(5),
    paddingVertical: gameScale(5),
    borderRadius: gameScale(10),
    borderWidth: gameScale(2),
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: gameScale(4) },
    shadowOpacity: 0.3,
    shadowRadius: gameScale(6),
    elevation: 8,
    borderTopWidth: gameScale(3),
    borderTopColor: '#01142bff',
    borderLeftWidth: gameScale(2),
    borderLeftColor: '#088486ff',
    borderBottomWidth: gameScale(4),
    borderBottomColor: '#01142bff',
    borderRightWidth: gameScale(3),
    borderRightColor: '#088486ff',
    marginBottom: gameScale(10),
  },
  showProjectText: {
    color: '#fff',
    fontSize: gameScale(12),
    fontFamily: 'MusicVibes',
    textAlign: 'center',
  },
  webviewContainer: {
    width: gameScale(351),
    height: gameScale(591),
    backgroundColor: '#fff',
    borderRadius: gameScale(8),
    borderWidth: gameScale(1),
    borderColor: '#e9ecef',
    overflow: 'hidden',
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: '#fff',
  },
  closeWebViewButton: {
    position: 'absolute',
    top: gameScale(2),
    right: gameScale(2),
    backgroundColor: '#ef4444',
    paddingHorizontal: gameScale(15),
    paddingVertical: gameScale(10),
    borderRadius: gameScale(100),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: gameScale(2) },
    shadowOpacity: 0.3,
    shadowRadius: gameScale(4),
    elevation: 5,
  },
  closeWebViewText: {
    color: '#fff',
    fontSize: gameScale(12),
    fontFamily: 'DynaPuff',
    fontWeight: 'bold',
  },
});

export default LevelModal;