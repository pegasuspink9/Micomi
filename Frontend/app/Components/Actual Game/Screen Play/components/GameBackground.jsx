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

const GameBackground = ({ children, isPaused, combatBackground, characterName, characterAttackType, isPvpMode = false }) => {
  const frameIndex = useSharedValue(0);
  const darkOverlayOpacity = useSharedValue(0);
  const activeOverlayColor = useSharedValue('#e71212'); 

  const specialColors = {
    'Gino': '#000000',   
    'Leon': '#d30606',     
    'ShiShi': '#004d66', 
    'Ryron': '#66004d',     
  };

  const overlayColor = specialColors[characterName] || '#000000';

  
  const SPRITE_URL = combatBackground && Array.isArray(combatBackground) && combatBackground.length > 0 
  ? combatBackground[0] 
  : 'https://res.cloudinary.com/dpbocuozx/image/upload/v1759480324/test_zs60s2.png';
  const COLUMNS = 5; 
  const ROWS = 4;   
  const TOTAL_FRAMES = COLUMNS * ROWS; 
  const FRAME_DURATION = 50;
  const TOTAL_ANIMATION_DURATION = FRAME_DURATION * TOTAL_FRAMES;

  useEffect(() => {
    const shouldShowSpecial = characterAttackType === 'special_attack';
    
    if (shouldShowSpecial) {
      activeOverlayColor.value = specialColors[characterName] || '#000000';

      darkOverlayOpacity.value = withTiming(0.75, { duration: 400 });

      const timer = setTimeout(() => {
        darkOverlayOpacity.value = withTiming(0, { duration: 1000 });
      }, 2500);

      return () => clearTimeout(timer);
    } else {
      darkOverlayOpacity.value = withTiming(0, { duration: 600 });
    }
  }, [characterAttackType, characterName]); 


  useEffect(() => {
    // In PvP mode we display a normal (static) background image, so skip sprite animation.
    if (isPvpMode) {
      cancelAnimation(frameIndex);
      return;
    }

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
  }, [isPaused, TOTAL_FRAMES, TOTAL_ANIMATION_DURATION, isPvpMode]);

const animatedSpriteStyle = useAnimatedStyle(() => {
  const currentFrame = Math.floor(frameIndex.value) % TOTAL_FRAMES;
  
  const column = currentFrame % COLUMNS;
  const row = Math.floor(currentFrame / COLUMNS);
  
  const frameWidthPercent = 100 / COLUMNS; 
  const frameHeightPercent = 100 / ROWS;   
  
  const xOffset = -(column * frameWidthPercent);
  const yOffset = -(row * frameHeightPercent);
  
  return {
    width: `${COLUMNS * 100}%`,  // 500%
    height: `${ROWS * 100}%`,    // 400%
    transform: [
      { translateX: `${xOffset}%` },
      { translateY: `${yOffset}%` }
    ],
  };
}, []);


const darkOverlayStyle = useAnimatedStyle(() => ({
  opacity: darkOverlayOpacity.value,
  backgroundColor: activeOverlayColor.value,
}));



return (
  <View style={[styles.container, isPaused && styles.pausedBackground]}>
      <View style={styles.spriteContainer}>
        {isPvpMode ? (
          <Image
            source={{ uri: SPRITE_URL }}
            style={styles.spriteImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            priority="high"
          />
        ) : (
          <Animated.View style={[animatedSpriteStyle]}>
            <Image
              source={{ uri: SPRITE_URL }}
              style={styles.spriteImage}
              contentFit="fill"
              cachePolicy="memory-disk"
              priority="high"
            />
          </Animated.View>
        )}
      </View>

    {/* Special Skill Dark Overlay */}
    <Animated.View style={[styles.darkOverlay, darkOverlayStyle]} pointerEvents="none" />
    
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

  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 1, 
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