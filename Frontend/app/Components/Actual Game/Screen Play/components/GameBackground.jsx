import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const GameBackground = ({ children, isPaused }) => {
  const frameIndex = useSharedValue(0);
  
  const SPRITE_URL = 'https://res.cloudinary.com/dpbocuozx/image/upload/v1759480324/test_zs60s2.png';
  const COLUMNS = 5; 
  const ROWS = 4;   
  const TOTAL_FRAMES = COLUMNS * ROWS; 
  const FRAME_DURATION = 100; // milliseconds per frame
  const TOTAL_ANIMATION_DURATION = FRAME_DURATION * TOTAL_FRAMES;

  useEffect(() => {
    if (!isPaused) {
      frameIndex.value = withRepeat(
        withTiming(TOTAL_FRAMES - 1, {
          duration: TOTAL_ANIMATION_DURATION,
          easing: Easing.linear,
        }),
        -1, 
        true
      );
    } else {
      // Pause animation
      cancelAnimation(frameIndex);
    }

    return () => {
      cancelAnimation(frameIndex);
    };
  }, [isPaused, TOTAL_FRAMES, TOTAL_ANIMATION_DURATION]);

const animatedSpriteStyle = useAnimatedStyle(() => {
  const currentFrame = Math.floor(frameIndex.value) % TOTAL_FRAMES;
  
  // Calculate which frame to show (column and row)
  const column = currentFrame % COLUMNS;
  const row = Math.floor(currentFrame / COLUMNS);
  
  const frameWidthPercent = 100 / COLUMNS; // 20% per frame
  const frameHeightPercent = 100 / ROWS;   // 25% per frame
  
  // ✅ Position the sprite sheet so only the current frame is visible
  const xOffset = -(column * frameWidthPercent);
  const yOffset = -(row * frameHeightPercent);
  
  return {
    // ✅ Scale the sprite sheet to be exactly COLUMNS × ROWS times larger
    width: `${COLUMNS * 100}%`,  // 500%
    height: `${ROWS * 100}%`,    // 400%
    transform: [
      { translateX: `${xOffset}%` },
      { translateY: `${yOffset}%` }
    ],
  };
}, []);

return (
  <View style={[styles.container, isPaused && styles.pausedBackground]}>
    {/* ✅ Sprite sheet background */}
    <View style={styles.spriteContainer}>
      <Animated.View style={[animatedSpriteStyle]}>
        <Image
          source={{ uri: SPRITE_URL }}
          style={styles.spriteImage}
          contentFit="fill" 
          cachePolicy="disk"
        />
      </Animated.View>
    </View>
    
    {/* ✅ Overlay for pause effect */}
    {isPaused && <View style={styles.pauseOverlay} />}
    
    {/* ✅ Children content */}
    <View style={styles.contentContainer}>
      {children}
    </View>
  </View>
);
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ff6b6b',
    position: 'relative',
    overflow: 'hidden',
    minHeight: SCREEN_HEIGHT * 0.34, 
  },
  
  spriteContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden', 
  },
  
  
  spriteImage: {
    width: '100%',
    height: '100%',
  },
  
  pauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(212, 84, 77, 0.5)', 
    zIndex: 1,
  },
  
  contentContainer: {
    position: 'relative',
    zIndex: 2,
    minHeight: SCREEN_HEIGHT * 0.34,
  },
  
});

export default GameBackground;