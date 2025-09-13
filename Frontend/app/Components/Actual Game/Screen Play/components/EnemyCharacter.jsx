import React from 'react';
import { Image, StyleSheet, Dimensions, Animated } from 'react-native';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const EnemyCharacter = ({ 
  enemy, 
  index, 
  enemyPosition, 
  isAttacking, 
  isPaused 
}) => {
  const currentImage = isAttacking ? enemy.attackImage : enemy.image;

  return (
    <Animated.View 
      style={[
        styles.enemyContainer,
        {
          top: SCREEN_HEIGHT * 0.136, 
          transform: [{ 
            translateX: enemyPosition.interpolate({
              inputRange: [0, SCREEN_WIDTH * 1.1], 
              outputRange: [0, -SCREEN_WIDTH * 1.2], 
              extrapolate: 'clamp',
            })
          }],
          opacity: isPaused ? 0.5 : 1,
        }
      ]}
    >
      <Image 
        source={{ uri: currentImage }}
        style={[
          styles.enemyImage,
          isAttacking && styles.enemyAttackImage,
          isPaused && styles.pausedElement
        ]} 
        resizeMode='contain'
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  enemyContainer: {
    position: 'absolute',
    right: SCREEN_WIDTH * -0.2, 
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  
  enemyImage: {
    width: SCREEN_WIDTH * 0.23,
    height: SCREEN_HEIGHT * 0.23,
  },

  enemyAttackImage: {
    transform: [{ scale: 1.1 }],
  },
  
  pausedElement: {
    opacity: 0.6,
  },
});

export default EnemyCharacter;