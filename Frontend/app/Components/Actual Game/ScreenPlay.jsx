import React, { useRef, useEffect, useMemo, useState } from 'react';
import { View, ImageBackground, Image, Dimensions, StyleSheet, Animated } from 'react-native';
import LottieView from 'lottie-react-native';
import enemiesData from './GameData';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ScreenPlay({ isPaused = false }) {
  const [attackingEnemies, setAttackingEnemies] = useState(new Set());
  
  const timeoutsRef = useRef([]);
  const animationsRef = useRef([]);
  const hasInitialized = useRef(false);
  const currentEnemyIndex = useRef(0);
  const isEnemyRunning = useRef(false);
  
  const enemies = useMemo(() => {
    return enemiesData.map((enemy, index) => ({
      duration: enemy.seconds * 1000,
      image: enemy.enemyImage,
      attackImage: enemy.enemyAttack,
    }));
  }, []);

  const enemyPositions = useMemo(() => 
    enemies.map(() => new Animated.Value(0)), 
    [enemies.length]
  );

  const clearAllAnimations = () => {
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current = [];
    
    animationsRef.current.forEach(animation => animation.stop());
    animationsRef.current = [];
  };

  const startNextEnemy = () => {
    if (currentEnemyIndex.current >= enemies.length || isPaused || isEnemyRunning.current) {
      return;
    }
    
    const index = currentEnemyIndex.current;
    const enemy = enemies[index];
    
    console.log(`Starting enemy ${index}`);
    isEnemyRunning.current = true;
    
    startSingleEnemyAnimation(enemy, index);
  };

  const startSingleEnemyAnimation = (enemy, index) => {
    const ENEMY_START = SCREEN_WIDTH * 0.8;
    const DOG_POSITION = SCREEN_WIDTH * 0.2;
    const ENEMY_END = SCREEN_WIDTH * -0.2;
    
    const totalTravelDistance = ENEMY_START - ENEMY_END;
    const distanceToHitDog = ENEMY_START - DOG_POSITION;
    const hitTimeRatio = distanceToHitDog / totalTravelDistance;
    const exactHitTime = enemy.duration * hitTimeRatio;
    
    const hitTimeout = setTimeout(() => {
      if (!isPaused) {
        console.log(`⚡ COLLISION! Enemy ${index} hits dog after ${exactHitTime}ms`);
        
        setAttackingEnemies(prev => new Set([...prev, index]));
        
        const attackEndTimeout = setTimeout(() => {
          setAttackingEnemies(prev => {
            const newSet = new Set(prev);
            newSet.delete(index);
            return newSet;
          });
        }, 500);
        
        timeoutsRef.current.push(attackEndTimeout);
      }
    }, exactHitTime);
    
    timeoutsRef.current.push(hitTimeout);

    const animation = Animated.timing(enemyPositions[index], {
      toValue: SCREEN_WIDTH * 1.1,
      duration: enemy.duration,
      useNativeDriver: false,
    });
    
    animationsRef.current.push(animation);
    
    animation.start(({ finished }) => {
      if (finished && !isPaused) {
        const resetTimeout = setTimeout(() => {
          enemyPositions[index].setValue(0);
          isEnemyRunning.current = false;
          currentEnemyIndex.current++;
          
          const nextEnemyTimeout = setTimeout(() => {
            startNextEnemy();
          }, 1000);
          
          timeoutsRef.current.push(nextEnemyTimeout);
        }, 500);
        
        timeoutsRef.current.push(resetTimeout);
      }
    });
  };

  const startAnimations = () => {
    if (hasInitialized.current) return;
    
    clearAllAnimations();
    enemyPositions.forEach(position => position.setValue(0));
    hasInitialized.current = true;
    currentEnemyIndex.current = 0;
    isEnemyRunning.current = false;

    startNextEnemy();
  };

  const resumeAnimations = () => {
    let resumedFromPause = false;
    
    enemies.forEach((enemy, index) => {
      if (enemyPositions[index]) {
        const currentPosition = enemyPositions[index]._value || 0;
        
        if (currentPosition > 0 && currentPosition < SCREEN_WIDTH * 1.1) {
          const remainingDistance = SCREEN_WIDTH * 1.1 - currentPosition;
          const totalDistance = SCREEN_WIDTH * 1.1;
          const remainingTime = (remainingDistance / totalDistance) * enemy.duration;
          
          if (remainingTime > 0) {
            console.log(`Resuming enemy ${index} from position ${currentPosition}`);
            isEnemyRunning.current = true;
            resumedFromPause = true;
            
            // Calculate remaining collision time based on current position
            const ENEMY_START = SCREEN_WIDTH * 0.8;
            const DOG_POSITION = SCREEN_WIDTH * 0.2;
            const ENEMY_END = SCREEN_WIDTH * -0.2;
            
            const totalTravelDistance = ENEMY_START - ENEMY_END;
            const distanceToHitDog = ENEMY_START - DOG_POSITION;
            const hitTimeRatio = distanceToHitDog / totalTravelDistance;
            const totalHitTime = enemy.duration * hitTimeRatio;
            
            // Calculate how much of the hit time has already passed
            const progressRatio = currentPosition / (SCREEN_WIDTH * 1.1);
            const elapsedTime = enemy.duration * progressRatio;
            const remainingHitTime = Math.max(0, totalHitTime - elapsedTime);
            
            // Set up collision timeout for remaining time
            if (remainingHitTime > 0) {
              const hitTimeout = setTimeout(() => {
                if (!isPaused) {
                  console.log(`⚡ COLLISION! Enemy ${index} hits dog (resumed)`);
                  
                  setAttackingEnemies(prev => new Set([...prev, index]));
                  
                  const attackEndTimeout = setTimeout(() => {
                    setAttackingEnemies(prev => {
                      const newSet = new Set(prev);
                      newSet.delete(index);
                      return newSet;
                    });
                  }, 500);
                  
                  timeoutsRef.current.push(attackEndTimeout);
                }
              }, remainingHitTime);
              
              timeoutsRef.current.push(hitTimeout);
            }
            
            const animation = Animated.timing(enemyPositions[index], {
              toValue: SCREEN_WIDTH * 1.1,
              duration: remainingTime,
              useNativeDriver: false,
            });
            
            animationsRef.current.push(animation);
            
            animation.start(({ finished }) => {
              if (finished && !isPaused) {
                const resetTimeout = setTimeout(() => {
                  enemyPositions[index].setValue(0);
                  isEnemyRunning.current = false;
                  currentEnemyIndex.current = index + 1;
                  
                  const nextEnemyTimeout = setTimeout(() => {
                    startNextEnemy();
                  }, 1000);
                  
                  timeoutsRef.current.push(nextEnemyTimeout);
                }, 500);
                
                timeoutsRef.current.push(resetTimeout);
              }
            });
          }
        }
      }
    });
    
    if (!resumedFromPause && !isEnemyRunning.current) {
      startNextEnemy();
    }
  };

  useEffect(() => {
    if (isPaused) {
      animationsRef.current.forEach(animation => animation.stop());
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current = [];
      
      console.log('Game paused');
    } else {
      if (!hasInitialized.current) {
        startAnimations();
      } else {
        resumeAnimations();
      }
      
      console.log('Game resumed');
    }

    return () => {
      clearAllAnimations();
    };
  }, [isPaused]);

  const dogProps = {
    source: { uri: "https://lottie.host/e1ae2f92-3c33-4e02-b1a8-cf241779b1d0/CIm4y0FTDa.lottie" },
    style: [
      styles.dogRunImage,
      isPaused && styles.pausedElement
    ],
    autoPlay: !isPaused,
    loop: !isPaused,
    speed: isPaused ? 0 : 1,
    resizeMode: 'contain',
    cacheComposition: true,
    renderMode: 'HARDWARE'
  };

  return (
    <View style={styles.container}>
      <ImageBackground 
        source={{ uri: 'https://github.com/user-attachments/assets/15d02305-04b3-4bd3-885a-1440fadf61fc' }}
        style={[styles.firstGrid, isPaused && styles.pausedBackground]}
      >
        <View style={[styles.dogRun, isPaused && styles.pausedElement]}>
          <LottieView {...dogProps} />
        </View>

        {enemies.map((enemy, index) => {
          if (!enemyPositions[index]) return null;
          
          const currentImage = attackingEnemies.has(index) ? enemy.attackImage : enemy.image;
          
          return (
            <Animated.View 
              key={`enemy-${index}`} 
              style={[
                styles.enemyContainer,
                {
                  top: SCREEN_HEIGHT * 0.136, 
                  transform: [{ 
                    translateX: enemyPositions[index].interpolate({
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
                  attackingEnemies.has(index) && styles.enemyAttackImage,
                  isPaused && styles.pausedElement
                ]} 
                resizeMode='contain'
              />
            </Animated.View>
          );
        })}
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  
  firstGrid: {
    minHeight: SCREEN_HEIGHT * 0.32,
    backgroundColor: '#ff6b6b',
  },
  
  pausedBackground: {
    backgroundColor: '#d4544d',
  },
  
  dogRun: {
    position: 'absolute',
    left: 0,
    top: SCREEN_HEIGHT * 0.07,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  
  dogRunImage: {
    width: SCREEN_WIDTH * 0.34,
    height: SCREEN_HEIGHT * 0.34,
  },
  
  pausedElement: {
    opacity: 0.6,
  },
  
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
  
});