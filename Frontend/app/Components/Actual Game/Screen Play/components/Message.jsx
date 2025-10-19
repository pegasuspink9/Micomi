import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import { 
  scale, 
  scaleWidth, 
  scaleHeight, 
  scaleFont, 
  RESPONSIVE, 
  SCREEN 
} from '../../../Responsiveness/gameResponsive';

export default function Message({
  message = '',
  visible,
  duration = 2000,
  animated = true,
  trigger = 0,
  onHide = null,
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const hideTimerRef = useRef(null);
  const [isShown, setIsShown] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState(0);

  const ANIMATIONS = {
  // Animation 1: EXPLOSIVE BURST 💥 (No rotation)
  0: {
    name: 'EXPLOSIVE BURST',
    show: () => {
      opacity.setValue(0);
      scaleAnim.setValue(0.1);
      translateY.setValue(0);
      translateX.setValue(0);
      rotateAnim.setValue(0);
      glowAnim.setValue(0);
      pulseAnim.setValue(1);

      Animated.parallel([
        // Explosive scale burst
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 2.5,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 300,
            friction: 6,
            useNativeDriver: true,
          }),
        ]),
        // Flash opacity
        Animated.timing(opacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        // Glow effect
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    },
    hide: () => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 2.0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsShown(false);
        if (typeof onHide === 'function') onHide();
      });
    }
  },

  // Animation 2: POWER SLIDE IMPACT 💨 (No rotation)
  1: {
    name: 'POWER SLIDE',
    show: () => {
      opacity.setValue(0);
      scaleAnim.setValue(1.5);
      translateY.setValue(0);
      translateX.setValue(scaleWidth(400));
      rotateAnim.setValue(0);
      glowAnim.setValue(0);

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        // High-speed slide with overshoot
        Animated.sequence([
          Animated.timing(translateX, {
            toValue: -scaleWidth(30),
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(translateX, {
            toValue: 0,
            tension: 250,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
        // Scale impact
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 0.7,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 200,
            friction: 7,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    },
    hide: () => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: -scaleWidth(300),
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsShown(false);
        if (typeof onHide === 'function') onHide();
      });
    }
  },

  // Animation 3: SHOCKWAVE PULSE ⚡ (No rotation)
  2: {
    name: 'SHOCKWAVE',
    show: () => {
      opacity.setValue(0);
      scaleAnim.setValue(0.2);
      translateY.setValue(scaleHeight(100));
      translateX.setValue(0);
      rotateAnim.setValue(0);
      glowAnim.setValue(0);
      pulseAnim.setValue(1);

      Animated.parallel([
        // Drop and bounce impact
        Animated.sequence([
          Animated.timing(translateY, {
            toValue: scaleHeight(10),
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.spring(translateY, {
            toValue: 0,
            tension: 400,
            friction: 6,
            useNativeDriver: true,
          }),
        ]),
        // Shockwave scale
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.8,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.9,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 350,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        // Continuous pulse
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.05,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    },
    hide: () => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -scaleHeight(80),
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsShown(false);
        if (typeof onHide === 'function') onHide();
      });
    }
  }
};

  // ✅ Random animation selector
  const selectRandomAnimation = () => {
    const randomIndex = Math.floor(Math.random() * Object.keys(ANIMATIONS).length);
    setCurrentAnimation(randomIndex);
    console.log(`🔥 POWER ANIMATION: ${ANIMATIONS[randomIndex].name}!`);
    return randomIndex;
  };

  // show/hide handlers
  const show = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setIsShown(true);

    if (animated) {
      const animIndex = selectRandomAnimation();
      ANIMATIONS[animIndex].show();
    } else {
      opacity.setValue(1);
      scaleAnim.setValue(1);
      translateY.setValue(0);
      translateX.setValue(0);
      rotateAnim.setValue(0);
      glowAnim.setValue(0);
      pulseAnim.setValue(1);
    }

    // schedule hide
    hideTimerRef.current = setTimeout(() => {
      hide();
    }, Math.max(700, duration));
  };

  const hide = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (animated) {
      ANIMATIONS[currentAnimation].hide();
    } else {
      setIsShown(false);
      if (typeof onHide === 'function') onHide();
    }
  };

  useEffect(() => {
    const shouldShow = !!(visible ?? (message && message.length > 0));
    if (shouldShow) {
      show();
    } else {
      hide();
    }

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [message, visible, trigger]);

  if (!isShown) return null;

  // ✅ Rotation interpolation
  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // ✅ Glow effect interpolation
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.8],
  });

  return (
    <View style={styles.viewport} pointerEvents="none">
      {/* ✅ Glow effect background */}
      <Animated.View
        style={[
          styles.glowEffect,
          {
            opacity: glowOpacity,
            transform: [
              { scale: Animated.multiply(scaleAnim, 1.2) },
              { translateX: translateX },
              { translateY: translateY },
            ],
          },
        ]}
      />
      
      <Animated.View
        style={[
          styles.badge,
          {
            opacity: opacity,
            transform: [
              { scale: Animated.multiply(scaleAnim, pulseAnim) },
              { translateX: translateX },
              { translateY: translateY },
              { rotate: rotateInterpolate },
            ],
          },
        ]}
      >
        <Text style={styles.messageText} numberOfLines={3}>
          {message}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    position: 'absolute',
    top: scaleHeight(80),
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'none',
    zIndex: 999,
  },



  messageText: {
    color: '#094385ff',
    fontSize: RESPONSIVE.fontSize.lg,
    textAlign: 'center',
    lineHeight: scaleFont(22),
    fontFamily: 'Oups',
    textShadowRadius: scale(10),
    letterSpacing: scale(1), 
  },
});