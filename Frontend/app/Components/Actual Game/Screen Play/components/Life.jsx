import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Animated, Text, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const Life = ({ 
  health = 300, 
  maxHealth = 300,
  onHealthChange = null,
  animated = true
}) => {
  const [animatedValues] = useState(() => 
    Array(7).fill(0).map(() => new Animated.Value(1))
  );
  const [previousHealth, setPreviousHealth] = useState(health);

  // Calculate hearts state based on health
  const getHeartStates = () => {
    const heartsData = [];
    const healthPerHeart = maxHealth / 5; 
    
    for (let i = 0; i < 7; i++) {
      const heartMinHealth = i * healthPerHeart;
      const heartMaxHealth = (i + 1) * healthPerHeart;
      
      let heartState = 'empty';
      
      if (health > heartMaxHealth) {
        heartState = 'full';
      } else if (health > heartMinHealth) {
        const healthInThisHeart = health - heartMinHealth;
        const fillPercentage = healthInThisHeart / healthPerHeart;
        
        if (fillPercentage >= 0.75) {
          heartState = 'full';
        } else if (fillPercentage >= 0.5) {
          heartState = 'half';
        } else if (fillPercentage >= 0.25) {
          heartState = 'quarter';
        } else {
          heartState = 'empty';
        }
      }
      
      heartsData.push({
        index: i,
        state: heartState,
        isActive: health > heartMinHealth
      });
    }
    
    return heartsData;
  };

  const heartsData = getHeartStates();

  // Animate hearts when health changes
  useEffect(() => {
    if (animated && health !== previousHealth) {
      const isHealthLoss = health < previousHealth;
      
      heartsData.forEach((heart, index) => {
        if (isHealthLoss && !heart.isActive && previousHealth > index * 50) {
          // Heart lost - animate out
          Animated.sequence([
            Animated.timing(animatedValues[index], {
              toValue: 1.3,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(animatedValues[index], {
              toValue: 0.8,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(animatedValues[index], {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        } else if (!isHealthLoss && heart.isActive && previousHealth <= index * 50) {
          Animated.sequence([
            Animated.timing(animatedValues[index], {
              toValue: 0.5,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(animatedValues[index], {
              toValue: 1.2,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(animatedValues[index], {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();
        }
      });
      
      setPreviousHealth(health);
      
      if (onHealthChange) {
        onHealthChange(health, maxHealth);
      }
    }
  }, [health, previousHealth, animated, heartsData, onHealthChange]);

  // Get heart icon and color based on state
  const getHeartDisplay = (heartData) => {
    const { state } = heartData;
    
    switch (state) {
      case 'full':
        return {
          icon: 'heart',
          color: 'rgba(255, 2, 23, 1)',
        };
      case 'half':
        return {
          icon: 'heart-half',
          color: 'rgba(255, 107, 122, 1)',
        };
      case 'quarter':
        return {
          icon: 'heart-outline',
          color: 'rgba(255, 142, 149, 1)',
        };
      case 'empty':
      default:
        return {
          icon: 'heart-outline',
          color: '#95A5A6',
        };
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.heartsRow}>
        {heartsData.map((heartData) => {
          const heartDisplay = getHeartDisplay(heartData);
         
          return (
            <Animated.View
              key={heartData.index}
              style={[
                styles.heartContainer,
                {
                  transform: animated 
                    ? [{ scale: animatedValues[heartData.index] }]
                    : [{ scale: 1 }]
                }
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
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: width * 0.02,
    left: width * 0.03,
    alignItems: 'flex-start',
    borderRadius: 8,
    padding: 8,
    maxWidth: width * 0.2,
  },
  heartsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  heartContainer: {
    marginHorizontal: 1,
  },
});

export default Life;