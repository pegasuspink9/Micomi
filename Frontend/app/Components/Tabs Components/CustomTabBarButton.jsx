import React from 'react';
import { Pressable, Animated } from 'react-native';


const CustomTabBarButton = (props) => {
  const { children, onPress } = props;
  const scaleValue = React.useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    // Scale down when pressed
    Animated.spring(scaleValue, {
      toValue: 1.2,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    // Scale back to normal when released
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 4,
      tension: 50,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress} 
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
    >
      <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

export default CustomTabBarButton;