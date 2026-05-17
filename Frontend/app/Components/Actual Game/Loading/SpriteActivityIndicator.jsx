import React, { useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';

const SPRITE_COLUMNS = 4;
const SPRITE_ROWS = 2;
const TOTAL_FRAMES = SPRITE_COLUMNS * SPRITE_ROWS; // 8 frames
const FRAME_DURATION = 120; // ms per frame

/**
 * SpriteActivityIndicator
 * 
 * A custom ActivityIndicator replacement using the animated robot sprite sheet.
 * Drop-in replacement for React Native's ActivityIndicator.
 * 
 * Props:
 *  - size: number (frame size in pixels, default 60)
 *  - style: additional container styles
 */
const SpriteActivityIndicator = ({ size = 100, style }) => {
  const frameIndex = useSharedValue(0);

  useEffect(() => {
    frameIndex.value = withRepeat(
      withTiming(TOTAL_FRAMES - 1, {
        duration: TOTAL_FRAMES * FRAME_DURATION,
        easing: Easing.linear,
      }),
      -1,  // infinite loop
      false // don't reverse
    );

    return () => cancelAnimation(frameIndex);
  }, []);

  const spriteSheetStyle = useAnimatedStyle(() => {
    const index = Math.floor(frameIndex.value);
    const col = index % SPRITE_COLUMNS;
    const row = Math.floor(index / SPRITE_COLUMNS);
    return {
      transform: [
        { translateX: -col * size },
        { translateY: -row * size },
      ],
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Reanimated.View
        style={[
          {
            width: size * SPRITE_COLUMNS,
            height: size * SPRITE_ROWS,
          },
          spriteSheetStyle,
        ]}
      >
        <Image
          source={require('./ActivityIndicator Loading.png')}
          style={styles.spriteImage}
          resizeMode="stretch"
        />
      </Reanimated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  spriteImage: {
    width: '100%',
    height: '100%',
  },
});

export default React.memo(SpriteActivityIndicator);
