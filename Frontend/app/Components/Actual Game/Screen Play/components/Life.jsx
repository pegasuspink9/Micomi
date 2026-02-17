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
  isEnemy = false,
  startDelay = 0,
  trigger = 0
}) => {
  const effectiveMax = Math.max(0, Math.floor(maxHealth));
  
  // Animation refs
  const healthBarAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // FIX: Use a ref for the "source of truth" health to compare against.
  // This prevents re-renders from resetting the comparison value.
  const previousHealthRef = useRef(health);
  const [delayedHealth, setDelayedHealth] = useState(health);
  const delayTimeoutRef = useRef(null);

  const displayHealth = Math.max(0, Math.min(delayedHealth, effectiveMax));

  const getAvatarUrl = () => {
    return avatarUrl;
  };

  // 3-Layer border colors - Blue for player, Red for enemy
  const getBorderColors = () => {
    if (isEnemy) {
      return {
        outerBg: '#5f1e1e',
        outerBorderTop: '#330d0d',
        outerBorderBottom: '#872d2d',
        middleBg: '#4a1515',
        middleBorderTop: '#d94a4a',
        middleBorderBottom: '#290a0a',
        innerBg: 'rgba(217, 74, 74, 0.15)',
        innerBorder: 'rgba(217, 74, 74, 0.3)',
        avatarBg: '#3d1515',
      };
    }
    return {
      outerBg: '#1e3a5f',
      outerBorderTop: '#0d1f33',
      outerBorderBottom: '#2d5a87',
      middleBg: '#152d4a',
      middleBorderTop: '#4a90d9',
      middleBorderBottom: '#0a1929',
      innerBg: 'rgba(74, 144, 217, 0.15)',
      innerBorder: 'rgba(74, 144, 217, 0.3)',
      avatarBg: '#15293d',
    };
  };

  const borderColors = getBorderColors();
  const healthPercentage = effectiveMax > 0 ? (displayHealth / effectiveMax) * 100 : 0;

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

    // FIX: Compare against the ref, not state
    const previousHealth = previousHealthRef.current;

    if (!animated || health === previousHealth) {
      // No change, just sync up
      previousHealthRef.current = health;
      setDelayedHealth(health);
      return;
    }

    const isLoss = health < previousHealth;
    const isGain = health > previousHealth;

    // FIX: Apply delay only on health loss
    const animationDelay = isLoss ? startDelay : 0;

    // Clear any pending timeout from a previous change
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current);
    }

    // FIX: Update the ref INSIDE the timeout so it doesn't get overwritten
    // before the animation has a chance to run.
    delayTimeoutRef.current = setTimeout(() => {
      // Update the ref here, AFTER the delay
      previousHealthRef.current = health;
      setDelayedHealth(health);
      
      if (isLoss) {
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
    }, animationDelay);

    // Cleanup timeout on unmount or re-render
    return () => {
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
      }
    };
  }, [health, maxHealth, animated, startDelay, trigger]);

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
        {/* 3-Layer Avatar Border */}
        <View style={[
          styles.avatarContainer,
          position === 'left' ? styles.leftAvatarPosition : styles.rightAvatarPosition
        ]}>
          <View style={[
            styles.avatarBorderOuter,
            {
              backgroundColor: borderColors.outerBg,
              borderTopColor: borderColors.outerBorderTop,
              borderLeftColor: borderColors.outerBorderTop,
              borderBottomColor: borderColors.outerBorderBottom,
              borderRightColor: borderColors.outerBorderBottom,
            }
          ]}>
            <View style={[
              styles.avatarBorderMiddle,
              {
                backgroundColor: borderColors.middleBg,
                borderTopColor: borderColors.middleBorderTop,
                borderLeftColor: borderColors.middleBorderTop,
                borderBottomColor: borderColors.middleBorderBottom,
                borderRightColor: borderColors.middleBorderBottom,
              }
            ]}>
              <View style={[
                styles.avatarBorderInner,
                {
                  backgroundColor: borderColors.innerBg,
                  borderColor: borderColors.innerBorder,
                }
              ]}>
                <View style={[styles.avatarCircle, { backgroundColor: borderColors.avatarBg }]}>
                  <Image 
                    source={{ uri: getAvatarUrl() }}
                    style={[
                      styles.avatarImage,
                      isEnemy && position === 'right' && { 
                        transform: [{ translateX: gameScale(-20) }],
                        width: gameScale(85),
                        marginTop: gameScale(-10),  // Adjust margin top as needed (positive values move it down)
                      }
                    ]}
                    resizeMode="cover"
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
        
        {/* 3-Layer Health Bar Border */}
        <View style={[
          styles.healthBarWrapper,
          position === 'left' ? styles.leftHealthBarMargin : styles.rightHealthBarMargin
        ]}>
          <View style={[
            styles.healthBorderOuter,
            {
              backgroundColor: borderColors.outerBg,
              borderTopColor: borderColors.outerBorderTop,
              borderLeftColor: borderColors.outerBorderTop,
              borderBottomColor: borderColors.outerBorderBottom,
              borderRightColor: borderColors.outerBorderBottom,
            }
          ]}>
            <View style={[
              styles.healthBorderMiddle,
              {
                backgroundColor: borderColors.middleBg,
                borderTopColor: borderColors.middleBorderTop,
                borderLeftColor: borderColors.middleBorderTop,
                borderBottomColor: borderColors.middleBorderBottom,
                borderRightColor: borderColors.middleBorderBottom,
              }
            ]}>
              <View style={[
                styles.healthBorderInner,
                {
                  backgroundColor: borderColors.innerBg,
                  borderColor: borderColors.innerBorder,
                }
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
              </View>
            </View>
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
    top: gameScale(5),
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

  healthBarWrapper: {
    position: 'relative',
    marginTop: 0,
  },

  // 3-Layer Health Bar Border
  healthBorderOuter: {
    borderRadius: gameScale(12),
    borderWidth: gameScale(1),
    overflow: 'hidden',
  },
  healthBorderMiddle: {
    borderRadius: gameScale(10),
    borderWidth: gameScale(1),
    overflow: 'hidden',
  },
  healthBorderInner: {
    borderRadius: gameScale(8),
    overflow: 'hidden',
  },

  healthBarTrack: {
    height: gameScale(16),
    minWidth: gameScale(90),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: gameScale(6),
    position: 'relative',
    overflow: 'hidden',
  },

  healthBarFillContainer: {
    height: '100%',
    borderRadius: gameScale(6),
    overflow: 'hidden',
  },

  healthBarFill: {
    flex: 1,
    borderRadius: gameScale(6),
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
    borderRadius: gameScale(6),
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
    elevation: gameScale(8),
    zIndex: -1,
  },

  leftAvatarPosition: {
    left: 0,
  },

  rightAvatarPosition: {
    right: 0
  },

  lifeContainer: {
    top: gameScale(8),
  },

  avatarContainer: {
    position: 'absolute',
    top: gameScale(-6),
    zIndex: 20,
  },

  leftHealthBarMargin: {
    marginLeft: gameScale(32),
    marginRight: 0,
  },

  rightHealthBarMargin: {
    marginLeft: 0,
    marginRight: gameScale(32),
  },

  // 3-Layer Avatar Border
  avatarBorderOuter: {
    borderRadius: gameScale(50),
    borderWidth: gameScale(1),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: gameScale(2) },
    shadowOpacity: 0.3,
    shadowRadius: gameScale(4),
    elevation: gameScale(4),
  },
  avatarBorderMiddle: {
    borderRadius: gameScale(50),
    borderWidth: gameScale(1),
  },
  avatarBorderInner: {
    borderRadius: gameScale(50),
    borderWidth: gameScale(1),
  },

  avatarCircle: {
    width: gameScale(40),
    height: gameScale(40),
    borderRadius: gameScale(50),
    overflow: 'hidden',
  },

  avatarImage: {
    width: '100%',
    height: gameScale(70),
  },

  avatarText: {
    fontSize: gameScale(12),
    color: '#FFF',
  },
});


export default Life;