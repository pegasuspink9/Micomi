import React, { useEffect } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
// ✅ REMOVED: LinearGradient is no longer needed.
import { gameScale } from '../Responsiveness/gameResponsive';

import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation
} from 'react-native-reanimated';

const PotionCard = ({ potion }) => {

  const SPRITE_COLUMNS = 6;
  const SPRITE_ROWS = 4;
  const TOTAL_FRAMES = 24;
  const FRAME_DURATION = 40; 
  const FRAME_SIZE = gameScale(100);

  const frameIndex = useSharedValue(0);

  useEffect(() => {
    frameIndex.value = withRepeat(
      withTiming(TOTAL_FRAMES - 1, {
        duration: TOTAL_FRAMES * FRAME_DURATION,
        easing: Easing.linear,
      }),
      -1, // Loop infinitely
      false
    );
    return () => cancelAnimation(frameIndex); // Clean up animation
  }, []);

  const spriteSheetStyle = useAnimatedStyle(() => {
    const index = Math.floor(frameIndex.value);
    const col = index % SPRITE_COLUMNS;
    const row = Math.floor(index / SPRITE_COLUMNS);
    return {
      transform: [
        { translateX: -col * FRAME_SIZE },
        { translateY: -row * FRAME_SIZE },
      ],
    };
  });

  return (
    <View style={styles.potionCard}>
      <View style={styles.cabinetLayer1}>
        <View style={styles.cabinetLayer2}>
          <View style={styles.cabinetLayer3}>
            {/* Animated Sprite Container */}
            <View style={[styles.spriteContainer, { width: FRAME_SIZE, height: FRAME_SIZE }]}>
              <Reanimated.View style={[
                styles.spriteSheet,
                {
                  width: FRAME_SIZE * SPRITE_COLUMNS,
                  height: FRAME_SIZE * SPRITE_ROWS
                },
                spriteSheetStyle
              ]}>
                <Image
                  source={{ uri: potion.icon }}
                  style={styles.spriteImage}
                  resizeMode="stretch"
                />
              </Reanimated.View>
            </View>
            
            {/* Count Badge - Top Right Corner */}
            <View style={styles.potionCountBadge}>
              <Text style={styles.potionCountText}>{potion.count}</Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* Potion Name Below the Card */}
      <Text style={styles.potionName}>{potion.name}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  potionCard: {
    alignItems: 'center',
    width: '100%',
  },

  cabinetLayer1: {
    width: gameScale(90),
    height: gameScale(90),
    borderRadius: gameScale(12),
    padding: gameScale(3),
  },
  cabinetLayer2: {
    flex: 1,
    backgroundColor: '#65432186', // Darker brown
    borderRadius: gameScale(9),
    borderWidth: gameScale(2),
    borderTopColor: '#8b6914',
    borderLeftColor: '#8b6914',
    borderBottomColor: '#3e2723',
    borderRightColor: '#3e2723',
    padding: gameScale(2),
  },
  cabinetLayer3: {
    flex: 1,
    backgroundColor: '#a0512d7c',
    borderRadius: gameScale(6),
    borderWidth: gameScale(1),
    borderColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },


  // Sprite animation styles
  spriteContainer: {
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 3,
  },
  spriteSheet: {
    // Dynamic size set in-line
  },
  spriteImage: {
    width: '100%',
    height: '100%',
  },
  
  // Count Badge (Top Right)
  potionCountBadge: {
    position: 'absolute',
    top: gameScale(-5),
    right: gameScale(-2),
    borderRadius: gameScale(12),
    paddingHorizontal: gameScale(8),
    paddingVertical: gameScale(3),
    minWidth: gameScale(24),
    alignItems: 'center',
    zIndex: 10, 
  },
  
  potionCountText: {
    fontSize: gameScale(12),
    color: '#ffffff',
    fontFamily: 'DynaPuff',
  },
  
  potionName: {
    fontSize: gameScale(15),
    color: '#f4e7d1ff',
    textAlign: 'center',
    fontFamily: 'FunkySign',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    maxWidth: gameScale(90),
  },
});

export default PotionCard;