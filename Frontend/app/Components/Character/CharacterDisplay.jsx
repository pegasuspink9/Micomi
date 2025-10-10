import React, { useRef, useEffect, useMemo } from 'react';
import { View, Image, Animated } from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import ReanimatedAnimated from 'react-native-reanimated'; 

export default function CharacterDisplay({ 
  currentHero, 
  selectedHero, 
  isCharacterAnimating,
  onAnimationFinish,
  styles 
}) {
  const imageOpacity = useRef(new Animated.Value(0)).current;
  const entranceOpacity = useRef(new Animated.Value(0)).current;

  const frameIndex = useSharedValue(0);
  const animationStarted = useRef(false);

  const SPRITE_COLUMNS = 8;
  const SPRITE_ROWS = 6;
  const TOTAL_FRAMES = 48;
  const FRAME_DURATION = 40; 

  const spriteSize = useMemo(() => {
    return styles.characterImage?.width || styles.characterImage?.height || 300;
  }, [styles.characterImage]);

  useEffect(() => {
    cancelAnimation(frameIndex);
    animationStarted.current = false;
    
    imageOpacity.setValue(0);
    entranceOpacity.setValue(0);
    frameIndex.value = 0;

    Animated.timing(entranceOpacity, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(imageOpacity, { 
        toValue: 1, 
        duration: 500, 
        useNativeDriver: true 
      }).start(() => {
        onAnimationFinish();
        
        if (!animationStarted.current) {
          animationStarted.current = true;
          frameIndex.value = withRepeat(
            withTiming(TOTAL_FRAMES - 1, {
              duration: FRAME_DURATION * TOTAL_FRAMES,
              easing: Easing.linear,
            }),
            -1,
            true
          );
        }
      });
    });

    return () => {
      cancelAnimation(frameIndex);
      animationStarted.current = false;
    };
  }, [selectedHero, currentHero?.character_id]); 

  const spriteAnimatedStyle = useAnimatedStyle(() => {
    const currentFrame = Math.floor(frameIndex.value) % TOTAL_FRAMES;
    
    const column = currentFrame % SPRITE_COLUMNS;
    const row = Math.floor(currentFrame / SPRITE_COLUMNS);
    
    const xOffset = -(column * spriteSize);
    const yOffset = -(row * spriteSize);
    
    return {
      transform: [{ translateX: xOffset }, { translateY: yOffset }],
    };
  }, [spriteSize, SPRITE_COLUMNS]);

  // Don't render if no hero data
  if (!currentHero?.character_image_display) {
    return <View style={styles.characterDisplay} />;
  }

  return (
    <View style={styles.characterDisplay}>
      <Animated.View style={{ 
        position: 'absolute', 
        opacity: Animated.multiply(imageOpacity, entranceOpacity) 
      }}>
        <View style={[
          styles.characterImage, 
          { backgroundColor: 'transparent', overflow: 'hidden' }
        ]}>
          <ReanimatedAnimated.View style={[
            spriteAnimatedStyle,
            {
              width: spriteSize * SPRITE_COLUMNS,
              height: spriteSize * SPRITE_ROWS,
            }
          ]}>
            <Image
              source={{ uri: currentHero.character_image_display }}
              style={{
                width: '100%',
                height: '100%',
              }}
              resizeMode="contain"
            />
          </ReanimatedAnimated.View>
        </View>
      </Animated.View>
    </View>
  );
}