import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import { gameScale } from '../../../Responsiveness/gameResponsive'; // Adjust path if necessary

const BonusRoundModal = ({
  visible = false, // Controls if the modal should *begin* its show sequence
  message = 'Bonus Round!',
  duration = 3000, // Total display duration, including fade-out
  onHide = () => {}, // Callback when the modal has finished hiding
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const hideTimerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
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
        ]).start((result) => {
          if (result.finished) {
            setIsVisible(false);
            if (typeof onHide === 'function') onHide();
          }
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
        translateX.setValue(gameScale(400));
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
              toValue: gameScale(-30),
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
            toValue: gameScale(-300),
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start((result) => {
          if (result.finished) {
            setIsVisible(false);
            if (typeof onHide === 'function') onHide();
          }
        });
      }
    },

    // Animation 3: SHOCKWAVE PULSE ⚡ (No rotation)
    2: {
      name: 'SHOCKWAVE',
      show: () => {
        opacity.setValue(0);
        scaleAnim.setValue(0.2);
        translateY.setValue(gameScale(100));
        translateX.setValue(0);
        rotateAnim.setValue(0);
        glowAnim.setValue(0);
        pulseAnim.setValue(1);

        Animated.parallel([
          // Drop and bounce impact
          Animated.sequence([
            Animated.timing(translateY, {
              toValue: gameScale(10),
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
            toValue: gameScale(80),
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start((result) => {
          if (result.finished) {
            setIsVisible(false);
            if (typeof onHide === 'function') onHide();
          }
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

  useEffect(() => {
    if (visible) {
      // If the parent component wants the modal to be visible
      setIsVisible(true); // Make it visible

      // Clear any existing hide timer to prevent premature hiding if 'visible' changes rapidly
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }

      // Select and start the random entrance animation
      const animIndex = selectRandomAnimation();
      ANIMATIONS[animIndex].show();

      // Schedule hide after the specified duration
      hideTimerRef.current = setTimeout(() => {
        ANIMATIONS[animIndex].hide();
      }, duration);
    } else {
      // If the parent component wants it hidden
      // and it's currently showing, initiate an immediate fade-out.
      if (isVisible) {
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
        }
        ANIMATIONS[currentAnimation].hide();
      }
    }

    // Cleanup function: Clear any pending timers when the component unmounts or dependencies change
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [visible, duration, onHide, isVisible, currentAnimation]);

  // Only render if visible
  if (!isVisible) {
    return null;
  }

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
    <View style={styles.modalContainer}>
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
          styles.modalContent,
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
        <Text style={styles.modalText}>{message}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000, // Ensure it's above other elements
    backgroundColor: 'rgba(0, 0, 0, 0.31)', // Semi-transparent background
  },
  modalContent: {
    padding: gameScale(20),
    borderRadius: gameScale(10),
    alignItems: 'center',
  },
  glowEffect: {
    position: 'absolute',
    width: gameScale(200),
    height: gameScale(100),
    borderRadius: gameScale(50),
  },
  modalText: {
    fontSize: gameScale(44),
    fontFamily: 'Oups', 
    color: '#c51a1aff',
    textAlign: 'center',
  },
});

export default BonusRoundModal;