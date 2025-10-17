import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, Animated, Pressable, Modal } from 'react-native'; // ✅ Add Modal import
import { WebView } from 'react-native-webview';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BossLevelModal = ({ bossData, opacityAnim, bounceAnim, glowAnim }) => {
  const [showWebView, setShowWebView] = useState(false); // ✅ Add state for WebView

  if (!bossData) return null;

  // ✅ Add glow interpolation to match enemy animation
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
              const radiusOffset = Math.abs(distanceFromCenter) * 2;
              
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
            source={{ uri: bossData.enemy_avatar }}
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
              const radiusOffset = Math.abs(distanceFromCenter) * 8;
              
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
    marginTop: SCREEN_WIDTH * 0.07,
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
    height: SCREEN_WIDTH * 0.12,
  },

  curvedEnemyFoundContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },

  curvedEnemyFoundCharacter: {
    fontSize: SCREEN_WIDTH * 0.03,
    color: '#ff4500', // Boss orange
    fontFamily: 'DoongaSlash',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginHorizontal: 2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  enemyNameContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: SCREEN_WIDTH * 0.17,
    marginBottom: SCREEN_WIDTH * 0.03,
  },

  curvedTextContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  curvedCharacter: {
    fontSize: SCREEN_WIDTH * 0.07,
    color: '#ffffffff',
    fontFamily: 'MusicVibes',
    textAlign: 'center',
    textShadowColor: 'rgba(4, 4, 4, 0.9)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginHorizontal: 0.70,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  avatarFrame: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },

  enemyAvatar: {
    width: SCREEN_WIDTH * 0.28,
    height: SCREEN_WIDTH * 0.28,
    borderRadius: SCREEN_WIDTH * 0.15,
    borderWidth: 4,
    borderColor: 'rgba(0, 0, 0, 1)',
    shadowColor: 'rgba(255, 69, 0, 1)', // Boss red glow
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 20,
  },

  enemyAvatarGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: SCREEN_WIDTH * 0.3 + 10,
    height: SCREEN_WIDTH * 0.3 + 10,
    borderRadius: (SCREEN_WIDTH * 0.3 + 16) / 2,
    backgroundColor: 'rgba(92, 0, 0, 1)', 
    borderColor: 'rgba(139, 0, 0, 1)', 
    borderWidth: 12,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 25,
    zIndex: -1,
  },
  
});

export default BossLevelModal;