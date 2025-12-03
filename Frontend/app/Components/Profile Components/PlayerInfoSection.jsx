import React from "react";
import { View, Text, ImageBackground, StyleSheet } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { gameScale } from "../Responsiveness/gameResponsive";

const PlayerInfoSection = ({ playerName, username, selectedBadge, playerLevel, expPoints }) => {
  const calculateLevelProgress = () => {
    const currentLevel = playerLevel || 1;
    const currentExp = expPoints || 0;
    
    // Formula: 100 * currentLevel^1.5 for NEXT level
    const nextLevelExp = Math.floor(100 * Math.pow(currentLevel, 1.5));
    
    // Calculate progress percentage toward next level
    const progress = Math.min((currentExp / nextLevelExp) * 100, 100);
    
    return {
      currentLevel,
      currentExp: currentExp, 
      nextLevelExp: nextLevelExp,
      progress: Math.max(0, progress) 
    };
  };

  const levelData = calculateLevelProgress();

  return (
    <View style={styles.container}>
      {selectedBadge?.landscape_image ? (
        <ImageBackground
          source={{ uri: selectedBadge.landscape_image }}
          style={styles.coverBackground}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.08)', 'transparent', 'rgba(0, 0, 0, 0.07)']}
            style={styles.coverOverlay}
          />
          
          <View style={styles.badgeNameTop}>
            <Text style={styles.badgeNameText}>
              {selectedBadge.achievement_name}
            </Text>
          </View>
          
          {/* Player Info Content - Positioned at Bottom */}
          <View style={styles.playerInfoContent}>
            <Text style={styles.username}>{username}</Text>
            
            <View style={styles.lifeContainer}>
              <View style={styles.levelBadgeContainer}>
                <View style={styles.levelBadgeLayer1}>
                  <View style={styles.levelBadgeLayer2}>
                    <View style={styles.levelBadgeLayer3}>
                      <LinearGradient
                        colors={['#045262ff', '#045262ff']}
                        style={styles.levelBadgeGradient}
                      >
                        <Text style={styles.levelText}>{levelData.currentLevel}</Text>
                      </LinearGradient>
                    </View>
                  </View>
                </View>
              </View>
              
              {/* XP Progress Bar */}
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
                        {levelData.currentExp} / {levelData.nextLevelExp} XP
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ImageBackground>
      ) : (
        <LinearGradient
          colors={['#0a192f', '#1c2e4a', '#0a192f']}
          style={styles.fallbackBackground}
        >
          <View style={styles.badgeNameTop}>
            <Text style={[styles.badgeNameText, styles.noBadgeText]}>
              No Badge Selected
            </Text>
          </View>
          
          <View style={styles.playerInfoContent}>
            <Text style={styles.playerName}>{playerName}</Text>
            <Text style={styles.username}>{username}</Text>
            
            <View style={styles.lifeContainer}>
              <View style={styles.levelBadgeContainer}>
                <View style={styles.levelBadgeLayer1}>
                  <View style={styles.levelBadgeLayer2}>
                    <View style={styles.levelBadgeLayer3}>
                      <LinearGradient
                        colors={['#065f7aff', '#048888ff']}
                        style={styles.levelBadgeGradient}
                      >
                        <Text style={styles.levelText}>{levelData.currentLevel}</Text>
                      </LinearGradient>
                    </View>
                  </View>
                </View>
              </View>
              
              <View style={styles.xpBarLayer1}>
                <View style={styles.xpBarLayer2}>
                  <View style={styles.xpBarLayer3}>
                    <LinearGradient
                      colors={['#4CAF50', '#8BC34A']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[
                        styles.xpBarFill,
                        { width: `${levelData.progress}%` }
                      ]}
                    />
                    
                    <View style={styles.xpTextContainer}>
                      <Text style={styles.xpText}>
                        {levelData.currentExp} / {levelData.nextLevelExp} XP
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: gameScale(220),
    marginBottom: gameScale(30),
    borderRadius: gameScale(12),
    overflow: 'hidden',
    borderWidth: gameScale(2),
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  coverBackground: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  fallbackBackground: {
    width: '100%',
    height: '100%',
  },
  
  badgeNameTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: gameScale(15),
    maxWidth: gameScale(300),
  },
   badgeNameText: {
    marginLeft: gameScale(10),
    fontSize: gameScale(50),
    fontFamily: 'Grobold',
    color: '#ffffffff',
    textShadowColor: '#797308ff',
    textShadowOffset: { width: 2, height: 0},
    textShadowRadius: 1,
    flexWrap: 'wrap',
    maxWidth: gameScale(500),
  },
  noBadgeText: {
    fontSize: gameScale(20),
    color: '#888888',
  },
  
  playerInfoContent: {
    position: 'absolute',
    bottom: gameScale(2),
    left: 0,
    right: 0,
    paddingBottom: gameScale(16),
    paddingLeft: gameScale(10),
  },
  username: {
    fontSize: gameScale(13),
    marginLeft: gameScale(38),
    alignSelf: 'flex-start',
    marginBottom: gameScale(-14),
    fontFamily: 'DynaPuff',
    color: '#ffffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  
  lifeContainer: {
    marginTop: gameScale(12),
    position: 'relative',
  },

  levelBadgeContainer: {
    position: 'absolute',
    left: 0,
    top: -gameScale(9),
    zIndex: 20,
  },

  levelBadgeLayer1: {
    width: gameScale(40),
    height: gameScale(40),
    borderRadius: gameScale(50),
    backgroundColor: '#ffffffff',
    padding: gameScale(2),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },

  levelBadgeLayer2: {
    width: '100%',
    height: '100%',
    borderRadius: gameScale(50),
    backgroundColor: '#2a2a2a',
    padding: gameScale(2),
    borderWidth: gameScale(1),
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomColor: 'rgba(0, 0, 0, 0.3)',
    borderRightColor: 'rgba(0, 0, 0, 0.3)',
  },

  levelBadgeLayer3: {
    width: '100%',
    height: '100%',
    borderRadius: gameScale(50),
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
    borderWidth: gameScale(1),
    borderColor: 'rgba(0, 0, 0, 0.4)',
  },

  levelBadgeGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: gameScale(50),
  },

  levelText: {
    fontSize: gameScale(20),
    fontFamily: 'MusicVibes',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: gameScale(1), height: gameScale(1) },
    textShadowRadius: gameScale(3),
  },

  // XP Progress Bar Styles
  xpBarLayer1: {
    height: gameScale(22),
    width: '40%',
    backgroundColor: '#000000ff',
    borderRadius: gameScale(20),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },

  xpBarLayer2: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffffff',
    borderRadius: gameScale(18),
    padding: gameScale(2),
    borderWidth: gameScale(1),
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomColor: 'rgba(0, 0, 0, 0.3)',
    borderRightColor: 'rgba(0, 0, 0, 0.3)',
  },

  xpBarLayer3: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 1)',
    borderRadius: gameScale(16),
    overflow: 'hidden',
    borderWidth: gameScale(1),
    borderColor: 'rgba(0, 0, 0, 0.4)',
    position: 'relative',
  },

  xpBarFill: {
    height: '100%',
    borderRadius: gameScale(16),
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },

  xpTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },

  xpText: {
    fontSize: gameScale(10),
    fontFamily: 'DynaPuff',
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: gameScale(1), height: gameScale(1) },
    textShadowRadius: gameScale(2),
  },
});

export default PlayerInfoSection;