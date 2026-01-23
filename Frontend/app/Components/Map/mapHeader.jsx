import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import React, { useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { usePlayerProfile } from '../../hooks/usePlayerProfile';
import { gameScale } from '../Responsiveness/gameResponsive';

export default function MapHeader() {
  const { playerData, loadPlayerProfile } = usePlayerProfile();

  useFocusEffect(
    useCallback(() => {
      loadPlayerProfile();
    }, [loadPlayerProfile])
  );

  const calculateLevelProgress = () => {
    const currentLevel = playerData?.playerLevel || 1;
    const currentExp = playerData?.expPoints || 0;
    
    // Formula: 100 * currentLevel^1.5
    const nextLevelExp = Math.floor(100 * Math.pow(currentLevel, 1.5));
    const progress = Math.min((currentExp / nextLevelExp) * 100, 100);
    
    return {
      currentLevel,
      currentExp,
      nextLevelExp,
      progress: Math.max(0, progress)
    };
  };

  const levelData = calculateLevelProgress();
  const username = playerData?.username || "Loading...";
  const coins = playerData?.coins || 0;
  const lives = 300;
  
  // Use hero image or a fallback
  const avatarUrl = playerData?.heroSelected?.character_image_display || "https://github.com/user-attachments/assets/eced9b8f-eae0-48f5-bc05-d8d5ce018529";

  return (
    <View style={styles.header}>
      {/* Player Section */}
      <View style={styles.playerInfo}>
        
        {/* Avatar Image */}
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: avatarUrl }} 
            style={styles.avatarImage} 
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        </View>
        
        {/* Column: Name Top, Level+Bar Bottom */}
        <View style={styles.nameAndXpColumn}>

            <Text style={styles.usernameText} numberOfLines={1}>{username}</Text>
            
            {/* Row: Level Badge + XP Bar */}
            <View style={styles.levelAndBarRow}>
                
                {/* Mini Level Badge - zIndex ensures it sits on top */}
                <View style={styles.miniBadgeLayer1}>
                    <View style={styles.miniBadgeLayer2}>
                      <View style={styles.miniBadgeLayer3}>
                        <LinearGradient
                          colors={['#045262ff', '#045262ff']}
                          style={styles.levelBadgeGradient}
                        >
                          <Text style={styles.miniLevelText}>{levelData.currentLevel}</Text>
                        </LinearGradient>
                      </View>
                    </View>
                </View>

                {/* XP Bar - Negative margin pulls it behind badge */}
                <View style={styles.xpBarLayer1}>
                    <View style={styles.xpBarLayer2}>
                        <View style={styles.xpBarLayer3}>
                              <LinearGradient
                                colors={['#045262ff', '#099cb9ff']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[
                                    styles.xpBarFill,
                                    { width: `${levelData.progress}%` }
                                ]}
                            />
                             <View style={styles.xpTextContainer}>
                                <Text style={styles.xpText}>
                                    {levelData.currentExp}/{levelData.nextLevelExp}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </View>
      </View>
      
      {/* Resources Section */}
      <View style={styles.resources}>
        <View style={styles.resourceItem}>
          <Image 
            source={require('../icons/coins.png')} 
            style={styles.coinImage} 
            contentFit="contain"
            cachePolicy="memory-disk"
          />
          <Text style={styles.resourceText}>{coins}</Text>
        </View>
        <View style={styles.resourceItem}>
          <Image 
            source={require('../icons/energy.png')} 
            style={styles.energyImage} 
            contentFit="contain"
            cachePolicy="memory-disk"
          />
          <Text style={styles.resourceText}>{lives}</Text>
        </View>
      </View>

      {/* Settings Icon */}
      <View style={styles.headerIcons}>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="settings" size={gameScale(24)} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: gameScale(20),
    paddingTop: gameScale(20),
    paddingBottom: gameScale(15),
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '55%',
    gap: gameScale(10),
  },
  
  // Avatar Styles
  avatarContainer: {
    width: gameScale(46),
    height: gameScale(46),
    borderRadius: gameScale(23),
    borderWidth: gameScale(2),
    borderColor: '#ffffff',
    backgroundColor: '#1a1a1a', 
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    elevation: 5,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },

  coinImage:{
    width: gameScale(20),
    height: gameScale(20),
  },

  energyImage: {
    width: gameScale(30),
    height: gameScale(30),
  },

  nameAndXpColumn: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    marginLeft: gameScale(-9), // Align with username text
  },
  usernameText: {
    color: '#fff',
    fontSize: gameScale(14),
    fontFamily: 'DynaPuff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginLeft: gameScale(4), // Slightly more margin since bar moves left
  },
  
  levelAndBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: gameScale(-2),
  },

  // Mini Level Badge
  miniBadgeLayer1: {
    width: gameScale(24),
    height: gameScale(24),
    borderRadius: gameScale(12),
    backgroundColor: '#ffffffff',
    padding: gameScale(1.5),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 10, // Higher elevation to sit on top
    zIndex: 10,    // Ensure it renders on top
  },
  miniBadgeLayer2: {
    flex: 1,
    borderRadius: gameScale(12),
    backgroundColor: '#2a2a2a',
    padding: gameScale(1),
    borderWidth: gameScale(0.5),
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  miniBadgeLayer3: {
    flex: 1,
    borderRadius: gameScale(12),
    overflow: 'hidden',
    borderWidth: gameScale(0.5),
    borderColor: 'rgba(0, 0, 0, 0.4)',
  },
  levelBadgeGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniLevelText: {
    fontSize: gameScale(10),
    fontFamily: 'MusicVibes',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: gameScale(1),
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },

  // XP Bar Styles
  xpBarLayer1: {
    height: gameScale(12),
    width: gameScale(80),
    backgroundColor: '#000000ff',
    borderRadius: gameScale(10),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    elevation: 3,
    zIndex: 1,
    marginLeft: gameScale(-8),
  },
  xpBarLayer2: {
    flex: 1,
    backgroundColor: '#ffffffff',
    borderRadius: gameScale(9),
    padding: gameScale(1),
  },
  xpBarLayer3: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 1)',
    borderRadius: gameScale(8),
    overflow: 'hidden',
    position: 'relative',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: gameScale(8),
  },
  xpTextContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
    // Add padding to prevent text from being covered by the overlapping badge
    paddingLeft: gameScale(10), 
  },
  xpText: {
    fontSize: gameScale(8),
    fontFamily: 'Poppins',
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 1)',
    textShadowRadius: 2
  },

  // Resources
  resources: {
    flexDirection: 'row',
    gap: gameScale(10),
    width: '35%',
    justifyContent: 'flex-end',
    paddingRight: gameScale(5),
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gameScale(2),
  },
  resourceText: {
    color: '#ffffffff',
    fontSize: gameScale(12),
    fontFamily: 'Poppins',
  },
  headerIcons: {
  flexDirection: 'row',
  width: '10%',
  justifyContent: 'flex-end',
  },
  iconButton: {
  padding: gameScale(5),
  },
})