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

const DogCharacter = ({ isPaused }) => {
  const frameIndex = useSharedValue(0);
  
  // Animation configuration for 23 frames
  const TOTAL_FRAMES = 24;
  const FRAME_DURATION = 45; 

  useEffect(() => {
    if (!isPaused) {
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
    const frameWidth = 100; // Reduced from 120 to 80 (makes dog even smaller)
    const frameHeight = 100; // Reduced from 120 to 80 (makes dog even smaller)
    
    const column = currentFrame % COLUMNS;
    const row = Math.floor(currentFrame / COLUMNS);
    
    const xOffset = -(column * frameWidth);
    const yOffset = -(row * frameHeight);
    
    return {
      transform: [
        { translateX: xOffset },
        { translateY: yOffset }
      ],
    };
  });

  return (
    <View style={[styles.dogRun, isPaused && styles.pausedElement]}>
      <View style={styles.spriteContainer}>
        <Animated.View style={[styles.spriteSheet, animatedStyle]}>
          <Image
            source={{uri: 'https://github.com/user-attachments/assets/297cf050-8708-4fd2-90db-5609b20ce599'}}
            style={styles.spriteImage}
            contentFit="contain"
          />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dogRun: {
    position: 'absolute',
     left: SCREEN_WIDTH * 0.01,
    top: SCREEN_HEIGHT * 0.17,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  
  spriteContainer: {
    width: 100, // Reduced from 120 to 100 (visible frame size)
    height: 100, // Reduced from 120 to 100 (visible frame size)
    overflow: 'hidden',
  },
  
  spriteSheet: {
    width: 600, // 6 columns × 100px = 600px (reduced from 720)
    height: 400, // 4 rows × 100px = 400px (reduced from 480)
  },
  
  spriteImage: {
    width: '100%',
    height: '100%',
  },
  
  pausedElement: {
    opacity: 0.6,
  },
});

export default DogCharacter;