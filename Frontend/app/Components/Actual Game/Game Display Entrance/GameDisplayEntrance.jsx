import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, StyleSheet, Dimensions, Image, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CombatVSModal = ({ 
  visible = false, 
  onComplete = () => {},
  character = null,
  enemy = null,
  duration = 3000 // How long to show the VS screen
}) => {
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const characterSlideAnim = useRef(new Animated.Value(-SCREEN_WIDTH * 0.5)).current;
  const enemySlideAnim = useRef(new Animated.Value(SCREEN_WIDTH * 0.5)).current;
  const vsScaleAnim = useRef(new Animated.Value(0)).current;
  const lightningAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      startVSAnimation();
    } else {
      resetAnimations();
    }
  }, [visible]);

  const startVSAnimation = () => {
    // Reset all animations
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.5);
    characterSlideAnim.setValue(-SCREEN_WIDTH * 0.5);
    enemySlideAnim.setValue(SCREEN_WIDTH * 0.5);
    vsScaleAnim.setValue(0);
    lightningAnim.setValue(0);

    // Start animation sequence
    Animated.sequence([
      // 1. Fade in background
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      
      // 2. Slide in characters
      Animated.parallel([
        Animated.spring(characterSlideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(enemySlideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      
      // 3. Scale up characters
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      
      // 4. VS text entrance
      Animated.spring(vsScaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      
      // 5. Hold for duration, then fade out
      Animated.delay(duration - 1000),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      })
    ]).start(() => {
      onComplete();
    });
  };

  const resetAnimations = () => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.5);
    characterSlideAnim.setValue(-SCREEN_WIDTH * 0.5);
    enemySlideAnim.setValue(SCREEN_WIDTH * 0.5);
    vsScaleAnim.setValue(0);
    lightningAnim.setValue(0);
  };

  if (!character || !enemy) {
    console.log('🚫 Missing character or enemy data:', { character: !!character, enemy: !!enemy });
    return null;
  }

  // ✅ Debug logging to check data structure
  console.log('🎭 GameDisplayEntrance data:', {
    character: {
      name: character.character_name,
      avatar: character.character_avatar,
      health: character.character_health,
      damage: character.character_damage
    },
    enemy: {
      name: enemy.enemy_name,
      avatar: enemy.enemy_avatar,
      health: enemy.enemy_health,
      damage: enemy.enemy_damage
    }
  });

  return (
    <Modal
      visible={visible}
      transparent={false} // ✅ Changed to false for full screen
      animationType="none"
      statusBarTranslucent={true}
    >

      <StatusBar hidden={true} />

      <Animated.View 
        style={[
          styles.modalOverlay,
          {
            opacity: fadeAnim,
          }
        ]}
      >
        {/* Background gradient */}
        <LinearGradient
          colors={[
            'rgba(0, 0, 0, 0.95)',
            'rgba(75, 0, 130, 0.8)', // Purple
            'rgba(220, 20, 60, 0.8)', // Crimson
            'rgba(0, 0, 0, 0.95)'
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.backgroundGradient}
        >
          {/* Character side */}
          <Animated.View 
            style={[
              styles.characterSide,
              {
                transform: [
                  { translateX: characterSlideAnim },
                  { scale: scaleAnim }
                ]
              }
            ]}
          >
            <View style={styles.characterContainer}>
              <View style={styles.avatarFrame}>
                <Image 
                  source={{ uri: character.character_avatar }}
                  style={styles.characterAvatar}
                  resizeMode="cover"
                />
                <View style={[styles.avatarGlow, styles.characterGlow]} />
              </View>
              
              <View style={styles.nameContainer}>
                <Text style={[styles.characterName, styles.heroName]}>
                  {character.character_name}
                </Text>
                <Text style={styles.roleLabel}>HERO</Text>
              </View>
              
              <View style={styles.statsContainer}>
                <Text style={styles.statsText}>HP: {character.character_health}</Text>
                <Text style={styles.statsText}>
                  DMG: {Array.isArray(character.character_damage) 
                    ? `${Math.min(...character.character_damage)}-${Math.max(...character.character_damage)}`
                    : character.character_damage}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* VS Text */}
          <Animated.View 
            style={[
              styles.vsContainer,
              {
                transform: [
                  { scale: vsScaleAnim },
                  { rotateZ: vsScaleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg']
                  })}
                ]
              }
            ]}
          >
            <LinearGradient
              colors={['#FFD700', '#FF6B35', '#FF1744']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.vsBackground}
            >
              <Text style={styles.vsText}>VS</Text>
            </LinearGradient>
            
            <View style={styles.vsGlow} />
          </Animated.View>

          {/* Enemy side */}
          <Animated.View 
            style={[
              styles.enemySide,
              {
                transform: [
                  { translateX: enemySlideAnim },
                  { scale: scaleAnim },
                  { scaleX: -1 } // Flip enemy to face character
                ]
              }
            ]}
          >
            <View style={[styles.characterContainer, { transform: [{ scaleX: -1 }] }]}>
              <View style={styles.avatarFrame}>
                <Image 
                  source={{ uri: enemy.enemy_avatar }}
                  style={styles.characterAvatar}
                  resizeMode="cover"
                />
                <View style={[styles.avatarGlow, styles.enemyGlow]} />
              </View>
              
              <View style={styles.nameContainer}>
                <Text style={[styles.characterName, styles.enemyName]}>
                  {enemy.enemy_name}
                </Text>
                <Text style={styles.roleLabel}>ENEMY</Text>
              </View>
              
              <View style={styles.statsContainer}>
                <Text style={styles.statsText}>HP: {enemy.enemy_health}</Text>
                <Text style={styles.statsText}>DMG: {enemy.enemy_damage}</Text>
              </View>
            </View>
          </Animated.View>

          {/* Battle ready text */}
          <Animated.View 
            style={[
              styles.battleReadyContainer,
              {
                opacity: lightningAnim,
                transform: [
                  { translateY: lightningAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  })}
                ]
              }
            ]}
          >
            <Text style={styles.battleReadyText}>BATTLE READY!</Text>
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
   modalOverlay: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

   backgroundGradient: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    position: 'relative',
    paddingTop: 0,
    paddingBottom: 0,
  },

  characterSide: {
    flex: 1,
    alignItems: 'center',
    zIndex: 3,
  },

  enemySide: {
    flex: 1,
    alignItems: 'center',
    zIndex: 3,
  },

  characterContainer: {
    alignItems: 'center',
    maxWidth: SCREEN_WIDTH * 0.35,
  },

  avatarFrame: {
    position: 'relative',
    marginBottom: 15,
  },

  characterAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FFF',
  },

  avatarGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 136,
    height: 136,
    borderRadius: 68,
    zIndex: -1,
  },

  characterGlow: {
    backgroundColor: 'rgba(76, 175, 80, 0.6)',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },

  enemyGlow: {
    backgroundColor: 'rgba(244, 67, 54, 0.6)',
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },

  nameContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },

  characterName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginBottom: 5,
  },

  heroName: {
    color: '#4CAF50',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
  },

  enemyName: {
    color: '#F44336',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
  },

  roleLabel: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: 'bold',
    letterSpacing: 2,
  },

  statsContainer: {
    alignItems: 'center',
  },

  statsText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginBottom: 2,
  },

  vsContainer: {
    position: 'absolute',
    left: '50%',
    marginLeft: -50,
    zIndex: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  vsBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },

  vsText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },

  vsGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 25,
    zIndex: -1,
  },

  battleReadyContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 4,
  },

  battleReadyText: {
    fontSize: 32, // ✅ Larger text
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 3,
  },
});

export default CombatVSModal;