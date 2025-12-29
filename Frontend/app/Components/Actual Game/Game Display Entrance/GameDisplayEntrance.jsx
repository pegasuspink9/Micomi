import React, { useEffect, useRef, useState, useMemo} from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { gameScale, SCREEN } from '../../Responsiveness/gameResponsive';
import { Image, ImageBackground } from 'expo-image';
import Reanimated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { soundManager } from '../Sounds/UniversalSoundManager';

const SpriteAnimator = ({
  sourceUri,
  frameWidth,
  frameHeight,
  columns = 6,
  rows = 4,
  duration = 1000, 
  startAnimation = false
}) => {
  const frameIndex = useSharedValue(0);
  const totalFrames = columns * rows;

  useEffect(() => {
    if (startAnimation){
      frameIndex.value = 0;
      frameIndex.value = withTiming(totalFrames - 1, {
        duration: duration,
        easing: Easing.linear,
      });
    }
  }, [sourceUri, totalFrames, duration, startAnimation]); 

  const animatedStyle = useAnimatedStyle(() => {
    const frame = Math.floor(frameIndex.value);
    const column = frame % columns;
    const row = Math.floor(frame / columns);
    return {
      transform: [
        { translateX: -(column * frameWidth) },
        { translateY: -(row * frameHeight) },
      ],
    };
  });

  if (!sourceUri) {
    return null;
  }

  return (
    <View style={{ width: frameWidth, height: frameHeight, overflow: 'hidden' }}>
      <Reanimated.View style={[
        animatedStyle,
        { width: frameWidth * columns, height: frameHeight * rows }
      ]}>
        <Image
          source={{ uri: sourceUri }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          cachePolicy="disk"
        />
      </Reanimated.View>
    </View>
  );
};


const CombatVSModal = ({ 
  visible = false, 
  onComplete = () => {},
  selectedCharacter = null,
  enemy = null,
  versusBackground = null,
  versusAudio = null,
  duration = 4000
}) => {

  const [isBackgroundLoaded, setIsBackgroundLoaded] = useState(false);
  const [playSpriteAnimation, setPlaySpriteAnimation] = useState(false);
  const [playEnemySpriteAnimation, setPlayEnemySpriteAnimation] = useState(false);

   useEffect(() => {
    if (visible && versusAudio) {
      console.log('🎵 Playing versus audio:', versusAudio);
      soundManager.playVersusMusic(versusAudio);
    }
  }, [visible, versusAudio]);

   useEffect(() => {
      if (visible && versusBackground) {
        console.log('🎭 Versus Background URL:', versusBackground);
      }
    }, [visible, versusBackground]);

    const timerRef = useRef(null); 
    const visibleRef = useRef(visible);

    const characterSlideAnim = useRef(new Animated.Value(-SCREEN.width)).current;
    const enemySlideAnim = useRef(new Animated.Value(SCREEN.width)).current;
    const vsScaleAnim = useRef(new Animated.Value(0)).current;
    const fadeOutAnim = useRef(new Animated.Value(1)).current;


    useEffect(() => {
      visibleRef.current = visible;  
      // ✅ MODIFIED: The main animation logic is updated here.
      if (visible && isBackgroundLoaded && !timerRef.current) {
        console.log('Setting timer for', duration);
        
        // 1. Start the character slide-in animation first.
        Animated.timing(characterSlideAnim, {
          toValue: 0,
          duration: 350, // Slightly longer for better effect
          useNativeDriver: true,
        }).start(() => {
          // 2. Once the slide-in is complete, trigger the sprite animation.
          console.log('Character slide complete. Triggering sprite animation.');
          setPlaySpriteAnimation(true);

          // 3. Start the rest of the entrance animations (enemy slide-in and VS logo).
            Animated.timing(enemySlideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            // 4. Once the enemy slide-in is complete, trigger its sprite animation.
            console.log('Enemy slide complete. Triggering enemy sprite animation.');
            setPlayEnemySpriteAnimation(true);
          });

          Animated.timing(vsScaleAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }).start();
        });

        //  Set timer for outro animation
        timerRef.current = setTimeout(() => {
          console.log('Starting outro animation');
          
          // Outro animation - reverse sequence
          Animated.sequence([
            Animated.timing(vsScaleAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.parallel([
              Animated.timing(characterSlideAnim, {
                toValue: -SCREEN.width,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.timing(enemySlideAnim, {
                toValue: SCREEN.width,
                duration: 200,
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(fadeOutAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            console.log('Timer triggered, calling onComplete');
            onComplete();
            timerRef.current = null;

            characterSlideAnim.setValue(-SCREEN.width);
            enemySlideAnim.setValue(SCREEN.width);
            vsScaleAnim.setValue(0);
            fadeOutAnim.setValue(1);
            setPlaySpriteAnimation(false);
            setPlayEnemySpriteAnimation(false);
          });
        }, duration);
      }
    return () => {
      if (!visibleRef.current) {  
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      }
    };  
  }, [visible, isBackgroundLoaded, duration, onComplete, characterSlideAnim, enemySlideAnim, vsScaleAnim, fadeOutAnim]);


  if (!visible || !selectedCharacter || !enemy || !versusBackground) {
    return null;
  }
   

  if (!selectedCharacter || !enemy) {
    console.log('🚫 Missing selectedCharacter or enemy data:', { selectedCharacter: !!selectedCharacter, enemy: !!enemy });
    return null;
  }


  console.log('🎭 GameDisplayEntrance data:', {
    selectedCharacter: {
      name: selectedCharacter.character_name,
      avatar: selectedCharacter.character_avatar,
      health: selectedCharacter.character_health,
      damage: selectedCharacter.character_damage
    },
    enemy: {
      name: enemy.enemy_name,
      avatar: enemy.enemy_avatar,
      health: enemy.enemy_health,
      damage: enemy.enemy_damage
    }
  });

  const characterSpriteUrl = useMemo(() => {
  if (selectedCharacter?.character_attack && Array.isArray(selectedCharacter.character_attack) && selectedCharacter.character_attack.length > 3) {
    return selectedCharacter.character_attack[3]; 
  }
  return null;
}, [selectedCharacter]);

  const enemySpriteUrl = useMemo(() => {
    if (enemy?.enemy_attack && typeof enemy.enemy_attack === 'string') {
      return enemy.enemy_attack;
    }
    return null;
  }, [enemy]);


  return (
     <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }} pointerEvents="box-none">
    <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, { opacity: fadeOutAnim },
    fadeOutAnim._value === 0 && { pointerEvents: 'none' }
    ]}>
    <View style={styles.modalOverlay}>
    <ImageBackground 
      source={{ uri: versusBackground }} 
      style={styles.modalBackground}
      onLoad={() => setIsBackgroundLoaded(true)}
    >

     {isBackgroundLoaded && (
        <>
          {/* Character side - Top left */}
          <Animated.View style={[styles.characterSide, { transform: [{ translateX: characterSlideAnim }] }]}>
            <View style={styles.characterContainer}>
              <View style={styles.avatarFrame}>
                {characterSpriteUrl ? (
                  <SpriteAnimator
                    sourceUri={characterSpriteUrl}
                    frameWidth={styles.characterAvatar.width}
                    frameHeight={styles.characterAvatar.height}
                    startAnimation={playSpriteAnimation}
                  />
                ) : (
                  <Image 
                    source={{ uri: selectedCharacter.character_avatar }}
                    style={styles.characterAvatar}
                    resizeMode="contain"
                  />
                )}
              </View>

              <View style={styles.nameContainer}>
                <View>
                  {/* ✅ FIXED: Added adjustsFontSizeToFit and numberOfLines */}
                  <Text 
                    style={[styles.characterName, styles.heroName]}
                    adjustsFontSizeToFit={true}
                    numberOfLines={1}
                    minimumFontScale={0.5} // Don't let it get too tiny
                  >
                    {selectedCharacter.character_name}
                  </Text>
                </View>
                
                <View style={styles.statsContainer}>
                  <Text style={styles.roleLabel}>HERO</Text>
                  <Text style={styles.statsText}>HP: {selectedCharacter.max_health}</Text>
                  <Text style={styles.statsText}>
                    DMG: {Array.isArray(selectedCharacter.character_damage) 
                      ? `${Math.min(...selectedCharacter.character_damage)}-${Math.max(...selectedCharacter.character_damage)}`
                      : selectedCharacter.character_damage}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* VS Text */}
          <Animated.View style={[styles.vsContainer, { transform: [{ scale: vsScaleAnim }] }]}>
            <View style={styles.vsBackground}>
              <Image 
                source={{ uri: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1761043746/Untitled_design_16_sixivj.png' }}
                style={styles.vsImage}
              />
            </View>
          </Animated.View>

          {/* Enemy side - Bottom right */}
          <Animated.View style={[styles.enemySide, { transform: [{ translateX: enemySlideAnim }] }]}>
            <View style={styles.characterContainer}>
              <View style={styles.avatarFrame}>
                {enemySpriteUrl ? (
                  <SpriteAnimator
                    sourceUri={enemySpriteUrl}
                    frameWidth={styles.enemyAvatar.width}
                    frameHeight={styles.enemyAvatar.height}
                    startAnimation={playEnemySpriteAnimation}
                  />
                ) : (
                  <Image 
                    source={{ uri: enemy.enemy_avatar }}
                    style={styles.enemyAvatar}
                    resizeMode="contain" 
                  />
                )}
              </View>
            </View>
              
            <View style={styles.enemyNameContainer}>
              <View>
                {/* ✅ Optional: Applied same logic to enemy name for consistency */}
                <Text 
                  style={[styles.characterName, styles.enemyName]}
                  adjustsFontSizeToFit={true}
                  numberOfLines={1}
                  minimumFontScale={0.5}
                >
                  {enemy.enemy_name}
                </Text>
                <Text style={styles.enemyRoleLabel}>ENEMY</Text>
              </View>

              <View style={styles.enemyStatsContainer}>
                <Text style={styles.statsText}>HP: {enemy.enemy_health}</Text>
                <Text style={styles.statsText}>DMG: {enemy.enemy_damage}</Text>
              </View>
            </View>
          </Animated.View>
        </>
      )}
    </ImageBackground>
    </View>
    </Animated.View>
     </View>
  );
};

const styles = StyleSheet.create({
   modalOverlay: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  modalBackground:{
    flex: 1
  },
   characterSide: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: gameScale(390 / 2),
    height: gameScale(844),
    alignItems: 'center',
    justifyContent: 'flex-start',  
    zIndex: 3,
  },
 enemySide: {
    position: 'absolute',
   right: gameScale(120),  
    bottom: gameScale(844 * 0.14),
    width: gameScale(390 / 2),
    height: gameScale(844 / 2),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  characterContainer: {
    alignItems: 'center',
    marginTop: gameScale(844 * 0.06),
    position: 'relative', 
  },
  enemyNameContainer: {
    position: 'absolute',
    right: gameScale(70),
    top: gameScale(844 * 0.22),
    alignItems: 'flex-end',  
  },
  enemyStatsContainer: {
    alignItems: 'flex-end',
    marginTop: gameScale(4),
  },
  statsContainer:{
    marginLeft: gameScale(390 * 0.03)
  },
  avatarFrame: {
    position: 'relative',
    marginBottom: gameScale(-65),
  },
  characterAvatar: {
    width: gameScale(500),  
    height: gameScale(500)
  },
   enemyAvatar: {
    width: gameScale(600), 
    height: gameScale(600)
  },
  avatarGlow: {
    position: 'absolute',
    top: gameScale(-8),
    left: gameScale(-8),
    width: gameScale(216),
    height: gameScale(216),
    borderRadius: gameScale(108),
    zIndex: -1,
  },
  characterGlow: {
    backgroundColor: 'rgba(76, 175, 80, 0.6)',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: gameScale(20),
  },
  enemyGlow: {
    backgroundColor: 'rgba(244, 67, 54, 0.6)',
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: gameScale(20),
  },
  nameContainer: {
    position: 'absolute',
    right: gameScale(390 * 0.0001),
    top: gameScale(844 * 0.1),
    alignItems: 'flex-start'
  },
  characterName: {
    textAlign: 'center',
    textShadowOffset: { width: gameScale(-3), height: gameScale(2) },
    textShadowRadius: gameScale(1),
  },
  heroName: {
    color: '#1f637dff',
    textShadowColor: 'rgba(124, 169, 209, 1)',
    fontSize: gameScale(390 * 0.2),
    fontFamily: 'MusicVibes',
    // ✅ ADDED: maxWidth ensures adjustsFontSizeToFit knows the boundary
    maxWidth: gameScale(390 * 0.8), 
  },
  enemyName: {  
    color: '#8b3f3fff',
    fontFamily: 'MusicVibes',
    textShadowColor: 'rgba(100, 0, 0, 0.8)',
    fontSize: gameScale(390 * 0.2),
    maxWidth: gameScale(390 * 0.8),
  },
  roleLabel: {
    fontSize: gameScale(12),
    color: '#0d6d76a3',
    fontWeight: 'bold',
    letterSpacing: gameScale(2)
  },
  enemyRoleLabel: {
    fontSize: gameScale(12),
    color: '#6f3232ff',
    textAlign: 'right',
    fontWeight: 'bold',
    letterSpacing: gameScale(2)
  },
  statsText: {
    fontSize: gameScale(15),
    color: '#d2d1f9ff',
    fontFamily: 'DynaPuff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: gameScale(2), height: gameScale(1) },
    textShadowRadius: gameScale(2),
    marginBottom: gameScale(2),
    marginRight: gameScale(390 * 0.02)
  },
  vsImage: {
    width: gameScale(690),
    height: gameScale(602),
    resizeMode: 'contain',
  },
  vsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: gameScale(390),
    height: gameScale(844),
    zIndex: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsBackground: {
    width: gameScale(390),
    height: gameScale(844),
    justifyContent: 'center',
    alignItems: 'center',
  },
  vsText: {
    fontSize: gameScale(36),
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: gameScale(2), height: gameScale(2) },
    textShadowRadius: gameScale(4),
  },
  vsGlow: {
    position: 'absolute',
    top: gameScale(-10),
    left: gameScale(-10),
    width: gameScale(120),
    height: gameScale(120),
    borderRadius: gameScale(60),
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: gameScale(25),
    zIndex: -1,
  },
   battleReadyContainer: {
    position: 'absolute',
    bottom: gameScale(100),
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 4,
  },
  battleReadyText: {
    fontSize: gameScale(32),
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: gameScale(2), height: gameScale(2) },
    textShadowRadius: gameScale(4),
    letterSpacing: gameScale(3),
  },
});

export default CombatVSModal;