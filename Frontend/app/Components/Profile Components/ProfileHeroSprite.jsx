import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import ReanimatedAnimated from 'react-native-reanimated';
import { gameScale } from '../Responsiveness/gameResponsive';

const ProfileHeroSprite = ({ hero }) => {
  console.log(`🦸‍♂️ ProfileHeroSprite using image URL: ${hero.character_image_display}`);

  const SPRITE_COLUMNS = 8;
  const SPRITE_ROWS = 6;
  const TOTAL_FRAMES = 48;
  const FRAME_DURATION = 40; 
  const spriteSize = gameScale(150);

  const frameIndex = useSharedValue(0);

  React.useEffect(() => {
    cancelAnimation(frameIndex);

    frameIndex.value = withRepeat(
      withTiming(TOTAL_FRAMES - 1, {
        duration: FRAME_DURATION * TOTAL_FRAMES,
        easing: Easing.linear,
      }),
      -1,
      false
    );
    return () => cancelAnimation(frameIndex);
  }, [hero]);

  const spriteAnimatedStyle = useAnimatedStyle(() => {
    const currentFrame = Math.floor(frameIndex.value) % TOTAL_FRAMES;
    const column = currentFrame % SPRITE_COLUMNS;
    const row = Math.floor(currentFrame / SPRITE_COLUMNS);
    
    const xOffset = -(column * spriteSize);
    const yOffset = -(row * spriteSize);
    
    return {
      transform: [{ translateX: xOffset }, { translateY: yOffset }],
    };
  }, [spriteSize]);

  if (!hero?.character_image_display) {
    return <View style={styles.heroSpriteContainer} />;
  }

  return (
    <View style={styles.heroSpriteContainer}>
      <ReanimatedAnimated.View style={[styles.heroSpriteSheet, spriteAnimatedStyle]}>
        <Image
          source={{ uri: hero.character_image_display }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="stretch"
        />
      </ReanimatedAnimated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  heroSpriteContainer: {
    width: gameScale(150), 
    height: gameScale(150),
    overflow: 'hidden',
  },
  heroSpriteSheet: {
    width: gameScale(150) * 8, 
    height: gameScale(150) * 6,
  },
});

export default ProfileHeroSprite;