import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { usePlayerProfile } from '../../hooks/usePlayerProfile';
import { useEnergyData } from '../../hooks/useEnergyData';
import { gameScale } from '../Responsiveness/gameResponsive';
import { useRouter } from 'expo-router';
import SettingsModal from '../Settings/SettingsModal';

export default function MapHeader() {
  const router = useRouter(); // Initialize router
  const { playerData, loadPlayerProfile, refreshPlayerData } = usePlayerProfile();
  const { energyStatus } = useEnergyData();
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);

  const formatCompactNumber = (value) => {
    const numericValue = Number(value || 0);

    if (Math.abs(numericValue) >= 1000000) {
      const millions = numericValue / 1000000;
      const roundedMillions = Math.round(millions * 10) / 10;
      return `${Number.isInteger(roundedMillions) ? roundedMillions.toFixed(0) : roundedMillions}M`;
    }

    if (Math.abs(numericValue) >= 1000) {
      const thousands = numericValue / 1000;
      const roundedThousands = Math.round(thousands * 10) / 10;
      return `${Number.isInteger(roundedThousands) ? roundedThousands.toFixed(0) : roundedThousands}K`;
    }

    return numericValue.toLocaleString();
  };

  useFocusEffect(
    useCallback(() => {
      loadPlayerProfile();

      const syncInterval = setInterval(() => {
        refreshPlayerData();
      }, 5000); 

      return () => clearInterval(syncInterval);
    }, [loadPlayerProfile, refreshPlayerData])
  );
  
  const calculateLevelProgress = () => {
    const currentLevel = playerData?.playerLevel || 1;
    const currentExp = playerData?.expPoints || 0;
    const nextLevelExp = playerData?.maxLevelExp || 100;
    
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
  const diamonds = playerData?.diamonds || 0;
  const energyValue = energyStatus
    ? (energyStatus.isInfinite ? '∞' : formatCompactNumber(energyStatus.energy ?? 0))
    : '...';

  const openTopUpShop = (category) => {
    router.push({
      pathname: '/TopUp/topUpShop',
      params: { category },
    });
  };
  
  const avatarUrl = playerData?.playerAvatar || "https://micomi-assets.me/Player%20Avatars/cute-astronaut-playing-vr-game-with-controller-cartoon-vector-icon-illustration-science-technology_138676-13977.avif";

  return (
    <View style={styles.header}>
      {/* Player Section - Wrapped with the new container */}
      <View style={styles.playerInfoWrapper}>
        <View style={styles.playerInfo}>
          
          {/* Avatar Image - Restyled with 3-Layer Borders from Life.jsx */}
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => router.push('/profile')}
            style={styles.avatarBorderOuter}
          >
            <View style={styles.avatarBorderMiddle}>
              <View style={styles.avatarBorderInner}>
                <View style={styles.avatarCircle}>
                  <Image 
                    source={{ uri: avatarUrl }} 
                    style={styles.avatarImage} 
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                </View>
              </View>
            </View>
          </TouchableOpacity>
          
          {/* Column: Name Top, Level+Bar Bottom */}
          <View style={styles.nameAndXpColumn}>
              <Text style={styles.usernameText} numberOfLines={1}>{username}</Text>
              
              <View style={styles.levelAndBarRow}>
                  {/* Mini Level Badge - Restyled and Fixed Display */}
                  <View style={styles.miniBadgeLayer1}>
                      <View style={styles.miniBadgeLayer2}>
                        <View style={styles.miniBadgeLayer3}>
                          <LinearGradient
                            colors={['#1e3a5f', '#152d4a']}
                            style={styles.levelBadgeGradient}
                          >
                            <Text style={styles.miniLevelText}>{levelData.currentLevel || 1}</Text>
                          </LinearGradient>
                        </View>
                      </View>
                  </View>

                  {/* XP Bar - Restyled to match Health Bar from Life.jsx */}
                  <View style={styles.healthBorderOuter}>
                    <View style={styles.healthBorderMiddle}>
                      <View style={styles.healthBorderInner}>
                        <View style={styles.healthBarTrack}>
                          <View 
                            style={[
                              styles.healthBarFillContainer,
                              { width: `${levelData.progress}%` }
                            ]}
                          >
                            <LinearGradient
                              colors={['#4a90d9', '#2d5a87']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={styles.healthBarFill}
                            />
                          </View>
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
        </View>
      </View>
      
      {/* Resources Section (UPDATED with 3-Layer Blue Style) */}
      <View style={styles.resources}>
        
        {/* Coins Capsule */}
        <View style={styles.resourceWrapper}>
          <View style={styles.resourceBorderOuter}>
            <View style={styles.resourceBorderMiddle}>
              <View style={styles.resourceBorderInner}>
                <View style={styles.resourceTrack}>
                  <Text style={styles.resourceText}>{formatCompactNumber(coins)}</Text>
                  {/* Moved TouchableOpacity inside resourceTrack to keep display the same */}
                  <TouchableOpacity activeOpacity={0.8} onPress={() => openTopUpShop('coins')}>
                    <Text style={styles.plusSign}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
          <Image 
            source={require('../icons/coins.png')} 
            style={styles.coinIconAbsolute} 
            contentFit="contain"
            cachePolicy="memory-disk"
          />
        </View>

        {/* Diamonds Capsule */}
        <View style={styles.resourceWrapper}>
           <View style={styles.resourceBorderOuter}>
            <View style={styles.resourceBorderMiddle}>
              <View style={styles.resourceBorderInner}>
                <View style={styles.resourceTrack}>
                  <Text style={styles.resourceText}>{formatCompactNumber(diamonds)}</Text>
                  {/* Moved TouchableOpacity inside resourceTrack to keep display the same */}
                  <TouchableOpacity activeOpacity={0.8} onPress={() => openTopUpShop('diamonds')}>
                    <Text style={styles.plusSign}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
          <Image
            source={require('../icons/diamonds.png')}
            style={styles.energyIconAbsolute}
            contentFit="contain"
            cachePolicy="memory-disk"
          />
        </View>

        {/* Energy Capsule */}
        <View style={styles.resourceWrapper}>
           <View style={styles.resourceBorderOuter}>
            <View style={styles.resourceBorderMiddle}>
              <View style={styles.resourceBorderInner}>
                <View style={styles.resourceTrack}>
                  <Text style={styles.resourceText}>{energyValue}</Text>
                  {/* Moved TouchableOpacity inside resourceTrack to keep display the same */}
                  <TouchableOpacity activeOpacity={0.8} onPress={() => openTopUpShop('energy')}>
                    <Text style={styles.plusSign}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
          <Image 
            source={require('../icons/energy.png')} 
            style={styles.energyIconAbsolute} 
            contentFit="contain"
            cachePolicy="memory-disk"
          />
        </View>

      </View>

      {/* Settings Icon */}
      <View style={styles.headerIcons}>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => setIsSettingsModalVisible(true)}
        >
          <Ionicons name="settings" size={gameScale(24)} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Settings Modal */}
      <SettingsModal 
        visible={isSettingsModalVisible}
        onClose={() => setIsSettingsModalVisible(false)}
      />
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
  // Added the new wrapper with margin
  playerInfoWrapper: {
    marginLeft: gameScale(-15),
    width: '40%', // Width moved from playerInfo to wrapper
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%', // Take up full width of the wrapper
    gap: gameScale(5),
  },
  
  // Avatar Styles
  avatarBorderOuter: {
    width: gameScale(46),
    height: gameScale(46),
    borderRadius: gameScale(50),
    backgroundColor: '#1e3a5f',
    borderTopColor: '#0d1f33',
    borderLeftColor: '#0d1f33',
    borderBottomColor: '#2d5a87',
    borderRightColor: '#2d5a87',
    borderWidth: gameScale(1),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: gameScale(2) },
    shadowOpacity: 0.3,
    shadowRadius: gameScale(4),
    elevation: gameScale(4),
  },
  avatarBorderMiddle: {
    flex: 1,
    borderRadius: gameScale(50),
    backgroundColor: '#152d4a',
    borderTopColor: '#4a90d9',
    borderLeftColor: '#4a90d9',
    borderBottomColor: '#0a1929',
    borderRightColor: '#0a1929',
    borderWidth: gameScale(1),
  },
  avatarBorderInner: {
    flex: 1,
    borderRadius: gameScale(50),
    backgroundColor: 'rgba(74, 144, 217, 0.15)',
    borderColor: 'rgba(74, 144, 217, 0.3)',
    borderWidth: gameScale(1),
    overflow: 'hidden',
  },
  avatarCircle: {
    flex: 1,
    backgroundColor: '#15293d',
    borderRadius: gameScale(50),
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },

  nameAndXpColumn: {
    marginTop: gameScale(-6),
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    marginLeft: gameScale(-9), 
  },
   usernameText: {
    color: '#fff',
    fontSize: gameScale(11), 
    fontFamily: 'DynaPuff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginLeft: gameScale(10), 
  },
  
  levelAndBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: gameScale(0), // Adjusted slightly for balance
    marginLeft: gameScale(4),
  },

  // --- Mini Level Badge Style (SHRUNK) ---
  miniBadgeLayer1: {
    width: gameScale(25), // Shrunk from 28
    height: gameScale(25), // Shrunk from 28
    borderRadius: gameScale(10), // Adjusted for new width/height
    backgroundColor: '#1e3a5f',
    padding: gameScale(1.5), // Slightly smaller padding
    borderWidth: gameScale(1),
    borderColor: '#0d1f33',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    elevation: 10, 
    zIndex: 10,    
  },
  miniBadgeLayer2: {
    flex: 1,
    borderRadius: gameScale(10),
    backgroundColor: '#152d4a',
    borderWidth: gameScale(0.5), // Thinner border
    borderColor: '#4a90d9',
  },
  miniBadgeLayer3: {
    flex: 1,
    borderRadius: gameScale(10),
    overflow: 'visible', 
  },
  levelBadgeGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: gameScale(10),
  },
  miniLevelText: {
    fontSize: gameScale(12), // Shrunk from 12
    fontFamily: 'DynaPuff',
    color: '#ffffff',
    textAlign: 'center',
    textAlignVertical: 'center', 
    includeFontPadding: false, 
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },

  // --- XP Bar Style (SHRUNK) ---
  healthBorderOuter: {
    width: gameScale(67), // Shrunk from 86
    borderRadius: gameScale(8), // Reduced radii
    borderWidth: gameScale(1),
    backgroundColor: '#1e3a5f',
    borderTopColor: '#0d1f33',
    borderLeftColor: '#0d1f33',
    borderBottomColor: '#2d5a87',
    borderRightColor: '#2d5a87',
    marginLeft: gameScale(-8), // Adjusted tuck behind smaller badge (was -18)
    zIndex: 1,
  },
  healthBorderMiddle: {
    borderRadius: gameScale(8), 
    borderWidth: gameScale(1),
    backgroundColor: '#152d4a',
    borderTopColor: '#4a90d9',
    borderLeftColor: '#4a90d9',
    borderBottomColor: '#0a1929',
    borderRightColor: '#0a1929',
  },
  healthBorderInner: {
    borderRadius: gameScale(5),
    backgroundColor: 'rgba(74, 144, 217, 0.15)',
    borderColor: 'rgba(74, 144, 217, 0.3)',
    borderWidth: gameScale(0.5),
    overflow: 'hidden',
  },
  healthBarTrack: {
    height: gameScale(14), // Shrunk from 14
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: gameScale(4),
    position: 'relative',
    overflow: 'hidden',
  },
  healthBarFillContainer: {
    height: '100%',
    borderRadius: gameScale(4),
    overflow: 'hidden',
  },
  healthBarFill: {
    flex: 1,
    borderRadius: gameScale(4),
  },

  xpTextContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
    paddingLeft: gameScale(4), // Accounts for tuck margin slightly
  },
  xpText: {
    fontSize: gameScale(8), // Shrunk slightly to fit smaller bar (was 8)
    fontFamily: 'DynaPuff',
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 1)',
    textShadowRadius: 2
  },

  // --- NEW RESOURCE STYLES ---
  resources: {
    flexDirection: 'row',
    gap: gameScale(5), 
    width: '60%', 
    justifyContent: 'flex-end',
    paddingRight: gameScale(5),
  },
  resourceWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    height: gameScale(30), 
  },
  resourceBorderOuter: {
    borderRadius: gameScale(15),
    borderWidth: gameScale(1),
    backgroundColor: '#1e3a5f',
    borderTopColor: '#0d1f33',
    borderLeftColor: '#0d1f33',
    borderBottomColor: '#2d5a87',
    borderRightColor: '#2d5a87',
  },
  resourceBorderMiddle: {
    borderRadius: gameScale(13),
    borderWidth: gameScale(1),
    backgroundColor: '#152d4a',
    borderTopColor: '#4a90d9',
    borderLeftColor: '#4a90d9',
    borderBottomColor: '#0a1929',
    borderRightColor: '#0a1929',
  },
  resourceBorderInner: {
    borderRadius: gameScale(11),
    backgroundColor: 'rgba(74, 144, 217, 0.15)',
    borderColor: 'rgba(74, 144, 217, 0.3)',
    borderWidth: gameScale(0.5),
    overflow: 'hidden',
  },
  resourceTrack: {
    height: gameScale(20),
    flexDirection: 'row', // Added to line up text and + sign horizontally
    alignItems: 'center', // Centers vertically
    paddingLeft: gameScale(24), 
    paddingRight: gameScale(8), // Lowered slightly to make room for the + sign
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  resourceText: {
    color: '#ffffff',
    fontSize: gameScale(11),
    fontFamily: 'DynaPuff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  // Added standard style for the + Sign
  plusSign: {
    color: '#FFD700', // Yellow
    fontSize: gameScale(20),
    fontFamily: 'DynaPuff',
    marginLeft: gameScale(4), // Adds space between the number and the +
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginTop: gameScale(-2),
    includeFontPadding: false, // Helps perfectly center it vertically
  },
  coinIconAbsolute: {
    position: 'absolute',
    left: gameScale(-5), 
    width: gameScale(30),
    height: gameScale(30),
    zIndex: 10, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
  },
  energyIconAbsolute: {
    position: 'absolute',
    left: gameScale(-5),
    width: gameScale(30),
    height: gameScale(30),
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
  },

  headerIcons: {
    flexDirection: 'row',
    width: '7%'
  },
  iconButton: {
  },
});