import React, { useState, useEffect, useRef } from 'react';
import { View, Image, Text, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { gameScale } from '../../../Responsiveness/gameResponsive';

const SpecialSkillIcon = ({ image, description, position = 'left', streak = 0 }) => {
  const [showDescription, setShowDescription] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const fillAnim = useRef(new Animated.Value(0)).current;
  
  // Animation for the border runner
  const borderProgress = useRef(new Animated.Value(0)).current;

  const getFillPercentage = (s) => {
    if (s <= 0) return 0;
    if (s === 1) return 30;
    if (s === 2) return 70;
    return 100;
  };

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: getFillPercentage(streak),
      duration: 800,
      useNativeDriver: false,
    }).start();

    if (streak === 3) {
      // Border runner animation (0 to 4 representing the 4 sides)
      Animated.loop(
        Animated.timing(borderProgress, {
          toValue: 4,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: false,
        })
      ).start();
    } else {
      borderProgress.stopAnimation();
      borderProgress.setValue(0);
    }
  }, [streak]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: showDescription ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();

    if (showDescription) {
      const timer = setTimeout(() => setShowDescription(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showDescription]);

  const fillHeight = fillAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  // Interpolate runner position to follow the border of the inner container
  // The inner container is 30x30, centered in 36x36 (so offset is 3)
  const runnerTop = borderProgress.interpolate({
    inputRange: [0, 1, 2, 3, 4],
    outputRange: [gameScale(1), gameScale(1), gameScale(31), gameScale(31), gameScale(1)],
  });
  const runnerLeft = borderProgress.interpolate({
    inputRange: [0, 1, 2, 3, 4],
    outputRange: [gameScale(1), gameScale(31), gameScale(31), gameScale(1), gameScale(1)],
  });

  const isRight = position === 'right';
  const themeColor = isRight ? '#ff4d4dff' : '#8ef7f5ff'; 
  const shadowColor = isRight ? '#ff0000ff' : '#62e0d4ff';


  return (
    <View style={[styles.container, position === 'right' ? styles.rightContainer : styles.leftContainer]}>
      <Pressable onPress={() => setShowDescription(!showDescription)} style={styles.iconWrapper}>
        
        {/* STREAK 3 EFFECTS */}
       {streak === 3 && (
          <Animated.View 
            style={[
              styles.circularRunner, 
              { 
                top: runnerTop, 
                left: runnerLeft,
                borderColor: themeColor,
                shadowColor: shadowColor,
              }
            ]} 
          />
        )}

        <View style={[
          styles.innerIconContainer,
          streak === 3 && {
            borderColor: themeColor,
            borderWidth: 1,
            shadowColor: themeColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 4,
            elevation: 5,
          }
        ]}>
          {/* Background Image (Dark/Empty) */}
          <Image 
            source={require('./specialIcon.png')} 
            style={[styles.icon, styles.iconBackground]}
            resizeMode="contain"
          />
          
          {/* Foreground Image (Colored/Filled) */}
          <Animated.View style={[styles.fillContainer, { height: fillHeight }]}>
            <Image 
              source={require('./specialIcon.png')} 
              style={styles.iconForeground}
              resizeMode="contain"
            />
          </Animated.View>
        </View>
      </Pressable>

      {showDescription && (
        <Animated.View 
          style={[
            styles.popup, 
            position === 'left' ? styles.leftPopup : styles.rightPopup,
            { opacity: fadeAnim }
          ]}
        >
          <Text style={styles.descriptionText}>{description}</Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: gameScale(60),
    zIndex: 2000,
  },
  leftContainer: {
    left: gameScale(10),
  },
  rightContainer: {
    right: gameScale(10),
  },
  iconWrapper: {
    width: gameScale(36),
    height: gameScale(36),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  innerIconContainer: {
    width: gameScale(30),
    height: gameScale(30),
    borderRadius: gameScale(6),
    backgroundColor: 'rgba(0,0,0,0.5)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  icon: {
    width: '100%',
    height: '100%',
  },
  iconBackground: {
    opacity: 0.3,
  },
  fillContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    overflow: 'hidden',
  },
  iconForeground: {
    width: gameScale(30),
    height: gameScale(30),
    position: 'absolute',
     borderRadius: gameScale(6),
    backgroundColor: 'rgba(0,0,0,0.5)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    borderWidth: 1,
    bottom: 0,
  },
  circularRunner: {
    position: 'absolute',
    width: gameScale(6),
    height: gameScale(6),
    borderRadius: gameScale(3),
    backgroundColor: '#ffffffff',
    zIndex: 10,
    shadowRadius: 6,
    shadowOpacity: 1,
    elevation: 8,
    borderWidth: 1,
  },
  popup: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    padding: gameScale(8),
    borderRadius: gameScale(8),
    borderWidth: 1,
    borderColor: '#d3d3d3ff',
    width: gameScale(120),
    top: 0,
  },
  leftPopup: {
    left: gameScale(45),
  },
  rightPopup: {
    right: gameScale(45),
  },
  descriptionText: {
  color: 'white',
  fontSize: gameScale(10),
  fontFamily: 'DynaPuff',
  textAlign: 'center',
  },
});

export default SpecialSkillIcon;