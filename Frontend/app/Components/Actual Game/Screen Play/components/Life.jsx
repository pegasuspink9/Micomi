import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const Life = ({ 
  health = 0, 
  maxHealth = 0,
  onHealthChange = null,
  animated = true,
  position = 'left' 
}) => {
  const heartsCount = Math.ceil(health / 50); 

  const [animatedValues] = useState(() => 
    Array(heartsCount).fill(0).map(() => new Animated.Value(1))
  );
  const [previousHealth, setPreviousHealth] = useState(health);

  const getHeartStates = () => {
    const heartsData = [];
    
    for (let i = 0; i < heartsCount; i++) {
      const heartMinHealth = i * 20;
      const heartMaxHealth = (i + 1) * 20;
      
      let heartState = 'empty';
      
      if (health >= heartMaxHealth) {
        heartState = 'full';
      } else if (health > heartMinHealth) {
        const healthInThisHeart = health - heartMinHealth;
        const fillPercentage = healthInThisHeart / 20;
        
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

  useEffect(() => {
  // Always log on mount or whenever health/maxHealth changes
  if (onHealthChange) {
    onHealthChange(health, maxHealth);
  }

  if (animated && health !== previousHealth) {
    const isHealthLoss = health < previousHealth;

    heartsData.forEach((heart, index) => {
      if (isHealthLoss && !heart.isActive && previousHealth > index * 20) {
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
  }
  }, [health, maxHealth, animated, previousHealth, heartsData, animatedValues, onHealthChange]);


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

  return (
    <View style={[
      styles.container,
      position === 'left' ? styles.leftPosition : styles.rightPosition
    ]}>
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
    borderRadius: 8,
    padding: 8,
    maxWidth: width * 0.2,
  },
  leftPosition: {
    left: width * 0.03,
    alignItems: 'flex-start',
  },
  rightPosition: {
    right: width * 0.03,
    alignItems: 'flex-end',
  },
  heartsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap', 
    marginBottom: 4,
  },
  heartContainer: {
    marginHorizontal: 1,
    marginVertical: 2,
  },
});

export default Life;
