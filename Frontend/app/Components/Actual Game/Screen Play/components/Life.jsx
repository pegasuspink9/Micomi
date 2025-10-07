import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  scale, 
  scaleWidth, 
  scaleHeight, 
  scaleFont, 
  RESPONSIVE, 
  layoutHelpers 
} from '../../../Responsiveness/gameResponsive';

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
    
    return isEnemy 
      ? "https://github.com/user-attachments/assets/a674f682-c784-447e-8c0a-a841f65b18ed"
      : "https://github.com/user-attachments/assets/eced9b8f-eae0-48f5-bc05-d8d5ce018529";
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
    top: scaleHeight(11),
    maxWidth: scaleWidth(156),
    zIndex: 10,
  },
  
  leftPosition: {
    left: scaleWidth(8),
    alignItems: 'flex-start',
  },
  
  rightPosition: {
    right: scaleWidth(8),
    alignItems: 'flex-end',
  },

  healthBarContainer: {
    height: layoutHelpers.healthBarHeight,
    minWidth: layoutHelpers.healthBarMinWidth,
    borderRadius: RESPONSIVE.borderRadius.lg,
    borderWidth: scale(2),
    backgroundColor: 'rgba(0, 0, 0, 1)',
    overflow: 'visible',
    ...RESPONSIVE.shadow.medium,
    position: 'relative',
    marginTop: RESPONSIVE.margin.sm - 8
  },

  healthBarTrack: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RESPONSIVE.borderRadius.md,
    position: 'relative',
    overflow: 'hidden',
  },

  healthBarFillContainer: {
    height: '100%',
    borderRadius: RESPONSIVE.borderRadius.md,
    overflow: 'hidden',
  },

  healthBarFill: {
    flex: 1,
    borderRadius: RESPONSIVE.borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(1) },
    shadowOpacity: 0.2,
    shadowRadius: scale(2),
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
    fontSize: RESPONSIVE.fontSize.xs,
    fontFamily: 'DynaPuff',
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: scale(1), height: scale(1) },
    textShadowRadius: scale(2),
  },

  criticalWarning: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F44336',
    borderRadius: RESPONSIVE.borderRadius.md,
    zIndex: 3,
  },

  glowEffect: {
    position: 'absolute',
    top: scale(-4),
    left: scale(-4),
    right: scale(-4),
    bottom: scale(-4),
    borderRadius: RESPONSIVE.borderRadius.xl,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: scale(8),
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
    top: RESPONSIVE.margin.sm,
  },

  avatarContainer: {
    position: 'absolute',
    top: scale(-2),
    zIndex: 20,
  },

  leftHealthBarMargin: {
    marginLeft: layoutHelpers.avatarMedium + -20,
    marginRight: 0,
  },

  rightHealthBarMargin: {
    marginLeft: 0,
    marginRight: layoutHelpers.avatarMedium + -20,
  },

  avatarCircle: {
    width: layoutHelpers.avatarMedium,
    height: layoutHelpers.avatarMedium,
    borderRadius: RESPONSIVE.borderRadius.round,
    borderWidth: scale(2),
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 1)',
    ...RESPONSIVE.shadow.light,
  },

  avatarImage: {
    width: '100%',
    height: '190%',
  },

  avatarText: {
    fontSize: RESPONSIVE.fontSize.sm,
    color: '#FFF',
  },
});

export default Life;