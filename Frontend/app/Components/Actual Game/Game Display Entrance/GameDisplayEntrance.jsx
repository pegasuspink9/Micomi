import React, { useEffect, useRef, useState, useMemo} from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { gameScale, SCREEN } from '../../Responsiveness/gameResponsive';
import { Image, ImageBackground } from 'expo-image';
// 1. Add LinearGradient import
import { LinearGradient } from 'expo-linear-gradient';
import Reanimated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { soundManager } from '../Sounds/UniversalSoundManager';

const PVP_AVATAR_PLACEHOLDER = 'https://micomi-assets.me/Player%20Avatars/cute-astronaut-playing-vr-game-with-controller-cartoon-vector-icon-illustration-science-technology_138676-13977.avif';

// ... (SpriteAnimator component remains the same) ...
const SpriteAnimator = ({
  sourceUri,
  frameWidth,
  frameHeight,
  columns = 6,
  rows = 4,
  duration = 1000, 
  startAnimation = false,
  flipX = false,
}) => {
  // ... (SpriteAnimator logic) ...
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
    <View
      style={[
        { width: frameWidth, height: frameHeight, overflow: 'hidden' },
        flipX && { transform: [{ scaleX: -1 }] },
      ]}
    >
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
  // ... (props remain the same) ...
  visible = false, 
  onComplete = () => {},
  selectedCharacter = null,
  enemy = null,
  versusBackground = null,
  versusAudio = null,
  duration = 4000,
  isPvpMode = false,
}) => {
  // ... (all hooks and logic remain the same) ...
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
      if (visible && isBackgroundLoaded && !timerRef.current) {
        console.log('Setting timer for', duration);
        
        Animated.timing(characterSlideAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }).start(() => {
          console.log('Character slide complete. Triggering sprite animation.');
          setPlaySpriteAnimation(true);

            Animated.timing(enemySlideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            console.log('Enemy slide complete. Triggering enemy sprite animation.');
            setPlayEnemySpriteAnimation(true);
          });

          Animated.timing(vsScaleAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }).start();
        });

        timerRef.current = setTimeout(() => {
          console.log('Starting outro animation');
          
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

  // ... (data logging and useMemos remain the same) ...
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
    return selectedCharacter.character_attack[2]; 
  }
  return null;
}, [selectedCharacter]);

  const enemySpriteUrl = useMemo(() => {
    if (isPvpMode && Array.isArray(enemy?.enemy_attack) && enemy.enemy_attack.length > 3) {
      return enemy.enemy_attack[2];
    }
    if (enemy?.enemy_attack && typeof enemy.enemy_attack === 'string') {
      return enemy.enemy_attack;
    }
    return null;
  }, [enemy, isPvpMode]);

  const heroDisplayHealth = useMemo(() => {
    return (
      selectedCharacter?.character_max_health ??
      selectedCharacter?.max_health ??
      selectedCharacter?.current_health ??
      selectedCharacter?.character_health ??
      0
    );
  }, [selectedCharacter]);

  const heroDisplayDamage = useMemo(() => {
    const damage = selectedCharacter?.character_damage;
    if (Array.isArray(damage) && damage.length > 0) {
      return `${Math.min(...damage)}-${Math.max(...damage)}`;
    }
    return damage ?? 0;
  }, [selectedCharacter]);

  const enemyDisplayHealth = useMemo(() => {
    return enemy?.enemy_max_health ?? enemy?.enemy_health ?? 0;
  }, [enemy]);

  const enemyDisplayDamage = useMemo(() => {
    const damage = enemy?.enemy_damage;
    if (Array.isArray(damage) && damage.length > 0) {
      return `${Math.min(...damage)}-${Math.max(...damage)}`;
    }
    return damage ?? 0;
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
              {/* ... (avatar frame remains the same) ... */}
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
                {/* ... (name and stats remain the same) ... */}
                <View>
                  <Text 
                    style={[styles.characterName, styles.heroName]}
                    adjustsFontSizeToFit={true}
                    numberOfLines={1}
                    minimumFontScale={0.5} 
                  >
                    {selectedCharacter.character_name}
                  </Text>
                </View>
                
                <View style={styles.statsContainer}>
                  <Text style={styles.roleLabel}>HERO</Text>
                  <Text style={styles.statsText}>HP: {heroDisplayHealth}</Text>
                  <Text style={styles.statsText}>DMG: {heroDisplayDamage}</Text>
                  {isPvpMode ? (
                    // 2. Updated playerInfoRow for character
                    <View style={styles.playerInfoRow}>
                      {/* Outer box for 3D border effect */}
                      <View style={styles.playerInfoBorder}>
                        {/* Inner box for slanted background */}
                        <LinearGradient
                          colors={['#1f637dff', '#0d6d76a3']} // Hero colors
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.playerInfoSlantedBox}
                        >
                          {/* Content container to correct slant */}
                          <View style={styles.playerInfoInner}>
                            <Image
                              source={{ uri: PVP_AVATAR_PLACEHOLDER }}
                              style={styles.playerInfoAvatar}
                              contentFit="cover"
                            />
                            <View style={styles.playerInfoTextColumn}>
                              <Text style={[styles.playerInfoNameText, styles.heroPlayerInfoNameText]} numberOfLines={1}>
                                {selectedCharacter?.player_name || 'Player'}
                              </Text>
                              <Text style={[styles.playerInfoRankText, styles.heroPlayerInfoRankText]} numberOfLines={1}>
                                Rank: --
                              </Text>
                            </View>
                          </View>
                        </LinearGradient>
                      </View>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          </Animated.View>

          {/* VS Text (remains the same) */}
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
              {/* ... (avatar frame remains the same) ... */}
              <View style={styles.avatarFrame}>
                {enemySpriteUrl ? (
                  <SpriteAnimator
                    sourceUri={enemySpriteUrl}
                    frameWidth={styles.enemyAvatar.width}
                    frameHeight={styles.enemyAvatar.height}
                    startAnimation={playEnemySpriteAnimation}
                    flipX={isPvpMode}
                  />
                ) : (
                  <Image 
                    source={{ uri: enemy.enemy_avatar }}
                    style={[styles.enemyAvatar, isPvpMode && styles.enemyFacingLeft]}
                    resizeMode="contain" 
                  />
                )}
              </View>
            </View>
              
            <View style={styles.enemyNameContainer}>
              {/* ... (name and stats remain the same) ... */}
              <View>
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
                <Text style={styles.statsText}>HP: {enemyDisplayHealth}</Text>
                <Text style={styles.statsText}>DMG: {enemyDisplayDamage}</Text>
                {isPvpMode ? (
                  // 3. Updated playerInfoRow for enemy with swapped content
                  <View style={[styles.playerInfoRow, styles.enemyPlayerInfoRow]}>
                    <View style={[styles.playerInfoBorder, styles.enemyPlayerInfoBorder]}>
                      <LinearGradient
                        colors={['#8b3f3fff', '#6f3232ff']} // Enemy colors
                        start={{ x: 1, y: 0 }} // Gradient reversed for enemy side
                        end={{ x: 0, y: 0 }}
                        style={[styles.playerInfoSlantedBox, styles.enemyPlayerInfoSlantedBox]}
                      >
                        <View style={[styles.playerInfoInner, styles.enemyPlayerInfoInner]}>
                          {/* Swapped order: Text first, then Avatar */}
                          <View style={[styles.playerInfoTextColumn, styles.enemyPlayerInfoTextColumn]}>
                            <Text style={[styles.playerInfoNameText, styles.enemyPlayerInfoNameText]} numberOfLines={1}>
                              {enemy?.player_name || 'Player'}
                            </Text>
                            <Text style={[styles.playerInfoRankText, styles.enemyPlayerInfoRankText]} numberOfLines={1}>
                              Rank: --
                            </Text>
                          </View>
                          <Image
                            source={{ uri: PVP_AVATAR_PLACEHOLDER }}
                            style={styles.playerInfoAvatar}
                            contentFit="cover"
                          />
                        </View>
                      </LinearGradient>
                    </View>
                  </View>
                ) : null}
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
  // ... (existing styles) ...
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
  enemyFacingLeft: {
    transform: [{ scaleX: -1 }],
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
  // 4. Updated styles for the new player info box
  playerInfoRow: {
    marginTop: gameScale(8),
  },
  enemyPlayerInfoRow: {
    alignItems: 'flex-end',
  },
  // Keep a compact themed card with depth while preserving readability.
  playerInfoBorder: {
    padding: gameScale(2),
    backgroundColor: 'rgba(8, 16, 28, 0.88)',
    borderRadius: gameScale(8),
    borderWidth: gameScale(1),
    borderColor: 'rgba(184, 231, 255, 0.45)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: gameScale(2) },
    shadowOpacity: 0.35,
    shadowRadius: gameScale(3),
    elevation: 5,
  },
  enemyPlayerInfoBorder: {
    borderColor: 'rgba(255, 204, 204, 0.45)',
  },
  playerInfoSlantedBox: {
    borderRadius: gameScale(6),
    paddingVertical: gameScale(4),
    paddingHorizontal: gameScale(8),
    borderWidth: gameScale(1),
    borderColor: 'rgba(255,255,255,0.2)',
  },
  enemyPlayerInfoSlantedBox: {
    borderColor: 'rgba(255,255,255,0.16)',
  },
  playerInfoInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  enemyPlayerInfoInner: {
    justifyContent: 'flex-end',
  },
  playerInfoAvatar: {
    width: gameScale(30),
    height: gameScale(30),
    borderRadius: gameScale(15),
    borderWidth: gameScale(1.5),
    borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(12, 24, 38, 0.8)',
  },
  playerInfoTextColumn: {
    justifyContent: 'center',
    marginLeft: gameScale(8),
  },
  enemyPlayerInfoTextColumn: {
    alignItems: 'flex-end',
    marginLeft: 0,
    marginRight: gameScale(8), // Add margin to the right instead
  },
  playerInfoNameText: {
    color: '#ffffff',
    fontSize: gameScale(11),
    fontFamily: 'DynaPuff',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
    maxWidth: gameScale(110),
  },
  heroPlayerInfoNameText: {
    color: '#e6f8ff',
  },
  enemyPlayerInfoNameText: {
    color: '#ffe8e8',
  },
  playerInfoRankText: {
    color: '#e0e0e0',
    fontSize: gameScale(10),
    fontFamily: 'DynaPuff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
    maxWidth: gameScale(110),
  },
  heroPlayerInfoRankText: {
    color: '#bfe8ff',
  },
  enemyPlayerInfoRankText: {
    color: '#ffc7c7',
  },
  // ... (rest of the styles remain the same) ...
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