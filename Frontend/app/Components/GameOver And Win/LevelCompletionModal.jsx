import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions,
  ImageBackground,
  Pressable
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  scale, 
  scaleWidth, 
  scaleHeight, 
  RESPONSIVE 
} from '../Responsiveness/gameResponsive';
import { Image } from 'expo-image';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const LevelCompletionModal = ({
  visible = false,
  onRetry = null,
  onHome = null,
  onNextLevel = null,
  completionRewards = null,
  nextLevel = null,
  isLoading = false
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const backgroundOpacityAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  // ✅ Changed to drop animations for buttons
  const retryButtonDrop = useRef(new Animated.Value(-SCREEN_HEIGHT)).current;
  const homeButtonDrop = useRef(new Animated.Value(-SCREEN_HEIGHT)).current;

  console.log('🏆 LevelCompletionModal render:', {
    visible,
    completionRewards,
    nextLevel,
    isLoading
  });

  // ✅ Fixed useEffect to prevent scheduling updates during render
  useEffect(() => {
    let animationTimeout;
    
    if (visible) {
      animationTimeout = setTimeout(() => {
        startEntranceAnimation();
        startContinuousAnimations();
      }, 0);
    } else {
      resetAnimations();
    }

    return () => {
      if (animationTimeout) {
        clearTimeout(animationTimeout);
      }
    };
  }, [visible]);

  // ✅ Smooth continuous animations
  const startContinuousAnimations = () => {
    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin), // ✅ Fixed easing function
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin), // ✅ Fixed easing function
          useNativeDriver: true,
        })
      ])
    ).start();

    // Scan line animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ])
    ).start();
  };

  // ✅ Much smoother entrance animation
  const startEntranceAnimation = () => {
    setIsAnimating(true);
    
    // Reset all values for smooth entrance
    scaleAnim.setValue(0.3);
    rotateAnim.setValue(0);
    opacityAnim.setValue(0);
    slideAnim.setValue(-200);
    backgroundOpacityAnim.setValue(0);
    bounceAnim.setValue(0);
    // ✅ Reset button drops
    retryButtonDrop.setValue(-SCREEN_HEIGHT);
    homeButtonDrop.setValue(-SCREEN_HEIGHT);

    // ✅ Staggered smooth entrance
    Animated.parallel([
      // Background fade in
      Animated.timing(backgroundOpacityAnim, {
        toValue: 1,
        duration: 400,
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
            duration: 600,
            easing: Easing.out(Easing.back(1.2)),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 500,
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
      
      // Subtle bounce effect
      Animated.sequence([
        Animated.delay(600),
        Animated.spring(bounceAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        })
      ]),

      // ✅ Button dropping animations with stagger and bounce
      Animated.sequence([
        Animated.delay(800),
        Animated.parallel([
          Animated.spring(retryButtonDrop, {
            toValue: 0,
            tension: 80,
            friction: 10,
            useNativeDriver: true,
          }),
          Animated.delay(300), // Stagger home button
          Animated.spring(homeButtonDrop, {
            toValue: 0,
            tension: 80,
            friction: 10,
            useNativeDriver: true,
          })
        ])
      ])
    ]).start(() => {
      setIsAnimating(false);
    });
  };

  const resetAnimations = () => {
    scaleAnim.setValue(0.3);
    rotateAnim.setValue(0);
    opacityAnim.setValue(0);
    slideAnim.setValue(-200);
    backgroundOpacityAnim.setValue(0);
    bounceAnim.setValue(0);
    glowAnim.setValue(0);
    scanLineAnim.setValue(0);
    // ✅ Reset button drops
    retryButtonDrop.setValue(-SCREEN_HEIGHT);
    homeButtonDrop.setValue(-SCREEN_HEIGHT);
    setIsAnimating(false);
  };

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
    outputRange: [-50, SCREEN_HEIGHT * 0.5 + 50],
  });

  if (!visible) return null;


  return (
      <Animated.View 
        style={[
          styles.modalOverlay,
          {
            opacity: backgroundOpacityAnim,
          }
        ]}
      >
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
                source={{ uri: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1760514286/Gemini_Generated_Image_1s6yfm1s6yfm1s6y_sdwbzk.png' }}
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
                      <Text style={styles.gameOverTitle}>VICTORY!</Text>
                    </Animated.View>

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
                      {/* ✅ Removed defeat message */}
                      
                      <Text style={styles.feedbackMessage}>
                        {completionRewards?.feedbackMessage || 'Congratulations! You have completed this level!'}
                      </Text>
                      
                      {/* ✅ Added rewards section */}
                      {completionRewards ? (
                        <View style={styles.rewardFrames}>
                          <View style={styles.rewardSection}>
                            <Text style={styles.sectionLabel}>Rewards Earned</Text>
                            <View style={styles.rewardSubFrames}>
                              {(completionRewards.coinsEarned > 0 || completionRewards.currentTotalPoints > 0) && (
                                <View style={styles.rewardItem}>
                                  <Image 
                                    source={{uri: 'https://github.com/user-attachments/assets/4e1d0813-aa7d-4dcf-8333-a1ff2cd0971e'}} 
                                    style={styles.rewardImage}
                                    resizeMode="cover"
                                  />
                                  <Text style={styles.rewardText}>
                                    {completionRewards.coinsEarned || completionRewards.currentTotalPoints}
                                  </Text>
                                </View>
                              )}
                              {completionRewards.currentExpPoints > 0 && (
                                <View style={styles.rewardItem}>
                                  <Text style={styles.rewardIcon}>⭐</Text>
                                  <Text style={styles.rewardText}>{completionRewards.currentExpPoints}</Text>
                                </View>
                              )}
                              {!completionRewards.coinsEarned && 
                              !completionRewards.currentTotalPoints && 
                              !completionRewards.currentExpPoints && (
                                <View style={styles.rewardItem}>
                                  <Text style={styles.rewardIcon}>🎓</Text>
                                  <Text style={styles.rewardText}>Practice Complete</Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.rewardFrames}>
                          <View style={styles.rewardSection}>
                            <Text style={styles.sectionLabel}>Level Completed!</Text>
                            <View style={styles.rewardItem}>
                              <Text style={styles.rewardIcon}>🎉</Text>
                              <Text style={styles.rewardText}>Great job!</Text>
                            </View>
                          </View>
                        </View>
                      )}
                    </Animated.View>

                   
                  </View>
                  
                </LinearGradient>
                 {isLoading ? (
                      <Animated.View 
                        style={[
                          styles.loadingContainer,
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
                        <ActivityIndicator size="large" color="#ffffff" />
                        <Text style={styles.loadingText}>Loading next level...</Text>
                      </Animated.View>
                    ) : (
                      <Animated.View 
                        style={[
                          styles.buttonContainer,
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
                        {nextLevel ? (
                          <Pressable 
                            style={({ pressed }) => [
                              styles.retryButton,
                              pressed && styles.buttonPressed,
                              {
                                transform: pressed ? [{ scale: 0.95 }] : [{ scale: 1 }]
                              }
                            ]}
                            onPress={onNextLevel}
                            disabled={isAnimating}
                          >
                            <Animated.Image
                              source={{ uri: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1760514009/Untitled_design_15_tdknw8.png' }}
                              style={[
                                styles.buttonImage,
                                {
                                  transform: [{ translateY: retryButtonDrop }]
                                }
                              ]}
                              resizeMode="contain"
                            />
                          </Pressable>
                        ) : (
                          <Pressable 
                            style={[styles.retryButton, styles.disabledButton]}
                            disabled={true}
                          >
                            <LinearGradient
                              colors={[
                                'rgba(102, 102, 102, 0.8)',
                                'rgba(68, 68, 68, 0.9)'
                              ]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={styles.buttonGradient}
                            >
                              <Text style={styles.buttonText}>NO MORE LEVELS</Text>
                            </LinearGradient>
                          </Pressable>
                        )}
                        
                        <Pressable 
                          style={({ pressed }) => [
                            styles.retryButton,
                            pressed && styles.buttonPressed,
                            {
                              transform: pressed ? [{ scale: 0.95 }] : [{ scale: 1 }]
                            }
                          ]}
                          onPress={onRetry}
                          disabled={isAnimating}
                        >
                          <Animated.Image
                            source={{ uri: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1760510778/Untitled_design_13_ginrqf.png' }}
                            style={[
                              styles.buttonImage,
                              {
                                transform: [{ translateY: retryButtonDrop }]
                              }
                            ]}
                            resizeMode="contain"
                          />
                        </Pressable>
                        
                        <Pressable 
                          style={({ pressed }) => [
                            styles.homeButton,
                            pressed && styles.buttonPressed,
                            {
                              transform: pressed ? [{ scale: 0.95 }] : [{ scale: 1 }]
                            }
                          ]}
                          onPress={onHome}
                          disabled={isAnimating}
                        >
                          <Animated.Image
                            source={{ uri: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1760510848/Untitled_design_14_rzz5wx.png' }}
                            style={[
                              styles.buttonImage,
                              {
                                transform: [{ translateY: homeButtonDrop }]
                              }
                            ]}
                            resizeMode="contain"
                          />
                        </Pressable>
                      </Animated.View>
                    )}
              </ImageBackground>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)', 
    zIndex: 99999,
    elevation: 99999,
  },

  robotHead: {
    alignSelf: 'center',
    marginTop: SCREEN_HEIGHT * -0.2,
    width: SCREEN_WIDTH * 0.85,
    position: 'relative',
  },

  outerBorder: {
    backgroundColor: 'rgba(4, 40, 5, 1)',
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
    backgroundColor: '#000000ff',
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
    minHeight: SCREEN_HEIGHT * 0.5,
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


  backgroundImage: {
    borderTopLeftRadius: SCREEN_WIDTH * 0.15,
    borderTopRightRadius: SCREEN_WIDTH * 0.11,
    borderBottomLeftRadius: SCREEN_WIDTH * 0.055,
    borderBottomRightRadius: SCREEN_WIDTH * 0.055,
    opacity: 0.6,
  },

  modalContent: {
    alignItems: 'center',
    zIndex: 3,
  },

  textContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)', // ✅ Changed to green for victory
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

  gameOverTitle: {
    fontSize: SCREEN_WIDTH * 0.12,
    color: '#ffffff',
    fontFamily: 'MusicVibes',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 1)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },

  contentContainer: {
    marginTop: SCREEN_HEIGHT * 0.09,
    padding: 15,
    backgroundColor: 'rgba(9, 41, 75, 0.6)',
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: 'rgba(255, 255, 255, 1)',
  },

  defeatMessage: {
    fontSize: SCREEN_WIDTH * 0.080,
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: 'MusicVibes',
    textShadowColor: 'rgba(135, 206, 250, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },

  feedbackMessage: {
    fontSize: SCREEN_WIDTH * 0.03,
    color: '#E0E0E0',
    textAlign: 'center',
    fontFamily: 'DynaPuff',
    textShadowColor: 'rgba(135, 206, 250, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },

  rewardFrames: {
    flexDirection: 'row',
    width: '50%',
    marginTop: 10,
    alignSelf: 'center',
  },

  rewardSection: {
    alignItems: 'center',
    flex: 1,
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

  rewardItem: {
    alignItems: 'center',
    marginHorizontal: 5,
  },

  rewardImage: {
    width: SCREEN_WIDTH * 0.08,
    height: SCREEN_WIDTH * 0.08,
    borderRadius: SCREEN_WIDTH * 0.01,
    marginBottom: 5,
  },

  rewardIcon: {
    fontSize: SCREEN_WIDTH * 0.08,
    textAlign: 'center',
    marginBottom: 5,
  },

  rewardText: {
    fontSize: SCREEN_WIDTH * 0.035,
    color: '#FFD700',
    fontFamily: 'DynaPuff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  buttonContainer: {
    flexDirection: 'row',
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    bottom: SCREEN_WIDTH * -0.15,
    width: '100%',
    zIndex: 4,
  },

  retryButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },


  homeButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },



  buttonGradient: {
    padding: 4,
    borderRadius: SCREEN_WIDTH * 0.045,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: SCREEN_WIDTH * 0.5,
    minHeight: SCREEN_WIDTH * 0.12,
    borderTopWidth: 2,
    borderTopColor: '#f1f1f1a6',
    borderLeftWidth: 1,
    borderLeftColor: '#22c5baaf',
    borderBottomWidth: 3,
    borderBottomColor: '#f1f1f1a6',
    borderRightWidth: 2,
    borderRightColor: '#22c5baaf',
  },

  buttonText: {
    fontSize: SCREEN_WIDTH * 0.08,
    color: '#ffffffe0',
    fontFamily: 'FunkySign',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    fontWeight: 'bold',
  },

   buttonImage: {
    width: SCREEN_WIDTH * 0.3,
    height: SCREEN_WIDTH * 0.3,
  },


  loadingContainer: {
    alignItems: 'center',
    paddingVertical: RESPONSIVE.margin.xl,
    backgroundColor: 'rgba(12, 73, 139, 0.6)',
    borderRadius: SCREEN_WIDTH * 0.03,
    padding: 20,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: 'rgba(255, 255, 255, 1)',
  },

  loadingText: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontFamily: 'DynaPuff',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: RESPONSIVE.margin.md,
    textShadowColor: 'rgba(135, 206, 250, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
});

export default LevelCompletionModal;