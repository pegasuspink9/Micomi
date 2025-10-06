import { ImageBackground } from 'expo-image';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, Modal, Pressable, StyleSheet, Dimensions, Image, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { levelService } from '../../../services/levelService';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

  // ✅ Smooth continuous animations
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
    
    console.log('🎮 Play button pressed, navigating to GamePlay:', {
      playerId,
      levelId,
      levelData: displayData
    });

    handleModalClose();

    setTimeout(() => {
      try {
        router.push({
          pathname: '/GamePlay', 
          params: {
            playerId: playerId,
            levelId: levelId,
            levelData: JSON.stringify(displayData || {})
          }
        });
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

  // ✅ Much smoother entrance animation
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

    // ✅ Staggered smooth entrance
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

  // ✅ Smooth exit animation
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
      
      const response = await levelService.getLevelPreview(levelId);
      console.log('📊 Level preview response:', response);
      
      if (response.success) {
        setPreviewData(response.data);
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

  const displayData = previewData || levelData;
  
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

  // ✅ Smooth interpolations
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
    outputRange: [-50, SCREEN_HEIGHT * 0.4 + 50],
  });

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
              {/* ✅ Animated antenna with glow */}
              <Animated.Image 
                source={{uri: 'https://github.com/user-attachments/assets/4743543a-b50b-4a55-bb59-8e0c53c08919'}}  
                style={[
                  styles.antenna,
                  {
                    opacity: glowInterpolate,
                    transform: [
                      { rotate: rotateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['-5deg', '0deg']
                      })}
                    ]
                  }
                ]}
              />
              
              <View style={styles.visor}>
                <ImageBackground
                  source={{ uri: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1759220459/363a62c7-6a6a-456a-a3b5-c1ffb987aef1_fnpugf.png' }}
                  imageStyle={styles.backgroundImage} 
                  resizeMode="cover"
                >
                  <LinearGradient
                    colors={[
                      'rgba(219, 222, 225, 1)',
                      'rgba(130, 148, 175, 0.15)',
                      'rgba(130, 148, 175, 0.15)',
                      'rgba(222, 222, 222, 0.13)',
                      'rgba(219, 222, 225, 0.15)',
                      'rgba(130, 148, 175, 0.15)',
                      'rgba(219, 222, 225, 1)',
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.visorGlass}
                  >
                    <View style={styles.techGrid} />

                    {/* ✅ Animated scan line */}
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
                        <Text style={styles.levelTitle}>Level: {mappedLevelData.level_number}</Text>
                      </Animated.View>

                      {mappedLevelData.enemy_avatar && (
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
                            <Animated.Image 
                              source={{ uri: mappedLevelData.enemy_avatar }}
                              style={[
                                styles.enemyAvatar,
                                {
                                  opacity: glowInterpolate,
                                }
                              ]}
                              resizeMode="cover"
                            />
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
                                const radiusOffset = Math.abs(distanceFromCenter) * 8;
                                
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
                        <Text style={styles.contentText}>{mappedLevelData.content}</Text>
                      </Animated.View>

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
            
            {/* ✅ Smooth close button */}
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
            </Animated.View>
          </Animated.View>
        )}

        {displayData && !loading && !error && (
          <Animated.View 
            style={[
              styles.playButtonContainer,
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
                  PLAY
                </Animated.Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}
      </Animated.View>
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
    marginHorizontal: 5,
  },

  rewardImage: {
    width: SCREEN_WIDTH * 0.1,
    height: SCREEN_WIDTH * 0.1,
    borderRadius: SCREEN_WIDTH * 0.01,
    marginBottom: 5,
  },

  rewardText: {
    fontSize: SCREEN_WIDTH * 0.04,
    color: '#FFD700',
    fontFamily: 'DynaPuff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  loadingContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)', // ✅ Darker for better visibility
    padding: 25, // ✅ More padding
    borderRadius: 15, // ✅ More rounded
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },

  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'DynaPuff',
  },

  errorContainer: {
    backgroundColor: 'rgba(220, 38, 38, 0.95)', // ✅ Slightly more opaque
    padding: 25, // ✅ More padding
    borderRadius: 15, // ✅ More rounded
    alignItems: 'center',
    maxWidth: SCREEN_WIDTH * 0.8,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },

  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'DynaPuff',
  },

  retryButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 25, // ✅ More padding
    paddingVertical: 12, // ✅ More padding
    borderRadius: 8, // ✅ More rounded
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  retryText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: 'bold',
  },

  robotHead: {
    alignSelf: 'center',
    marginTop: SCREEN_HEIGHT * -0.2,
    width: SCREEN_WIDTH * 0.85,
    position: 'relative',
  },

  enemyAvatarContainer: {
    alignItems: 'center',
    zIndex: 10,
  },

  enemyFoundContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: SCREEN_WIDTH * 0.12,
  },

  curvedEnemyFoundContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },

  curvedEnemyFoundCharacter: {
    fontSize: SCREEN_WIDTH * 0.03,
    color: '#ff6b6b',
    fontFamily: 'DoongaSlash',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginHorizontal: 2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  enemyNameContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: SCREEN_WIDTH * 0.17,
  },

  curvedTextContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  curvedCharacter: {
    fontSize: SCREEN_WIDTH * 0.08,
    color: '#ffffffff',
    fontFamily: 'MusicVibes',
    textAlign: 'center',
    textShadowColor: 'rgba(4, 4, 4, 0.9)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginHorizontal: 0.70,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  avatarFrame: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },

  enemyAvatar: {
    width: SCREEN_WIDTH * 0.28,
    height: SCREEN_WIDTH * 0.28,
    borderRadius: SCREEN_WIDTH * 0.15,
    borderWidth: 4,
    borderColor: 'rgba(0, 0, 0, 1)',
    shadowColor: 'rgba(239, 68, 68, 1)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 20,
  },

  enemyAvatarGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: SCREEN_WIDTH * 0.3 + 10,
    height: SCREEN_WIDTH * 0.3 + 10,
    borderRadius: (SCREEN_WIDTH * 0.3 + 16) / 2,
    backgroundColor: 'rgba(52, 2, 2, 1)',
    borderColor: 'rgba(104, 0, 5, 1)', 
    borderWidth: 12,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 25,
    zIndex: -1,
  },

  outerBorder: {
    backgroundColor: 'rgba(33, 81, 152, 1)',
    borderRadius: SCREEN_WIDTH * 0.12,
    padding: 4,
    borderTopLeftRadius: SCREEN_WIDTH * 0.12,
    borderTopRightRadius: SCREEN_WIDTH * 0.12,
    borderBottomLeftRadius: SCREEN_WIDTH * 0.12,
    borderBottomRightRadius: SCREEN_WIDTH * 0.12,
    shadowColor: '#ffffffff',
    shadowOffset: {
      width: 0,
      height: 15,
    },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 25,
    borderTopWidth: 3,
    borderTopColor: '#ffffffff',
    borderLeftWidth: 2,
    borderLeftColor: '#ffffffff',
    borderBottomWidth: 4,
    borderBottomColor: '#ffffffff',
    borderRightWidth: 3,
    borderRightColor: '#ffffffff',
  },

  antenna: {
    position: 'absolute',
    alignSelf: 'center',
    top: SCREEN_WIDTH * -0.35,
    zIndex: 5,
    width: SCREEN_WIDTH * 0.5,
    height: SCREEN_WIDTH * 0.5,
  },

  visor: {
    backgroundColor: '#def8ffff',
    padding: 4,
    marginBottom: -140,
    borderTopLeftRadius: SCREEN_WIDTH * 0.15,
    borderTopRightRadius: SCREEN_WIDTH * 0.12,
    borderBottomLeftRadius: SCREEN_WIDTH * 0.06,
    borderBottomRightRadius: SCREEN_WIDTH * 0.06,
    borderTopWidth: 2,
    borderTopColor: '#002c38ff',
    borderLeftWidth: 1,
    borderLeftColor: '#002c38ff',
    borderBottomWidth: 3,
    borderBottomColor: '#002c38ff',
    borderRightWidth: 2,
    borderRightColor: '#002c38ff',
    shadowColor: '#002c38ff',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10
  },

  visorGlass: {
    minHeight: SCREEN_HEIGHT * 0.4,
    position: 'relative',
    overflow: 'hidden',
    borderTopLeftRadius: SCREEN_WIDTH * 0.15,
    borderTopRightRadius: SCREEN_WIDTH * 0.11,
    borderBottomLeftRadius: SCREEN_WIDTH * 0.055,
    borderBottomRightRadius: SCREEN_WIDTH * 0.055,
    borderWidth: 2,
    borderTopColor: 'rgba(0, 255, 255, 0.4)',
    borderLeftColor: 'rgba(30, 144, 255, 0.5)',
    borderBottomColor: 'rgba(65, 105, 225, 0.6)',
    borderRightColor: 'rgba(100, 149, 237, 0.5)',
    shadowColor: 'rgba(0, 255, 255, 0.8)',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 15,
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
    height: 5, 
    backgroundColor: 'rgba(40, 255, 255, 1)',
    shadowColor: 'rgba(0, 255, 255, 1)',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 1,
    shadowRadius: 15,
    zIndex: 99,
  },

  backgroundImage: {
    borderTopLeftRadius: SCREEN_WIDTH * 0.15,
    borderTopRightRadius: SCREEN_WIDTH * 0.11,
    borderBottomLeftRadius: SCREEN_WIDTH * 0.055,
    borderBottomRightRadius: SCREEN_WIDTH * 0.055,
  },

  modalContent: {
    alignItems: 'center',
    zIndex: 3,
  },

  textContainer: {
    backgroundColor: 'rgba(63, 118, 220, 0.9)', // ✅ Slightly more opaque
    width: SCREEN_WIDTH * 0.7,  
    borderBottomLeftRadius: SCREEN_WIDTH * 1, 
    borderBottomRightRadius: SCREEN_WIDTH * 1, 
    borderTopLeftRadius: 0,     
    borderTopRightRadius: 0,   
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center', 
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 1)',
    shadowColor: 'rgba(255, 255, 255, 0.8)',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 10,
  },

  levelTitle: {
    fontSize: SCREEN_WIDTH * 0.14,
    color: '#ffffff',
    fontFamily: 'MusicVibes',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 1)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },

  levelInfo: {
    alignItems: 'center',
    width: '100%',
  },

  levelType: {
    fontSize: SCREEN_WIDTH * 0.045,
    color: '#ffffff',
    fontFamily: 'FunkySign',
    textAlign: 'center',
    textShadowColor: 'rgba(30, 144, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },

  energyCost: {
    fontSize: SCREEN_WIDTH * 0.03,
    color: '#e0e0e0',
    fontFamily: 'DynaPuff',
    textAlign: 'center',
    marginTop: 2,
    textShadowColor: 'rgba(5, 150, 105, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },

  contentText: {
    fontSize: SCREEN_WIDTH * 0.029,
    color: '#ffffffff',
    textAlign: 'justify',
    fontFamily: 'DynaPuff',
    textShadowColor: 'rgba(135, 206, 250, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },

  contentContainer: {
    marginTop: -16,
    padding: 10,
    marginBottom: 7,
    backgroundColor: 'rgba(12, 73, 139, 0.6)', // ✅ Slightly more opaque
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: 'rgba(255, 255, 255, 1)',
  },

  rewardContainer: {
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },

  rewardSection: {
    alignItems: 'center',
    flex: 1,
  },

  rewardLabel: {
    fontSize: SCREEN_WIDTH * 0.04,
    color: '#ffffff',
    fontWeight: '600',
    fontFamily: 'DynaPuff',
    textShadowColor: 'rgba(0, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },

  rewardFrames: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 5,
  },

  rewardFrame: {
    borderRadius: 1,
    shadowOpacity: 1,
    shadowRadius: 5,
    minWidth: SCREEN_WIDTH * 0.12,
  },

  rewardBox: {
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: SCREEN_WIDTH * 0.15,
  },

  sectionLabel: {
    fontSize: SCREEN_WIDTH * 0.035,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 5,
    fontFamily: 'DynaPuff',
    textShadowColor: 'rgba(0, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
    textAlign: 'center',
  },
  
  rewardSubFrames: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },

  rewardIconContainer: {
    borderWidth: 2,
    backgroundColor: 'rgba(248, 248, 248, 0.4)', // ✅ Slightly more opaque
    width: '100%',
    height: SCREEN_WIDTH * 0.15,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: 'rgba(0, 255, 255, 0.8)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
  },

  heroLabel: {
    fontSize: SCREEN_WIDTH * 0.02,
    color: '#fff7f7ff',
    fontWeight: 'bold',
    position: 'absolute',
    top: SCREEN_WIDTH * 0.005,
    textAlign: 'center',
  },

  heroAvatar: {
    width: SCREEN_WIDTH * 0.1,
    height: SCREEN_WIDTH * 0.2,
    borderRadius: SCREEN_WIDTH * 0.04,
    position: 'absolute',
  },

  energyLabel: {
    fontSize: SCREEN_WIDTH * 0.02,
    color: '#fff7f7ff',
    fontWeight: 'bold',
    position: 'absolute',
    top: SCREEN_WIDTH * 0.005,
    textAlign: 'center',
  },

  energyIcon: {
    fontSize: SCREEN_WIDTH * 0.04,
    textAlign: 'center',
    position: 'absolute',
    top: SCREEN_WIDTH * 0.025,
  },

  rewardIcon: {
    fontSize: SCREEN_WIDTH * 0.06,
    textAlign: 'center',
    position: 'absolute',
    top: SCREEN_WIDTH * 0.01,
  },

  rewardPointsInside: {
    fontSize: SCREEN_WIDTH * 0.028,
    color: '#FFD700',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    textAlign: 'center',
    position: 'absolute',
    bottom: SCREEN_WIDTH * 0.01,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  statusContainer: {
    width: '100%',
    alignItems: 'center',
  },

  statusIndicator: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: 'rgba(0, 255, 255, 0.5)',
    backgroundColor: '#34c759',
    shadowColor: 'rgba(0, 255, 255, 0.8)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
  },

  statusText: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.04,
    fontFamily: 'FunkySign',
    textShadowColor: 'rgba(0, 255, 255, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },

  closeButton: {
    position: 'absolute',
    top: SCREEN_HEIGHT * -0.45,
    right: SCREEN_WIDTH * 0.02,
    width: 38, // ✅ Slightly larger
    height: 38, // ✅ Slightly larger
    borderRadius: 19,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#dc2626',
    shadowOffset: {
      width: 0,
      height: 8, // ✅ More shadow
    },
    shadowOpacity: 0.5, // ✅ More shadow opacity
    shadowRadius: 12, // ✅ Larger shadow radius
    elevation: 15, // ✅ Higher elevation
    borderTopWidth: 3,
    borderTopColor: '#fca5a5',
    borderLeftWidth: 2,
    borderLeftColor: '#f87171',
    borderBottomWidth: 4,
    borderBottomColor: '#b91c1c',
    borderRightWidth: 3,
    borderRightColor: '#dc2626',
  },

  closeButtonPressed: {
    transform: [{ translateY: 2 }, { scale: 0.95 }], // ✅ Add scale effect
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },

  closeButtonText: {
    fontSize: 28, // ✅ Slightly larger
    color: '#fff',
    fontWeight: 'bold',
    lineHeight: 28,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  playButtonContainer: {
    position: 'absolute',
    marginTop: SCREEN_HEIGHT * 0.75,
    alignItems: 'center',
  },

  playButtonOuter: {
    backgroundColor: '#d0d0d0ff',
    padding: 4,
    borderRadius: SCREEN_WIDTH * 0.08,
    shadowColor: '#1e40af',
    shadowOffset: {
      width: 0,
      height: 12, // ✅ More shadow
    },
    shadowOpacity: 0.6,
    shadowRadius: 20, // ✅ Larger shadow radius
    elevation: 25, // ✅ Higher elevation
    borderTopWidth: 3,
    borderTopColor: '#01142bff',
    borderLeftWidth: 2,
    borderLeftColor: '#088486ff',
    borderBottomWidth: 4,
    borderBottomColor: '#01142bff',
    borderRightWidth: 3,
    borderRightColor: '#088486ff',
  },

  playButtonMiddle: {
    padding: 4,
    borderRadius: SCREEN_WIDTH * 0.075,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: SCREEN_WIDTH * 0.35,
    minHeight: SCREEN_WIDTH * 0.15,
    borderTopWidth: 2,
    borderTopColor: '#f1f1f1a6',
    borderLeftWidth: 1,
    borderLeftColor: '#22c5baaf',
    borderBottomWidth: 3,
    borderBottomColor: '#f1f1f1a6',
    borderRightWidth: 2,
    borderRightColor: '#22c5baaf',
  },

  playButtonText: {
    fontSize: SCREEN_WIDTH * 0.1,
    color: '#ffffffe0',
    fontFamily: 'FunkySign',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },

  playButtonPressed: {
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 15,
  },
});

export default LevelModal;