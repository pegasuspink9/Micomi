import React, { useEffect, useState, useRef, useCallback} from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing, 
  runOnJS 
} from 'react-native-reanimated';
import { Image } from 'expo-image';

const { width } = Dimensions.get('window');
const HALF_WIDTH = width / 2;

const MainLoading = ({ visible, onAnimationComplete }) => {
  const [isRendered, setIsRendered] = useState(visible);
  
  // Shared Values for Sliding Animation
  // Start off-screen if visible is false, or at center if visible is true
  const leftTranslateX = useSharedValue(visible ? 0 : -HALF_WIDTH);
  const rightTranslateX = useSharedValue(visible ? 0 : HALF_WIDTH);

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      // ENTRANCE (Closing): Crashing merge effect
      // We use a fast duration and Easing.in to make it slam together
      leftTranslateX.value = withTiming(0, { 
        duration: 300, 
        easing: Easing.in(Easing.exp) 
      });
      rightTranslateX.value = withTiming(0, { 
        duration: 300, 
        easing: Easing.in(Easing.exp) 
      });

    } else {
      // EXIT (Opening): Smoothly open immediately without delay
      leftTranslateX.value = withTiming(-HALF_WIDTH, { 
        duration: 600, 
        easing: Easing.out(Easing.cubic) 
      });
      
      rightTranslateX.value = withTiming(HALF_WIDTH, { 
        duration: 600, 
        easing: Easing.out(Easing.cubic) 
      }, (finished) => {
        if (finished) {
          runOnJS(setIsRendered)(false);
          if (onAnimationComplete) {
            runOnJS(onAnimationComplete)();
          }
        }
      });
    }
  }, [visible]);

  const leftAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: leftTranslateX.value }]
  }));

  const rightAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rightTranslateX.value }]
  }));

  if (!isRendered) return null;

  return (
    <View style={styles.container}>
      {/* Left Panel */}
      <Animated.View style={[styles.panel, leftAnimatedStyle]}>
        <Image 
          source={require('./LoadingBody1.png')} 
          style={styles.image}
          contentFit="fill"
        />
      </Animated.View>

      {/* Right Panel */}
      <Animated.View style={[styles.panel, rightAnimatedStyle]}>
        <Image 
          source={require('./LoadingBody2FInal.png')} 
          style={styles.image}
          contentFit="fill"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999, // High z-index to overlay everything
    flexDirection: 'row',
  },
  panel: {
    width: '50%',
    height: '100%',
    overflow: 'hidden',
    },
    image: {
    width: '100%',
    height: '100%',
    },
});

export default MainLoading;