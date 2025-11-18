import React from 'react';
import { Animated } from 'react-native';

const FadeOutWrapper = ({ 
  children, 
  fadeOutAnim, 
  isInRunMode = false,
  style = {},
  zIndex = 1
}) => {
  return (
    <Animated.View 
      style={[
        {
          opacity: fadeOutAnim,
          pointerEvents: isInRunMode ? 'none' : 'auto',
          zIndex: zIndex
        },
        style
      ]}
    >
      {children}
    </Animated.View>
  );
};

export default FadeOutWrapper;