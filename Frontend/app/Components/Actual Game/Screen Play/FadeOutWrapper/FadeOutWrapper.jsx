import React from 'react';
import { Animated } from 'react-native';

const FadeOutWrapper = ({ 
  children, 
  fadeOutAnim, 
  isInRunMode = false,
  style = {}
}) => {
  return (
    <Animated.View 
      style={[
        {
          opacity: fadeOutAnim,
          pointerEvents: isInRunMode ? 'none' : 'auto'
        },
        style
      ]}
      pointerEvents="box-none"
    >
      {children}
    </Animated.View>
  );
};

export default FadeOutWrapper;