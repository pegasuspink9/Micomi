import React, { useEffect, useState, useRef, useCallback} from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay,
  Easing, 
  runOnJS 
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { soundManager } from '../Sounds/UniversalSoundManager';


const { width } = Dimensions.get('window');
const HALF_WIDTH = width / 2;

const MainLoading = ({ visible, onAnimationComplete }) => {
  const [isRendered, setIsRendered] = useState(visible);
  
  const leftTranslateX = useSharedValue(visible ? 0 : -HALF_WIDTH);
  const rightTranslateX = useSharedValue(visible ? 0 : HALF_WIDTH);

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      soundManager.playLoadingSound();
      leftTranslateX.value = withTiming(0, { 
        duration: 300, 
        easing: Easing.in(Easing.exp) 
      });
      rightTranslateX.value = withTiming(0, { 
        duration: 300, 
        easing: Easing.in(Easing.exp) 
      });

    } else {
      soundManager.playLoadingSound();
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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