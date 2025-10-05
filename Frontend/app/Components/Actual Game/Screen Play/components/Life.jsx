import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const Life = ({
  health = 0,
  maxHealth = 0,
  onHealthChange = null,
  animated = true,
  position = 'left',
  borderColor = '#FFFFFF',
  showNumbers = true,
  avatarUrl = null,
  isEnemy = false
}) => {
  const effectiveMax = Math.max(0, Math.floor(maxHealth));
  const displayHealth = Math.max(0, Math.min(health, effectiveMax));
  
  // Animation refs
  const healthBarAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  const [previousHealth, setPreviousHealth] = useState(health);

  const getAvatarUrl = () => {
    if (avatarUrl) return avatarUrl;
    
    // Fallback defaults
    return isEnemy 
      ? "https://github.com/user-attachments/assets/a674f682-c784-447e-8c0a-a841f65b18ed"
      : "https://github.com/user-attachments/assets/eced9b8f-eae0-48f5-bc05-d8d5ce018529";
  };

  // Calculate health percentage for bar
  const healthPercentage = effectiveMax > 0 ? (displayHealth / effectiveMax) * 100 : 0;

  // Determine health bar color based on percentage
  const getHealthBarColors = () => {
    if (healthPercentage > 60) {
      return ['#4CAF50', '#8BC34A']; // Green
    } else if (healthPercentage > 30) {
      return ['#FF9800', '#FFC107']; // Orange
    } else if (healthPercentage > 0) {
      return ['#F44336', '#E91E63']; // Red
    } else {
      return ['#424242', '#616161']; // Gray for empty
    }
  };

  const healthBarColors = getHealthBarColors();

  // Run animations when health changes
  useEffect(() => {
    if (typeof onHealthChange === 'function') {
      onHealthChange(health, maxHealth);
    }

    if (!animated || health === previousHealth) {
      setPreviousHealth(health);
      return;
    }

    const isLoss = health < previousHealth;
    const isGain = health > previousHealth;

    if (isLoss) {
      // Health loss animation - shake and flash
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, { 
            toValue: 1.05, 
            duration: 150, 
            useNativeDriver: true 
          }),
          Animated.timing(healthBarAnim, { 
            toValue: 0.3, 
            duration: 150, 
            useNativeDriver: false 
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, { 
            toValue: 0.98, 
            duration: 200, 
            useNativeDriver: true 
          }),
          Animated.timing(healthBarAnim, { 
            toValue: 1, 
            duration: 300, 
            useNativeDriver: false 
          }),
        ]),
        Animated.timing(scaleAnim, { 
          toValue: 1, 
          duration: 150, 
          useNativeDriver: true 
        }),
      ]).start();
    } else if (isGain) {
      Animated.sequence([
        Animated.timing(pulseAnim, { 
          toValue: 1.08, 
          duration: 200, 
          useNativeDriver: true 
        }),
        Animated.timing(pulseAnim, { 
          toValue: 1, 
          duration: 300, 
          useNativeDriver: true 
        }),
      ]).start();
    }

    setPreviousHealth(health);
  }, [health, maxHealth, animated, previousHealth]);

  // Continuous pulse when health is critically low
  useEffect(() => {
    if (healthPercentage <= 20 && healthPercentage > 0) {
      const lowHealthPulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.03,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      lowHealthPulse.start();
      
      return () => lowHealthPulse.stop();
    }
  }, [healthPercentage]);

  if (effectiveMax === 0) {
    return null;
  }

  return (
    <Animated.View style={[
      styles.container,
      position === 'left' ? styles.leftPosition : styles.rightPosition,
      {
        transform: [
          { scale: Animated.multiply(scaleAnim, pulseAnim) }
        ]
      }
    ]}>
      <View style={styles.lifeContainer}>
        <View style={[
          styles.avatarContainer,
          position === 'left' ? styles.leftAvatarPosition : styles.rightAvatarPosition
        ]}>
          <View style={styles.avatarCircle}>
            <Image 
              source={{ uri: getAvatarUrl() }}
              style={[
                styles.avatarImage,
                isEnemy && position === 'right' && { transform: [{ translateX: -1 }] }
              ]}
              resizeMode="cover"
            />
          </View>
      </View>
       <View style={[
            styles.healthBarContainer, 
            { borderColor },
            position === 'left' ? styles.leftHealthBarMargin : styles.rightHealthBarMargin
          ]}>
        {/* ✅ Background Track */}

        <View style={styles.healthBarTrack}>
          {/* ✅ Health Fill with animated width */}
          <Animated.View 
            style={[
              styles.healthBarFillContainer,
              {
                width: `${healthPercentage}%`,
                opacity: healthBarAnim,
              }
            ]}
          >
            <LinearGradient
              colors={healthBarColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.healthBarFill}
            />
          </Animated.View>

          {/* ✅ Health Numbers Overlay */}
          {showNumbers && (
            <View style={styles.healthTextContainer}>
              <Text style={styles.healthText}>
                {displayHealth}/{effectiveMax}
              </Text>
            </View>
          )}

          {/* ✅ Critical Health Warning */}
          {healthPercentage <= 20 && healthPercentage > 0 && (
            <Animated.View 
              style={[
                styles.criticalWarning,
                {
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.03],
                    outputRange: [0.3, 0.8],
                  })
                }
              ]} 
            />
          )}
        </View>

        {/* ✅ Glow effect for different health states */}
        <Animated.View 
          style={[
            styles.glowEffect,
            {
              shadowColor: healthPercentage <= 20 ? '#F44336' : 
                          healthPercentage <= 40 ? '#FF9800' : '#4CAF50',
              opacity: pulseAnim.interpolate({
                inputRange: [1, 1.08],
                outputRange: [0.3, 0.6],
              })
            }
          ]} 
        />
      </View>
    </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: width * 0.02,
    maxWidth: width * 0.4,
    zIndex: 10,
  },
  
  leftPosition: {
    left: width * 0.02,
    alignItems: 'flex-start',
  },
  
  rightPosition: {
    right: width * 0.02,
    alignItems: 'flex-end',
  },

  // ✅ Main health bar container (capsule shape)
  healthBarContainer: {
  height: 20,
  minWidth: 100,
  borderRadius: 12,
  borderWidth: 2,
  backgroundColor: 'rgba(0, 0, 0, 1)',
  overflow: 'visible',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.3,
  shadowRadius: 6,
  elevation: 6,
  position: 'relative',
  marginTop: width * 0.01,
  marginLeft: 20, 
  
  },

  // ✅ Background track inside the capsule
  healthBarTrack: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    position: 'relative',
    overflow: 'hidden',
  },

  // ✅ Health fill container (animated width)
  healthBarFillContainer: {
    height: '100%',
    borderRadius: 10,
    overflow: 'hidden',

  },

  // ✅ Gradient health fill
  healthBarFill: {
    flex: 1,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },

  // ✅ Health numbers overlay
  healthTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },

  healthText: {
    fontSize: 11,
    fontFamily: 'DynaPuff',
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  // ✅ Critical health warning overlay
  criticalWarning: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F44336',
    borderRadius: 10,
    zIndex: 3,
  },

  // ✅ Glow effect around the health bar
  glowEffect: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
    zIndex: -1,
  },

  leftAvatarPosition: {
  left: 0, // Avatar on the left side
  },

  rightAvatarPosition: {
    right: 0, // Avatar on the right side
  },


  lifeContainer:{
    top: height * 0.01,
  },

  avatarContainer: {
  position: 'absolute',
  top: -2,
  zIndex: 20,
  },

  leftHealthBarMargin: {
  marginLeft: 20,
  marginRight: 0,
  },

  rightHealthBarMargin: {
  marginLeft: 0,
  marginRight: 20, 
  },


  avatarCircle: {
  width: 48,
  height: 48,
  borderRadius: 100,
  borderWidth: 2,
  borderColor: '#FFFFFF',
  overflow: 'hidden',
  backgroundColor: 'rgba(0, 0, 0, 1)',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 4,
},

avatarImage: {
  width: '100%',
  height: '190%'
},

defaultAvatar: {
  width: '100%',
  height: '100%',
  backgroundColor: '#4CAF50',
  justifyContent: 'center',
  alignItems: 'center',
},

avatarText: {
  fontSize: 12,
  color: '#FFF',
},
});

export default Life;