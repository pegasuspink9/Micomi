import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  Modal, // <-- Added Modal import
} from 'react-native';
import { ImageBackground } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { gameScale, BASE_HEIGHT } from '../Responsiveness/gameResponsive';
import { soundManager } from '../Actual Game/Sounds/UniversalSoundManager';
import { useAuth } from '../../hooks/useAuth';

const SettingsModal = ({
  visible = false,
  onClose = () => {},
}) => {
  const { logout } = useAuth();
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());

  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(gameScale(-200))).current;
  const backgroundOpacityAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setIsMuted(soundManager.getMuted());
      startEntranceAnimation();
      startContinuousAnimations();
    } else {
      resetAnimations();
    }
  }, [visible]);

  const startContinuousAnimations = () => {
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
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.sequence([
      Animated.timing(scanLineAnim, {
        toValue: 2,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(scanLineAnim, {
        toValue: 0,
        duration: 100,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(scanLineAnim, {
        toValue: 2,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const startEntranceAnimation = () => {
    setIsAnimating(true);

    scaleAnim.setValue(0.3);
    rotateAnim.setValue(0);
    opacityAnim.setValue(0);
    slideAnim.setValue(gameScale(-200));
    backgroundOpacityAnim.setValue(0);

    Animated.parallel([
      Animated.timing(backgroundOpacityAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(100),
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 65,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 55,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.back(1.2)),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start(() => {
      setIsAnimating(false);
    });
  };

  const handleClose = (callback) => {
    if (isAnimating) return;

    setIsAnimating(true);
    soundManager.playButtonTapSound();

    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        easing: Easing.in(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: gameScale(-100),
        duration: 200,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(backgroundOpacityAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsAnimating(false);
      if (callback) callback();
    });
  };

  const resetAnimations = () => {
    scaleAnim.setValue(0.3);
    rotateAnim.setValue(0);
    opacityAnim.setValue(0);
    slideAnim.setValue(gameScale(-200));
    backgroundOpacityAnim.setValue(0);
    glowAnim.setValue(0);
    bounceAnim.setValue(0);
    scanLineAnim.setValue(0);
    setIsAnimating(false);
  };

  const handleSoundToggle = useCallback(() => {
    const nextMuted = !isMuted;
    soundManager.setMuted(nextMuted);
    setIsMuted(nextMuted);
  }, [isMuted]);

  const handleLogout = useCallback(() => {
    handleClose(async () => {
      try {
        await logout();
      } catch (error) {
        console.error('Logout error:', error);
      }
    });
  }, [logout]);

  const handleSocialLink = useCallback((platform) => {
    console.log(`Opening ${platform}`);
  }, []);

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
    outputRange: [gameScale(-50), gameScale(BASE_HEIGHT * 0.35 + 50)],
  });

  if (!visible) return null;

  return (
    // Wraps everything in a React Native Modal to ensure absolute full-screen centering
    <Modal
      transparent={true}
      visible={visible}
      animationType="none" // Handles its own internal animations
      onRequestClose={() => handleClose(onClose)} // Handles android back-button
    >
      <Animated.View
        style={[
          styles.fullScreenOverlay,
          { opacity: backgroundOpacityAnim },
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
            },
          ]}
        >
          <View style={styles.outerBorder}>
            <View style={styles.visor}>
              <ImageBackground
                source={{ uri: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1759901895/labBackground_otqad4.jpg' }}
                imageStyle={styles.backgroundImage}
                resizeMode="cover"
              >
                <LinearGradient
                  colors={[
                    'rgba(15, 55, 95, 1)',
                    'rgba(15, 55, 95, 0.15)',
                    'rgba(15, 55, 95, 0.15)',
                    'rgba(15, 55, 95, 0.13)',
                    'rgba(15, 55, 95, 0.15)',
                    'rgba(15, 55, 95, 0.15)',
                    'rgba(29, 76, 124, 1)',
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.visorGlass}
                >
                  <View style={styles.techGrid} />

                  <Animated.View
                    style={[
                      styles.scanLine,
                      { transform: [{ translateY: scanLineTranslate }] },
                    ]}
                  />

                  <View style={styles.modalContent}>
                    <Animated.View
                      style={[
                        styles.textContainer,
                        {
                          transform: [
                            {
                              scale: bounceAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [1, 1.02],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <Animated.View style={[styles.titleRow, { opacity: glowInterpolate }]}>
                        <Ionicons name="settings" size={gameScale(36)} color="#4dabf7" />
                        <Text style={styles.settingsTitle}>SETTINGS</Text>
                      </Animated.View>
                    </Animated.View>

                    <View style={styles.contentWrapper}>
                      <View style={styles.iconsRow}>
                        <Pressable
                          style={({ pressed }) => [
                            styles.circularIconButton,
                            !isMuted && styles.soundIconActive,
                            isMuted && styles.soundIconMuted,
                            pressed && styles.buttonPressed,
                          ]}
                          onPress={handleSoundToggle}
                          disabled={isAnimating}
                        >
                          <Ionicons
                            name={isMuted ? 'volume-mute' : 'volume-high'}
                            size={gameScale(28)}
                            color="#fff"
                          />
                        </Pressable>

                        <Pressable
                          style={({ pressed }) => [
                            styles.circularIconButton,
                            pressed && styles.buttonPressed,
                          ]}
                          onPress={() => handleSocialLink('support')}
                          disabled={isAnimating}
                        >
                          <MaterialCommunityIcons name="headset" size={gameScale(28)} color="#fff" />
                        </Pressable>
                      </View>

                      <Pressable
                        style={({ pressed }) => [
                          styles.logoutButton,
                          pressed && styles.buttonPressed,
                        ]}
                        onPress={handleLogout}
                        disabled={isAnimating}
                      >
                        <Ionicons name="log-out" size={gameScale(20)} color="#fff" />
                        <Text style={styles.logoutText}>Logout</Text>
                      </Pressable>

                      <View style={styles.supportSection}>
                        <Text style={styles.supportTitle}>Support Us</Text>

                        <View style={styles.socialIconsRow}>
                          <Pressable
                            style={({ pressed }) => [
                              styles.socialIconButton,
                              pressed && styles.buttonPressed,
                            ]}
                            onPress={() => handleSocialLink('youtube')}
                            disabled={isAnimating}
                          >
                            <MaterialCommunityIcons name="youtube" size={gameScale(32)} color="#FF0000" />
                          </Pressable>

                          <Pressable
                            style={({ pressed }) => [
                              styles.socialIconButton,
                              pressed && styles.buttonPressed,
                            ]}
                            onPress={() => handleSocialLink('facebook')}
                            disabled={isAnimating}
                          >
                            <FontAwesome name="facebook" size={gameScale(32)} color="#1877F2" />
                          </Pressable>

                          <Pressable
                            style={({ pressed }) => [
                              styles.socialIconButton,
                              pressed && styles.buttonPressed,
                            ]}
                            onPress={() => handleSocialLink('instagram')}
                            disabled={isAnimating}
                          >
                            <MaterialCommunityIcons name="instagram" size={gameScale(32)} color="#E1306C" />
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </ImageBackground>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.closeButtonPressed,
            ]}
            onPress={() => handleClose(onClose)}
            disabled={isAnimating}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullScreenOverlay: {
    ...StyleSheet.absoluteFillObject,

    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },

  robotHead: {
    marginTop: gameScale(-120),
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
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

  visor: {
    backgroundColor: '#def8ffff',
    padding: gameScale(4),
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
    minHeight: gameScale(300),
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
    paddingBottom: gameScale(20),
    paddingHorizontal: gameScale(15),
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
    paddingVertical: gameScale(10),
    paddingHorizontal: gameScale(15),
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gameScale(10),
  },

  settingsTitle: {
    fontSize: gameScale(42),
    color: '#ffffff',
    fontFamily: 'MusicVibes',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 1)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: gameScale(15),
  },

  contentWrapper: {
    zIndex: 10,
    paddingHorizontal: gameScale(15),
    paddingTop: gameScale(15),
    alignItems: 'center',
    width: '100%',
  },

  iconsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: gameScale(30),
    marginBottom: gameScale(15),
  },

  circularIconButton: {
    width: gameScale(70),
    height: gameScale(70),
    borderRadius: gameScale(35),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: gameScale(2),
    borderColor: 'rgba(74, 144, 217, 0.6)',
    backgroundColor: 'rgba(30, 144, 255, 0.2)',
    shadowColor: '#1e90ff',
    shadowOffset: { width: 0, height: gameScale(4) },
    shadowOpacity: 0.4,
    shadowRadius: gameScale(10),
    elevation: 8,
  },

  soundIconActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    borderColor: 'rgba(76, 175, 80, 0.8)',
    shadowColor: '#4caf50',
  },

  soundIconMuted: {
    backgroundColor: 'rgba(244, 67, 54, 0.3)',
    borderColor: 'rgba(244, 67, 54, 0.8)',
    shadowColor: '#f44336',
  },

  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.7)',
    borderRadius: gameScale(15),
    paddingVertical: gameScale(12),
    paddingHorizontal: gameScale(20),
    marginBottom: gameScale(15),
    borderWidth: gameScale(1.5),
    borderColor: 'rgba(255, 100, 100, 0.6)',
    shadowColor: '#ff4444',
    shadowOffset: { width: 0, height: gameScale(4) },
    shadowOpacity: 0.4,
    shadowRadius: gameScale(10),
    elevation: 6,
  },

  logoutText: {
    color: '#fff',
    fontSize: gameScale(16),
    fontFamily: 'DynaPuff',
    marginLeft: gameScale(10),
    fontWeight: '600',
  },

  supportSection: {
    alignItems: 'center',
  },

  supportTitle: {
    color: '#00ffff',
    fontSize: gameScale(14),
    fontFamily: 'DynaPuff',
    marginBottom: gameScale(10),
    textShadowColor: 'rgba(0, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: gameScale(2) },
    textShadowRadius: gameScale(4),
  },

  socialIconsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: gameScale(15),
  },

  socialIconButton: {
    width: gameScale(50),
    height: gameScale(50),
    borderRadius: gameScale(25),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: gameScale(1.5),
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: gameScale(2) },
    shadowOpacity: 0.3,
    shadowRadius: gameScale(5),
    elevation: 4,
  },

  buttonPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
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
});

export default SettingsModal;