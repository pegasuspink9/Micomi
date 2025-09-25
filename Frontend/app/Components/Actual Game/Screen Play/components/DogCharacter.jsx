import React, { useEffect, useState } from 'react';
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

const DogCharacter = ({ 
  isPaused,
  characterAnimations = {}, 
  currentState = 'idle',
}) => {
  const frameIndex = useSharedValue(0);
  const [currentAnimationUrl, setCurrentAnimationUrl] = useState('');
  
  const TOTAL_FRAMES = 24;
  const FRAME_DURATION = 45; 

  useEffect(() => {
    let animationUrl = '';
    
    switch (currentState) {
      case 'idle':
        animationUrl = characterAnimations.character_idle || characterAnimations.idle;
        break;
      case 'attack':
        animationUrl = characterAnimations.character_attack || characterAnimations.attack;
        break;
      case 'hurt':
        animationUrl = characterAnimations.character_hurt || characterAnimations.hurt;
        break;
      case 'run':
        animationUrl = characterAnimations.character_run || characterAnimations.run;
        break;
      case 'dies':
        animationUrl = characterAnimations.character_dies || characterAnimations.dies;
        break;
      default:
        animationUrl = characterAnimations.character_idle || characterAnimations.idle;
    }
    
    // Fallback to default if no animation found
    if (!animationUrl) {
      animationUrl = 'https://github.com/user-attachments/assets/297cf050-8708-4fd2-90db-5609b20ce599';
    }
    
    setCurrentAnimationUrl(animationUrl);
    console.log(`🐕 DogCharacter state: ${currentState}, using animation: ${animationUrl}`);
  }, [currentState, characterAnimations]);

  useEffect(() => {
    if (!isPaused && currentAnimationUrl) {
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
  }, [isPaused, currentAnimationUrl]);

  const animatedStyle = useAnimatedStyle(() => {
    const currentFrame = Math.floor(frameIndex.value) % TOTAL_FRAMES;
    
    const COLUMNS = 6;
    const frameWidth = 100;
    const frameHeight = 100; 
    
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

  if (!currentAnimationUrl) {
    return null; // Don't render if no animation URL
  }

  return (
    <View style={[styles.dogRun, isPaused && styles.pausedElement]}>
      <View style={styles.spriteContainer}>
        <Animated.View style={[styles.spriteSheet, animatedStyle]}>
          <Image
            source={{ uri: currentAnimationUrl }}
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
    width: 100,
    height: 100,
    overflow: 'hidden',
  },
  
  spriteSheet: {
    width: 600, // 6 columns × 100px = 600px
    height: 400, // 4 rows × 100px = 400px
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