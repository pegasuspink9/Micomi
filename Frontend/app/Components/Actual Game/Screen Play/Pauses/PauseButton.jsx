import React, { useRef } from 'react';
import { View, Pressable, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { gameScale } from '../../../Responsiveness/gameResponsive';
import { soundManager } from '../../Sounds/UniversalSoundManager';

const PauseButton = ({ onPress = () => {} }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      tension: 100,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    soundManager.playButtonTapSound();
    onPress();
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <Animated.View 
          style={[
            styles.buttonOuter,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <View style={styles.buttonMiddle}>
            <View style={styles.buttonInner}>
              <Ionicons name="pause" size={gameScale(18)} color="#fff" />
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: gameScale(8),
    alignSelf: 'center',
    zIndex: 100,
  },

  // 3-Layer Border System (Blue theme matching Life component)
  buttonOuter: {
    backgroundColor: '#1e3a5f',
    borderRadius: gameScale(20),
    borderWidth: gameScale(1),
    borderTopColor: '#2d5a87',
    borderLeftColor: '#2d5a87',
    borderBottomColor: '#0d1f33',
    borderRightColor: '#0d1f33',
    shadowColor: '#4dabf7',
    shadowOffset: { width: 0, height: gameScale(3) },
    shadowOpacity: 0.4,
    shadowRadius: gameScale(6),
    elevation: 8,
  },

  buttonMiddle: {
    backgroundColor: '#152d4a',
    borderRadius: gameScale(18),
    padding: gameScale(1),
    borderWidth: gameScale(1),
    borderTopColor: '#4a90d9',
    borderLeftColor: '#4a90d9',
    borderBottomColor: '#0a1929',
    borderRightColor: '#0a1929',
  },

  buttonInner: {
    backgroundColor: 'rgba(74, 144, 217, 0.25)',
    borderRadius: gameScale(16),
    padding: gameScale(1),
    borderWidth: gameScale(1),
    borderColor: 'rgba(74, 144, 217, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PauseButton;