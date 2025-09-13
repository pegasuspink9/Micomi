import { Animated, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Make sure all functions are exported
export const calculateCollisionTiming = (enemy) => {
  const ENEMY_START = SCREEN_WIDTH * 0.8;
  const DOG_POSITION = SCREEN_WIDTH * 0.2;
  const ENEMY_END = SCREEN_WIDTH * -0.2;
  
  const totalTravelDistance = ENEMY_START - ENEMY_END;
  const distanceToHitDog = ENEMY_START - DOG_POSITION;
  const hitTimeRatio = distanceToHitDog / totalTravelDistance;
  const exactHitTime = enemy.duration * hitTimeRatio;
  
  return { exactHitTime, totalTravelDistance };
};

export const createEnemyAnimation = (enemyPosition, duration) => {
  return Animated.timing(enemyPosition, {
    toValue: SCREEN_WIDTH * 1.1,
    duration,
    useNativeDriver: false,
  });
};

export const calculateResumeAnimation = (enemy, currentPosition) => {
  const remainingDistance = SCREEN_WIDTH * 1.1 - currentPosition;
  const totalDistance = SCREEN_WIDTH * 1.1;
  const remainingTime = (remainingDistance / totalDistance) * enemy.duration;
  
  const ENEMY_START = SCREEN_WIDTH * 0.8;
  const DOG_POSITION = SCREEN_WIDTH * 0.2;
  const ENEMY_END = SCREEN_WIDTH * -0.2;
  
  const totalTravelDistance = ENEMY_START - ENEMY_END;
  const distanceToHitDog = ENEMY_START - DOG_POSITION;
  const hitTimeRatio = distanceToHitDog / totalTravelDistance;
  const totalHitTime = enemy.duration * hitTimeRatio;
  
  const progressRatio = currentPosition / (SCREEN_WIDTH * 1.1);
  const elapsedTime = enemy.duration * progressRatio;
  const remainingHitTime = Math.max(0, totalHitTime - elapsedTime);
  
  return { remainingTime, remainingHitTime };
};