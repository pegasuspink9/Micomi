import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { scale, scaleWidth, scaleHeight, scaleFont, wp, hp } from '../../Responsiveness/gameResponsive';
import { ImageBackground } from 'expo-image';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CombatVSModal = ({ 
  visible = false, 
  onComplete = () => {},
  selectedCharacter = null,
  enemy = null,
  duration = 2000 
}) => {
  useEffect(() => {
    if (visible) {
      // Wait for duration, then complete
      const timer = setTimeout(() => {
        onComplete();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onComplete]);

  if (!selectedCharacter || !enemy) {
    console.log('🚫 Missing selectedCharacter or enemy data:', { selectedCharacter: !!selectedCharacter, enemy: !!enemy });
    return null;
  }

  // ✅ Debug logging to check data structure
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
    <ImageBackground    source={{ uri: 'https://res.cloudinary.com/dpbocuozx/image/upload/v1761122670/file_000000006f7061f4bcda9c9c314d5882_cfnaan.png' }} style={styles.modalOverlay}>
     
   {/* Character side - Left top */}
        <View style={styles.characterSide}>
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
        </View>

        {/* VS Text */}
        <View style={styles.vsContainer}>
          <View style={styles.vsBackground}>
            <Image 
              source={{ uri: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1761043746/Untitled_design_16_sixivj.png' }}
              style={{ width: SCREEN_WIDTH * 1, height: SCREEN_HEIGHT * 0.5, resizeMode: 'cover' }}
            />
          </View>
        </View>

        {/* Enemy side - Bottom right */}
        <View style={styles.enemySide}>
          <View style={styles.characterContainer}>
            <View style={styles.avatarFrame}>
              <Image 
                source={{ uri: enemy.enemy_avatar }}
                style={styles.enemyAvatar}
                resizeMode="contain" 
              />
            </View>
            
            <View style={styles.enemyNameContainer}>
              <Text style={[styles.characterName, styles.enemyName]}>
                {enemy.enemy_name}
              </Text>
              <Text style={styles.roleLabel}>ENEMY</Text>
            </View>

            <View style={styles.enemyStatsContainer}>
              <Text style={styles.statsText}>HP: {enemy.enemy_health}</Text>
              <Text style={styles.statsText}>DMG: {enemy.enemy_damage}</Text>
            </View>
          </View>
        </View>
    </ImageBackground>
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
  },
 


   characterSide: {
    position: 'absolute',
    left: 0,  // ✅ Left side
    top: 0,
    width: SCREEN_WIDTH / 2,
    height: SCREEN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'flex-start',  // ✅ Start from top
    zIndex: 3,
  },


   enemySide: {
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.17,
    left: SCREEN_WIDTH * 0.25,
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
    left: SCREEN_WIDTH * 0.0001,  // ✅ Opposite of right
    top: SCREEN_HEIGHT * 0.1,
    alignItems: 'flex-end',  // ✅ Opposite of flex-start
  },

   
  enemyStatsContainer: {
    position: 'absolute',  // ✅ Changed to absolute like nameContainer
    left: SCREEN_WIDTH * 0.0001,  // ✅ Opposite of right/marginLeft
    top: SCREEN_HEIGHT * 0.2,  // ✅ Position below name
    alignItems: 'flex-end',  // ✅ Opposite of flex-start
    // Removed marginRight
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
    width: scaleWidth(400), 
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
    width: '100%',
    fontSize: scaleFont(24),
    textAlign: 'center',
    textShadowOffset: { width: scale(-3), height: scale(0) },
    textShadowRadius: scale(1),
  },

  heroName: {
    color: '#ffffffff',
    textShadowColor: 'rgba(124, 169, 209, 1)',
    fontSize: SCREEN_WIDTH * 0.2,
    fontFamily: 'MusicVibes'
  },

  enemyName: {
    color: '#F44336',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
  },

  roleLabel: {
    fontSize: scaleFont(12),
    color: '#0d6d76ff',
    fontWeight: 'bold',
    letterSpacing: scale(2),
  },

  

 


  statsText: {
    fontSize: scaleFont(15),
    color: '#FFF',
    fontFamily: 'DynaPuff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: scale(2), height: scale(1) },
    textShadowRadius: scale(2),
    marginBottom: scale(2),
    marginRight: SCREEN_WIDTH * 0.02
  },


  statsContainer:{
    marginLeft: SCREEN_WIDTH * 0.03
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