// ElectricAbsolute.js
import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, StyleSheet } from 'react-native';

const DEFAULT_IMAGE = 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1760245717/Untitled_design_9_gmzejd.png';

export default function ElectricAbsolute({
  sourceUri = DEFAULT_IMAGE,
  top,
  left,
  right,
  bottom,
  width = 100,
  height = 100,
  zIndex = 1100,
  visible = true,
  pulse = true,
  opacity = 1,
  onPress,
  containerStyle,
  imageStyle,
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const fade = useRef(new Animated.Value(0)).current;

  // fade in/out when visible toggles
  useEffect(() => {
    Animated.timing(fade, {
      toValue: visible ? opacity : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [visible, opacity, fade]);

  // subtle pulsing loop
  useEffect(() => {
    let animation;
    if (pulse && visible) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.06, duration: 900, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1.0, duration: 900, useNativeDriver: true }),
        ])
      );
      animation.start();
    } else {
      // reset scale if no pulse
      Animated.timing(scale, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    }
    return () => animation && animation.stop();
  }, [pulse, visible, scale]);

  const wrapperStyle = {
    position: 'absolute',
    top,
    left,
    right,
    bottom,
    width,
    height,
    zIndex,
    elevation: zIndex, // android
  };

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        wrapperStyle,
        styles.container,
        containerStyle,
        { transform: [{ scale }], opacity: fade },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={{ flex: 1, borderRadius: 999, overflow: 'hidden' }}
      >
        <Animated.Image
          source={{ uri: sourceUri }}
          style={[styles.image, { width: '100%', height: '100%' }, imageStyle]}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    // any default box shadows / background you want:
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  image: {
    // default image styling
  },
});
