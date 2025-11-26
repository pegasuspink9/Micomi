import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gameScale,scale } from '../../../Responsiveness/gameResponsive';

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
    return avatarUrl;
    
  };

  // Calculate health percentage for bar
  const healthPercentage = effectiveMax > 0 ? (displayHealth / effectiveMax) * 100 : 0;

  // Determine health bar color based on percentage
  const getHealthBarColors = () => {
    if (healthPercentage > 60) {
      return ['#4CAF50', '#8BC34A'];
    } else if (healthPercentage > 30) {
      return ['#FF9800', '#FFC107'];
    } else if (healthPercentage > 0) {
      return ['#F44336', '#E91E63'];
    } else {
      return ['#424242', '#616161'];
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
                isEnemy && position === 'right' && { transform: [{ translateX: scale(-1) }] }
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
          <View style={styles.healthBarTrack}>
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

            {showNumbers && (
              <View style={styles.healthTextContainer}>
                <Text style={styles.healthText}>
                  {displayHealth}/{effectiveMax}
                </Text>
              </View>
            )}

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
    top: gameScale(11),
    maxWidth: gameScale(156),
    zIndex: 10,
  },
  
  leftPosition: {
    left: gameScale(8),
    alignItems: 'flex-start',
  },
  
  rightPosition: {
    right: gameScale(8),
    alignItems: 'flex-end',
  },

  healthBarContainer: {
    height: gameScale(20),
    minWidth: gameScale(100),
    borderRadius: gameScale(12),
    borderWidth: gameScale(2),
    backgroundColor: 'rgba(0, 0, 0, 1)',
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: gameScale(4) },
    shadowOpacity: 0.2,
    shadowRadius: gameScale(8),
    elevation: 4,
    position: 'relative',
    marginTop: 0,
  },

  healthBarTrack: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: gameScale(8),
    position: 'relative',
    overflow: 'hidden',
  },

  healthBarFillContainer: {
    height: '100%',
    borderRadius: gameScale(8),
    overflow: 'hidden',
  },

  healthBarFill: {
    flex: 1,
    borderRadius: gameScale(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: gameScale(1) },
    shadowOpacity: 0.2,
    shadowRadius: gameScale(2),
    elevation: 2,
  },

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
    fontSize: gameScale(10),
    fontFamily: 'DynaPuff',
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: gameScale(1), height: gameScale(1) },
    textShadowRadius: gameScale(2),
  },

  criticalWarning: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F44336',
    borderRadius: gameScale(8),
    zIndex: 3,
  },

  glowEffect: {
    position: 'absolute',
    top: gameScale(-4),
    left: gameScale(-4),
    right: gameScale(-4),
    bottom: gameScale(-4),
    borderRadius: gameScale(16),
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: gameScale(8),
    elevation: 8,
    zIndex: -1,
  },

  leftAvatarPosition: {
    left: 0,
  },

  rightAvatarPosition: {
    right: 0,
  },

  lifeContainer: {
    top: gameScale(8),
  },

  avatarContainer: {
    position: 'absolute',
    top: gameScale(-2),
    zIndex: 20,
  },

  leftHealthBarMargin: {
    marginLeft: gameScale(28),
    marginRight: 0,
  },

  rightHealthBarMargin: {
    marginLeft: 0,
    marginRight: gameScale(28),
  },

  avatarCircle: {
    width: gameScale(48),
    height: gameScale(48),
    borderRadius: gameScale(50),
    borderWidth: gameScale(2),
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: gameScale(2) },
    shadowOpacity: 0.1,
    shadowRadius: gameScale(4),
    elevation: 2,
  },

  avatarImage: {
    height: gameScale(84),
  },

  avatarText: {
    fontSize: gameScale(12),
    color: '#FFF',
  },
});


export default Life;