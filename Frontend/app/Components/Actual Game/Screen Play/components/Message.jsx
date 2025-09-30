// Message.js
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Text, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

/**
 * Message component
 *
 * Props:
 * - message: string - text to show
 * - visible: boolean - whether to show (optional; message presence will auto-show)
 * - duration: ms - how long to keep visible before auto-hide (default 2000)
 * - animated: boolean - enable animations (default true)
 * - trigger: number - optional monotonic value to force re-show even if `message` is identical
 * - onHide: fn - optional callback when message hides
 */
export default function Message({
  message = '',
  visible,
  duration = 2000,
  animated = true,
  trigger = 0,
  onHide = null,
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const hideTimerRef = useRef(null);
  const [isShown, setIsShown] = useState(false);

  // POP animation tuning (change these to taste)
  const POP_START = 4.6;       // start very big
  const POP_OVERSHOOT = 0.5;   // quick undershoot snap
  const POP_SETTLE = 0.9;      // final settled scale
  const POP_FAST_MS = 250;     // fast shrink duration
  const POP_SETTLE_MS = 190;   // settle duration
  const FADE_IN_MS = 210;      // opacity fade in

  // show/hide handler
  const show = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setIsShown(true);

    if (animated) {
      opacity.setValue(0);
      scale.setValue(POP_START);

      Animated.parallel([
        // opacity in
        Animated.timing(opacity, {
          toValue: 1,
          duration: FADE_IN_MS,
          useNativeDriver: true,
        }),
        // pop sequence: big -> quick shrink -> settle
        Animated.sequence([
          Animated.timing(scale, {
            toValue: POP_OVERSHOOT,
            duration: POP_FAST_MS,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: POP_SETTLE,
            duration: POP_SETTLE_MS,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      opacity.setValue(1);
      scale.setValue(1);
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
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.96,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsShown(false);
        if (typeof onHide === 'function') onHide();
      });
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

  return (
    <View style={styles.viewport} pointerEvents="none">
      <Animated.View
        style={[
          styles.badge,
          {
            opacity: opacity,
            transform: [{ scale: scale }],
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
    top: width * 0.15,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'none',
    zIndex: 999,
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    maxWidth: width * 0.50,
    alignItems: 'center'
  },
  messageText: {
    color: '#08004bff',
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: 'FunkySign',
  },
});
