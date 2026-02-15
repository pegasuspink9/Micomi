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
import { hp } from '../../../Responsiveness/gameResponsive';
import { gameScale } from '../../../Responsiveness/gameResponsive';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const GameBackground = ({ children, isPaused, combatBackground }) => {
  const frameIndex = useSharedValue(0);
  
  const SPRITE_URL = combatBackground && Array.isArray(combatBackground) && combatBackground.length > 0 
  ? combatBackground[0] 
  : 'https://res.cloudinary.com/dpbocuozx/image/upload/v1759480324/test_zs60s2.png';
  const COLUMNS = 5; 
  const ROWS = 4;   
  const TOTAL_FRAMES = COLUMNS * ROWS; 
  const FRAME_DURATION = 50;
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
  
  const column = currentFrame % COLUMNS;
  const row = Math.floor(currentFrame / COLUMNS);
  
  const frameWidthPercent = 100 / COLUMNS; 
  const frameHeightPercent = 100 / ROWS;   
  
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
          cachePolicy="memory-disk"
          priority="high"
        />
      </Animated.View>
    </View>
    
    {/*  Overlay for pause effect */}
    {isPaused && <View style={styles.pauseOverlay} />}
    
    {/*  Children content */}
    <View style={styles.contentContainer}>
      {children}
    </View>
  </View>
);
};

const styles = StyleSheet.create({
   container: {
    backgroundColor: 'transparent', 
    position: 'relative',
    overflow: 'hidden',
    // ✅ FIXED: Using gameScale for a consistent height based on the base design.
    minHeight: gameScale(287), 
  },
  
  spriteContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden', 
    minHeight: gameScale(287),
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
    zIndex: 2,
  },
  
  contentContainer: {
    position: 'relative',
    zIndex: 3, // Above everything
    minHeight: hp(34),
  },
  
});

export default GameBackground;