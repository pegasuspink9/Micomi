import React, { useMemo, useRef } from 'react';
import { Animated, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ScreenPlayCenterWrapper = ({ 
  children, 
  isInRunMode = false,
  style = {},
  scaleFactor = 0.7,
  delay = 0, // NEW: Delay in milliseconds before animation starts
}) => {
  const translateAnim = useRef(new Animated.Value(0)).current;
  const isCenteredRef = useRef(false);

  React.useEffect(() => {
    if (isInRunMode && !isCenteredRef.current) {
      isCenteredRef.current = true;
      
      // NEW: Wait for delay before starting animation
      const delayTimer = setTimeout(() => {
        Animated.timing(translateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }).start();
      }, delay);

      // Cleanup timer if component unmounts
      return () => clearTimeout(delayTimer);
    }
  }, [isInRunMode, translateAnim, delay]);

  const animatedStyle = {
    transform: [
      {
        translateY: translateAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, SCREEN_HEIGHT * 0.25],
        }),
      },
      {
        scale: translateAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, scaleFactor],
        }),
      },
    ],
  };

  return (
    <Animated.View 
      style={[
        {
          pointerEvents: 'auto',
        },
        animatedStyle,
        style
      ]}
    >
      {children}
    </Animated.View>
  );
};

export default ScreenPlayCenterWrapper;