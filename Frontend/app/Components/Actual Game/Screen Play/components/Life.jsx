// components/Life.js
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Each heart represents up to HEART_UNIT HP. Set to 20 to match your example.
const HEART_UNIT = 20;

const Life = ({
  health = 0,
  maxHealth = 0,
  onHealthChange = null,
  animated = true,
  position = 'left',
  borderColor = '#FFFFFF',
}) => {
  const effectiveMax = Math.max(0, Math.floor(maxHealth));
  const heartsCount = effectiveMax > 0 ? Math.ceil(effectiveMax / HEART_UNIT) : 0;

  // Ref to hold Animated.Values for each slot (preserved across re-renders)
  const animatedValuesRef = useRef([]);
  if (animatedValuesRef.current.length !== heartsCount) {
    const preserved = animatedValuesRef.current.slice(0, heartsCount);
    while (preserved.length < heartsCount) preserved.push(new Animated.Value(1));
    animatedValuesRef.current = preserved;
  }

  // Use previous raw health to determine animations (kept raw for logic)
  const [previousHealth, setPreviousHealth] = useState(health);

  // Clamp displayHealth between 0 and effectiveMax
  const displayHealth = Math.max(0, Math.min(health, effectiveMax));

  // Build heart data based on heartsCount and displayHealth.
  // The last heart uses the remaining unit (may be < HEART_UNIT).
  const getHeartStates = () => {
    const heartsData = [];
    for (let i = 0; i < heartsCount; i++) {
      const heartMin = i * HEART_UNIT;
      const remainingForHeart = Math.max(0, effectiveMax - heartMin);
      const unitForHeart = Math.min(HEART_UNIT, remainingForHeart);

      const healthInHeart = Math.min(Math.max(displayHealth - heartMin, 0), unitForHeart);
      const fillPercentage = unitForHeart > 0 ? healthInHeart / unitForHeart : 0;

      let state = 'empty';
      if (fillPercentage >= 0.75) state = 'full';
      else if (fillPercentage >= 0.5) state = 'half';
      else if (fillPercentage >= 0.25) state = 'quarter';
      else state = 'empty';

      heartsData.push({
        index: i,
        state,
        isActive: fillPercentage > 0,
        unitForHeart,
        heartMin,
      });
    }
    return heartsData;
  };

  const heartsData = getHeartStates();

  // Run animations and notify parent when health changes
  useEffect(() => {
    if (typeof onHealthChange === 'function') {
      onHealthChange(health, maxHealth);
    }

    if (!animated) {
      setPreviousHealth(health);
      return;
    }

    // nothing to animate if the numeric health didn't change
    if (health === previousHealth) return;

    const prevDisplay = Math.max(0, Math.min(previousHealth, effectiveMax));
    const currDisplay = displayHealth;
    const isLoss = health < previousHealth;

    heartsData.forEach((heart) => {
      const idx = heart.index;
      const anim = animatedValuesRef.current[idx];
      if (!anim) return;

      const wasActive = prevDisplay > heart.heartMin;
      const nowActive = currDisplay > heart.heartMin;

      // Lost health: heart went from active -> inactive
      if (isLoss && wasActive && !nowActive) {
        Animated.sequence([
          Animated.timing(anim, { toValue: 1.3, duration: 160, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.8, duration: 200, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 1, duration: 140, useNativeDriver: true }),
        ]).start();
      } else if (!isLoss && !wasActive && nowActive) {
        // Gained health: heart became active
        Animated.sequence([
          Animated.timing(anim, { toValue: 0.7, duration: 100, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 1.25, duration: 200, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();
      }
    });

    setPreviousHealth(health);
  }, [health, maxHealth, animated, heartsData, displayHealth, effectiveMax, onHealthChange, previousHealth]);

  const getHeartDisplay = (heartData) => {
    const { state } = heartData;
    switch (state) {
      case 'full':
        return { icon: 'heart', color: 'rgba(255, 2, 23, 1)' };
      case 'half':
        return { icon: 'heart-half', color: 'rgba(255, 107, 122, 1)' };
      case 'quarter':
        return { icon: 'heart-outline', color: 'rgba(255, 142, 149, 1)' };
      case 'empty':
      default:
        return { icon: 'heart-outline', color: '#95A5A6' };
    }
  };

  // If maxHealth is zero or negative, render nothing (you can change to show a bordered box instead)
  if (heartsCount === 0) {
    return null;
  }

  return (
    <View style={[
      styles.container,
      position === 'left' ? styles.leftPosition : styles.rightPosition
    ]}>
      <View style={[styles.borderWrapper, { borderColor }]}>
        <View style={styles.heartsRow}>
          {heartsData.map((heartData) => {
            const heartDisplay = getHeartDisplay(heartData);
            const animValue = animatedValuesRef.current[heartData.index] || new Animated.Value(1);

            return (
              <Animated.View
                key={heartData.index}
                style={[
                  styles.heartContainer,
                  { transform: animated ? [{ scale: animValue }] : [{ scale: 1 }] }
                ]}
              >
                <Ionicons
                  name={heartDisplay.icon}
                  size={15}
                  color={heartDisplay.color}
                />
              </Animated.View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: width * 0.02,
    borderRadius: 8,
    padding: 1,
    maxWidth: width * 0.52,
  },
  leftPosition: {
    left: width * 0.002,
    alignItems: 'flex-start',
  },
  rightPosition: {
    right: width * 0.03,
    alignItems: 'flex-end',
  },

  borderWrapper: {
    paddingHorizontal: 11,
    paddingVertical: 3,
    borderRadius: 6,
  },

  heartsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  heartContainer: {
    marginHorizontal: 2,
    marginVertical: 1,
  },
});

export default Life;
