import React, { useRef, useEffect, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';

const PopSequenceAnimation = ({ 
  images = [], 
  duration = 100, 
  interval = 2000,
  shakeTime = 5000, 
  style = {},
  shouldAnimate = true 
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [animationPhase, setAnimationPhase] = useState('shake');
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const animationRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!shouldAnimate || images.length === 0) return;

    const startCycle = () => {
      // Phase 1: Shake
      setAnimationPhase('shake');
      setCurrentImageIndex(0);
      
      animationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -5, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]),
        { iterations: -1 }
      );
      
      animationRef.current.start();

      // Phase 2: Fade after shakeTime
      timeoutRef.current = setTimeout(() => {
        if (animationRef.current) {
          animationRef.current.stop();
        }
        setAnimationPhase('fade');
        
        // Cycle through remaining images
        let currentIndex = 1;
        const fadeNext = () => {
          if (currentIndex >= images.length) {
            // Restart cycle
            timeoutRef.current = setTimeout(startCycle, interval);
            return;
          }

          setCurrentImageIndex(currentIndex);
          
          const fadeAnimation = Animated.sequence([
            Animated.timing(opacityAnim, { toValue: 0, duration: duration * 0.4, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 1, duration: duration * 0.6, useNativeDriver: true }),
          ]);

          fadeAnimation.start(() => {
            currentIndex++;
            timeoutRef.current = setTimeout(fadeNext, interval);
          });
        };

        fadeNext();
      }, shakeTime);
    };

    startCycle();

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [shouldAnimate, images.length, duration, interval, shakeTime]);

  if (images.length === 0) return null;

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: animationPhase === 'shake' ? 1 : opacityAnim,
          transform: [{ translateX: animationPhase === 'shake' ? shakeAnim : 0 }],
        },
      ]}
    >
      <Animated.Image
        source={{ uri: images[currentImageIndex] }}
        style={[styles.image, style]}
        resizeMode="contain"
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
});

export default PopSequenceAnimation;