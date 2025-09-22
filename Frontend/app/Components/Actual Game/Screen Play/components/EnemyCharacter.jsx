import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  cancelAnimation,
} from 'react-native-reanimated';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const EnemyCharacter = ({ isPaused, isAttacking = false }) => {
  const frameIndex = useSharedValue(0);
  
  // Animation configuration - matches your sprite sheet
  const TOTAL_FRAMES = 24;
  const FRAME_DURATION = 60; 

  useEffect(() => {
    if (!isPaused) {
      // Reset and start animation
      frameIndex.value = 0;
      frameIndex.value = withRepeat(
        withTiming(TOTAL_FRAMES - 1, { 
          duration: FRAME_DURATION * TOTAL_FRAMES 
        }),
        -1,
      );
    } else {
      cancelAnimation(frameIndex);
    }
  }, [isPaused]);

  const animatedStyle = useAnimatedStyle(() => {
    const currentFrame = Math.floor(frameIndex.value) % TOTAL_FRAMES;
    
    const COLUMNS = 6; 
    const frameWidth = 120; 
    const frameHeight = 120; 
    
    const column = currentFrame % COLUMNS;
    const row = Math.floor(currentFrame / COLUMNS);
    
    const xOffset = -(column * frameWidth);
    const yOffset = -(row * frameHeight);
    
    return {
      transform: [
        { translateX: xOffset },
        { translateY: yOffset },
      ],
    };
  });

  return (
    <View style={[styles.enemyRun, isPaused && styles.pausedElement]}>
      <View style={styles.spriteContainer}>
        <Animated.View style={[styles.spriteSheet, animatedStyle]}>
          <Image
            source={{uri: 'https://github.com/user-attachments/assets/2afc2f76-9526-430d-81fb-73324baaeaed'}}
            style={[
              styles.spriteImage,
              isAttacking && styles.attackingImage
            ]}
            contentFit="cover"
          />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  enemyRun: {
    position: 'absolute',
    right: SCREEN_WIDTH * 0.01,
    top: SCREEN_HEIGHT * 0.157, 
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  
  spriteContainer: {
    width: 120, 
    height: 120, 
    overflow: 'hidden',
  },
  
  spriteSheet: {
  width: 720, // 6 columns × 130px = 780px
  height: 480, // 4 rows × 130px = 520px
  },
  
  spriteImage: {
    width: '100%',
    height: '100%',
  },

  attackingImage: {
    transform: [{ scale: 1.1 }], // Scale up when attacking
  },
  
  pausedElement: {
    opacity: 0.6,
  },
});

export default EnemyCharacter;