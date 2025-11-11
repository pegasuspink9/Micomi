import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { scale, scaleWidth, scaleHeight, scaleFont, wp, hp } from '../../Responsiveness/gameResponsive';
import { ImageBackground } from 'expo-image';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CombatVSModal = ({ 
  visible = false, 
  onComplete = () => {},
  selectedCharacter = null,
  enemy = null,
  duration = 5000
}) => {
    const timerRef = useRef(null); 
    const visibleRef = useRef(visible);

    const characterSlideAnim = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
    const enemySlideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
    const vsScaleAnim = useRef(new Animated.Value(0)).current;
    const fadeOutAnim = useRef(new Animated.Value(1)).current;


    useEffect(() => {
      visibleRef.current = visible;  
      if (visible && !timerRef.current) {
        console.log('Setting timer for', duration);
        
        //  Entrance animation
        Animated.sequence([
          Animated.timing(characterSlideAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.parallel([
            Animated.timing(enemySlideAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(vsScaleAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();

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
                toValue: -SCREEN_WIDTH,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.timing(enemySlideAnim, {
                toValue: SCREEN_WIDTH,
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

            characterSlideAnim.setValue(-SCREEN_WIDTH);
            enemySlideAnim.setValue(SCREEN_WIDTH);
            vsScaleAnim.setValue(0);
            fadeOutAnim.setValue(1);
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
  }, [visible, duration, onComplete, characterSlideAnim, enemySlideAnim, vsScaleAnim, fadeOutAnim]);


  if (!visible || !selectedCharacter || !enemy) {
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

  return (
  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }} pointerEvents="box-none">
    <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, { opacity: fadeOutAnim },
    fadeOutAnim._value === 0 && { pointerEvents: 'none' }
    ]}>
    <View style={styles.modalOverlay}>
    <ImageBackground source={{ uri: 'https://res.cloudinary.com/dpbocuozx/image/upload/v1761122670/file_000000006f7061f4bcda9c9c314d5882_cfnaan.png' }} style={styles.modalBackground} >
  
    <Animated.View style={[styles.characterSide, { transform: [{ translateX: characterSlideAnim }] }]}>
          <View style={styles.characterContainer}>
            <View style={styles.avatarFrame}>
              <Image 
                source={{ uri: selectedCharacter.character_avatar }}
                style={styles.characterAvatar}
                resizeMode="contain"
              />
            </View>
            
             <View style={styles.nameContainer}>
              <View>
                <Text style={[styles.characterName, styles.heroName]}>
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
                  style={{ width: SCREEN_WIDTH * 1, height: SCREEN_HEIGHT * 0.5, resizeMode: 'cover' }}
                />
              </View>
        </Animated.View>

        {/* Enemy side - Bottom right */}
        <Animated.View style={[styles.enemySide, { transform: [{ translateX: enemySlideAnim }] }]}>
          <View style={styles.characterContainer}>
            <View style={styles.avatarFrame}>
              <Image 
                source={{ uri: enemy.enemy_avatar }}
                style={styles.enemyAvatar}
                resizeMode="contain" 
              />
            </View>
          </View>
            
          <View style={styles.enemyNameContainer}>
            <View>
              <Text style={[styles.characterName, styles.enemyName]}>
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
    left: 0,  //  Left side
    top: 0,
    width: SCREEN_WIDTH / 2,
    height: SCREEN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'flex-start',  
    zIndex: 3,
  },


   enemySide: {
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.14,
    left: SCREEN_HEIGHT * 0.12,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT / 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },

 
  

  characterContainer: {
    alignItems: 'center',
    marginTop: SCREEN_HEIGHT * 0.06,
    position: 'relative', 
  },

   enemyNameContainer: {
    position: 'absolute',
    right: SCREEN_WIDTH * 0.77,  
    top: SCREEN_HEIGHT * 0.22,
    alignItems: 'flex-end',  
  },

   
  enemyStatsContainer: {
    alignItems: 'flex-end',
    marginTop: scale(4),
  },

  
  statsContainer:{
    marginLeft: SCREEN_WIDTH * 0.03
  },


 avatarFrame: {
    position: 'relative',
    marginBottom: scale(-65),
  },

  characterAvatar: {
    width: scaleWidth(500),  
    height: scaleHeight(500)
  },

   enemyAvatar: {
    width: scaleWidth(500), 
    height: scaleHeight(500),
  },

 avatarGlow: {
    position: 'absolute',
    top: scale(-8),
    left: scale(-8),
    width: scale(216),
    height: scale(216),
    borderRadius: scale(108),
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
    position: 'absolute',
    right: SCREEN_WIDTH * 0.0001,  
    top: SCREEN_HEIGHT * 0.1, 
    alignItems: 'flex-start'
  },


   characterName: {
    textAlign: 'center',
    textShadowOffset: { width: scale(-3), height: scale(2) },
    textShadowRadius: scale(1),
  },

  heroName: {
    color: '#1f637dff',
    textShadowColor: 'rgba(124, 169, 209, 1)',
    fontSize: SCREEN_WIDTH * 0.2,
    fontFamily: 'MusicVibes'
  },

  enemyName: {  
    color: '#8b3f3fff',
    fontFamily: 'MusicVibes',
    textShadowColor: 'rgba(100, 0, 0, 0.8)',
    fontSize: SCREEN_WIDTH * 0.1,
  },

  roleLabel: {
    fontSize: scaleFont(12),
    color: '#0d6d76a3',
    fontWeight: 'bold',
    letterSpacing: scale(2)
  },

  enemyRoleLabel: {
    fontSize: scaleFont(12),
    color: '#6f3232ff',
    textAlign: 'right',
    fontWeight: 'bold',
    letterSpacing: scale(2)
  },

  

 


  statsText: {
    fontSize: scaleFont(15),
    color: '#d2d1f9ff',
    fontFamily: 'DynaPuff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: scale(2), height: scale(1) },
    textShadowRadius: scale(2),
    marginBottom: scale(2),
    marginRight: SCREEN_WIDTH * 0.02
  },



   
  vsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  vsBackground: {
    width: SCREEN_WIDTH * 1,
    height: SCREEN_HEIGHT * 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

    vsText: {
    fontSize: scaleFont(36),
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: scale(2), height: scale(2) },
    textShadowRadius: scale(4),
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
    bottom: scale(100),
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 4,
  },

    battleReadyText: {
    fontSize: scaleFont(32),
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: scale(2), height: scale(2) },
    textShadowRadius: scale(4),
    letterSpacing: scale(3),
  },

});

export default CombatVSModal;