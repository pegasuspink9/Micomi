import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Text, Animated } from 'react-native';

const ScreenLabel = forwardRef(({ 
  heroName, 
  selectedHero,
  styles 
}, ref) => {
  const screenLabelOpacity = useRef(new Animated.Value(0)).current;
  const screenLabelScale = useRef(new Animated.Value(0.8)).current;

  const startAnimation = () => {
    Animated.parallel([
      Animated.timing(screenLabelOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(screenLabelScale, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
  };

  const resetAnimation = () => {
    screenLabelOpacity.setValue(0);
    screenLabelScale.setValue(0.8);
  };

  useImperativeHandle(ref, () => ({
    startAnimation,
    resetAnimation
  }));

  useEffect(() => {
    resetAnimation();
  }, [selectedHero]);

  return (
    <Animated.View 
      style={[
        styles.screenLabel,
        {
          opacity: screenLabelOpacity,
          transform: [{ scale: screenLabelScale }]
        }
      ]}
    >
      <Text style={styles.screenLabelText}>{heroName}</Text>
    </Animated.View>
  );
});

export default ScreenLabel;