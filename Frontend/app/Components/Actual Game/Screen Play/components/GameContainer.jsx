import React, {useState, useEffect} from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { gameScale } from '../../../Responsiveness/gameResponsive';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay, 
  runOnJS,   
  Easing, 
  cancelAnimation
} from 'react-native-reanimated'; 

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Pre-calculate the scale factor once to use inside the animation worklet
const GS_FACTOR = gameScale(100) / 100;

const CollisionOverlay = ({ color, onReset }) => {
  const progress = useSharedValue(0);
  const [displayColor, setDisplayColor] = useState('transparent');

  useEffect(() => {
    cancelAnimation(progress);
    
    if (color && color !== 'white' && color !== 'transparent') {
      progress.value = 0;

      let newColor = color;
      if (color === 'correct') newColor = '#08ce29ff';
      else if (color === 'incorrect') newColor = '#c01300ff';
      
      setDisplayColor(newColor);
      
      // 3. Start the animation with a tiny delay to ensure displayColor is ready
      progress.value = withDelay(50, withTiming(1, { 
        duration: 600, 
        easing: Easing.out(Easing.back(1.5)) 
      }, (finished) => {
        if (finished) {
          progress.value = withDelay(3000, withTiming(0, { duration: 200 }, (done) => {
            if (done) {
              // 4. Clear the color state when finished to prevent "ghosting" next time
              runOnJS(setDisplayColor)('transparent');
              if (onReset) {
                runOnJS(onReset)();
              }
            }
          }));
        }
      }));
    }
  }, [color]);

  const animatedGlowStyle = useAnimatedStyle(() => {
    const glowIntensity = progress.value;
    return {
      height: `${progress.value * 50}%`,
      borderColor: displayColor,
      opacity: progress.value > 0.001 ? 1 : 0,
      borderWidth: (6 + progress.value * 3) * GS_FACTOR,
      shadowColor: displayColor,
      shadowOpacity: glowIntensity * 1,
      shadowRadius: glowIntensity * 25
    };
  });

  return (
    <>
      <Animated.View 
        style={[styles.collisionBase, styles.collisionTop, animatedGlowStyle]} 
        pointerEvents="none" 
      />
      <Animated.View 
        style={[styles.collisionBase, styles.collisionBottom, animatedGlowStyle]} 
        pointerEvents="none" 
      />
    </>
  );
};

const GameContainer = ({ children, borderColor, setBorderColor }) => {
  return (
    <View style={styles.outerFrame}>
      <View style={styles.containerBorderOuter}>
        <View style={styles.containerBorderMiddle}>
          <View style={styles.containerBorderInner}>
            
            <CollisionOverlay 
              color={borderColor} 
              onReset={() => setBorderColor && setBorderColor('white')} 
            />

            <View style={styles.innerBorderContainer}>
              <View style={styles.contentBorderOuter}>
                <View style={styles.contentBorderMiddle}>
                  <View style={styles.contentBorderInner}>
                    {children}
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: gameScale(43),
  },
  // 3-Layer Cabinet Border (replacing old container)
  containerBorderOuter: {
    flex: 1,
    backgroundColor: '#1e3a5f',
    borderRadius: gameScale(18),
    padding: gameScale(1),
    borderWidth: gameScale(1),
    borderTopColor: '#2d5a87',
    borderLeftColor: '#2d5a87',
    borderBottomColor: '#2d5a87',
    borderRightColor: '#2d5a87',
  },
  containerBorderMiddle: {
    flex: 1,
    backgroundColor: '#152d4a',
    borderRadius: gameScale(16),
    padding: gameScale(1),
    borderWidth: gameScale(1),
    borderTopColor: '#2c75c3ff',
    borderLeftColor: '#2c75c3ff',
    borderBottomColor: '#2c75c3ff',
    borderRightColor: '#2c75c3ff',
  },
    containerBorderInner: {
    flex: 1,
    backgroundColor: 'rgba(74, 144, 217, 0.15)',
    borderRadius: gameScale(14),
    padding: gameScale(4),
    borderWidth: gameScale(1),
    borderColor: 'rgba(74, 144, 217, 0.3)',
    position: 'relative', // Ensure children can use absolute positioning
  },
    collisionBase: {
    position: 'absolute',
    left: gameScale(4),
    right: gameScale(4),
    borderWidth: gameScale(6),
    backgroundColor: 'transparent',
    zIndex: 9999,
  },
    collisionTop: {
    top: gameScale(4),
    borderTopLeftRadius: gameScale(31),
    borderTopRightRadius: gameScale(31),
    borderBottomWidth: 0, // Don't show border where they meet
  },
  collisionBottom: {
    bottom: gameScale(4),
    borderBottomLeftRadius: gameScale(31),
    borderBottomRightRadius: gameScale(31),
    borderTopWidth: 0, // Don't show border where they meet
  },
    innerBorderContainer: {
    flex: 1,
    borderWidth: gameScale(6),
    overflow: 'hidden',
    borderRadius: gameScale(31),
    position: 'relative',
    // FIX: Changed from #a51010ff (red) to #152d4a (dark blue) to stop the red flicker
    backgroundColor: '#152d4a', 
    borderTopWidth: gameScale(6),
    borderTopColor: '#f0f8ffff', 
    borderLeftWidth: gameScale(6),
    borderLeftColor: '#e0f0ffff',
    borderBottomWidth: gameScale(6),
    borderBottomColor: '#e0f0ffff',
    borderRightWidth: gameScale(6),
    borderRightColor: '#e0f0ffff',
  },
  // 3-Layer Content Border (replacing old contentContainer)
  contentBorderOuter: {
    flex: 1,
    backgroundColor: '#d0e8f8',
    borderRadius: gameScale(23),
    padding: gameScale(1),
    borderWidth: gameScale(1),
    borderTopColor: '#e8f4ff',
    borderLeftColor: '#e8f4ff',
    borderBottomColor: '#7a9ab8',
    borderRightColor: '#7a9ab8',
    overflow: 'hidden',
  },
  contentBorderMiddle: {
    flex: 1,
    backgroundColor: '#071c2fff',
    borderRadius: gameScale(21),
    padding: gameScale(1),
    borderWidth: gameScale(1),
    borderTopColor: '#5a7a9a',
    borderLeftColor: '#5a7a9a',
    borderBottomColor: '#5a7a9a',
    borderRightColor: '#5a7a9a',
    overflow: 'hidden',
  },
  contentBorderInner: {
    flex: 1,
    backgroundColor: '#f5f9fc',
    borderRadius: gameScale(19),
    borderWidth: gameScale(1),
    borderColor: 'rgba(138, 180, 213, 0.5)',
    overflow: 'hidden',
  },
});


export default GameContainer;