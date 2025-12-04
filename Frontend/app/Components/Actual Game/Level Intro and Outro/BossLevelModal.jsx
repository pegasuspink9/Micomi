import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, Animated, Pressable, Modal } from 'react-native';
import { WebView } from 'react-native-webview';
import { gameScale } from '../../Responsiveness/gameResponsive';
import { universalAssetPreloader } from '../../../services/preloader/universalAssetPreloader';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BossLevelModal = ({ bossData, opacityAnim, bounceAnim, glowAnim }) => {
  const [showWebView, setShowWebView] = useState(false);

  // NEW: Get cached avatar URL
  const cachedBossAvatar = useMemo(() => {
    if (!bossData?.enemy_avatar) return null;
    
    const cachedPath = universalAssetPreloader.getCachedAssetPath(bossData.enemy_avatar);
    if (cachedPath !== bossData.enemy_avatar) {
      console.log(`📦 BossLevelModal: Using cached boss avatar`);
    }
    return cachedPath;
  }, [bossData?.enemy_avatar]);

  if (!bossData) return null;

  // Add glow interpolation to match enemy animation
  const glowInterpolate = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  return (
    <>
      <Animated.View 
        style={[
          styles.enemyAvatarContainer,
          {
            transform: [
              { scale: bounceAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.29]
              })}
            ]
          }
        ]}
      >
        <View style={styles.enemyFoundContainer}>
          <View style={styles.curvedEnemyFoundContainer}>
            {'Boss Found!'.split('').map((char, index, array) => {
              const totalChars = array.length;
              const centerIndex = (totalChars - 1) / 2;
              const distanceFromCenter = index - centerIndex;
               const maxRotation = -1; 
              const rotationAngle = (distanceFromCenter / centerIndex) * maxRotation;
              const radiusOffset = gameScale(Math.abs(distanceFromCenter) * 2);
              
              return (
                <Animated.Text 
                  key={index}
                  style={[
                    styles.curvedEnemyFoundCharacter,
                    {
                      opacity: glowInterpolate,
                      transform: [
                        { rotate: `${rotationAngle}deg` },
                        { translateY: radiusOffset }
                      ],
                    }
                  ]}
                >
                  {char}
                </Animated.Text>
              );
            })}
          </View>
        </View>

        <View style={styles.avatarFrame}>
          <Animated.Image 
            source={{ uri: cachedBossAvatar }} // Use cached avatar
            style={[
              styles.enemyAvatar,
              {
                opacity: glowInterpolate,
              }
            ]}
            resizeMode="cover"
          />
          <Animated.View 
            style={[
              styles.enemyAvatarGlow,
              {
                opacity: glowInterpolate,
                transform: [
                  { scale: glowInterpolate }
                ]
              }
            ]} 
          />
        </View>

       <View style={styles.enemyNameContainer}>
          <View style={styles.curvedTextContainer}>
            {bossData.enemy_name.split('').map((char, index, array) => {
              const totalChars = array.length;
              const centerIndex = (totalChars - 1) / 2;
              const distanceFromCenter = index - centerIndex;
              const maxRotation = 10;
              const rotationAngle = (distanceFromCenter / centerIndex) * maxRotation;
              const radiusOffset = gameScale(Math.abs(distanceFromCenter) * 8);
              
              return (
                <Animated.Text 
                  key={index}
                  style={[
                    styles.curvedCharacter,
                    {
                      opacity: glowInterpolate,
                      transform: [
                        { rotate: `${rotationAngle}deg` },
                        { translateY: -radiusOffset }
                      ],
                    }
                  ]}
                >
                  {char}
                </Animated.Text>
              );
            })}
          </View>
        </View>

      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  enemyAvatarContainer: {
    alignItems: 'center',
    zIndex: 10,
    marginTop: gameScale(27),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0)', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  enemyFoundContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: gameScale(47),
  },
  curvedEnemyFoundContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  curvedEnemyFoundCharacter: {
    fontSize: gameScale(12),
    color: '#ff4500', // Boss orange
    fontFamily: 'DoongaSlash',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: gameScale(1), height: gameScale(1) },
    textShadowRadius: gameScale(3),
    marginHorizontal: gameScale(2),
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  enemyNameContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: gameScale(66),
    marginBottom: gameScale(12),
  },
  curvedTextContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  curvedCharacter: {
    fontSize: gameScale(27),
    color: '#ffffffff',
    fontFamily: 'MusicVibes',
    textAlign: 'center',
    textShadowColor: 'rgba(4, 4, 4, 0.9)',
    textShadowOffset: { width: gameScale(1), height: gameScale(1) },
    textShadowRadius: gameScale(2),
    marginHorizontal: gameScale(1),
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  avatarFrame: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  enemyAvatar: {
    width: gameScale(109),
    height: gameScale(109),
    borderRadius: gameScale(59),
    borderWidth: gameScale(4),
    borderColor: 'rgba(0, 0, 0, 1)',
    shadowColor: 'rgba(255, 69, 0, 1)', // Boss red glow
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: gameScale(20),
    elevation: 20,
  },
  enemyAvatarGlow: {
    position: 'absolute',
    top: gameScale(-8),
    left: gameScale(-8),
    width: gameScale(127),
    height: gameScale(127),
    borderRadius: gameScale(67),
    backgroundColor: 'rgba(92, 0, 0, 1)', 
    borderColor: 'rgba(139, 0, 0, 1)', 
    borderWidth: gameScale(12),
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: gameScale(25),
    zIndex: -1,
  },
});

export default BossLevelModal;