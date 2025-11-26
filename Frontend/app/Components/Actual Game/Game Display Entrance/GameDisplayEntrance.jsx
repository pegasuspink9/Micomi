import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import { gameScale, SCREEN } from '../../Responsiveness/gameResponsive';
import { ImageBackground } from 'expo-image';


const CombatVSModal = ({ 
  visible = false, 
  onComplete = () => {},
  selectedCharacter = null,
  enemy = null,
  versusBackground = null,
  duration = 3000
}) => {

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
    <ImageBackground source={{ uri: versusBackground }} style={styles.modalBackground} >
  
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
                  style={styles.vsImage}
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
    right: 0,
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
    left: gameScale(-200),
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
    height: gameScale(600),
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
    fontFamily: 'MusicVibes'
  },
  enemyName: {  
    color: '#8b3f3fff',
    fontFamily: 'MusicVibes',
    textShadowColor: 'rgba(100, 0, 0, 0.8)',
    fontSize: gameScale(390 * 0.1),
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