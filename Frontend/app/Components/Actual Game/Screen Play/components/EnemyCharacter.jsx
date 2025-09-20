import React, { useState, useEffect, useRef } from 'react';
import { Image, StyleSheet, Dimensions, Animated } from 'react-native';
import LottieView from 'lottie-react-native';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const EnemyCharacter = ({ 
  enemy, 
  index, 
  enemyPosition, 
  isAttacking, 
  isPaused,
  currentEnemyIndex = 0,
  totalEnemies = 1
}) => {
  const [shouldRenderLottie, setShouldRenderLottie] = useState(false);
  const [isPreloaded, setIsPreloaded] = useState(false);
  const lottieRef = useRef(null);
  const currentImage = isAttacking ? enemy.attackImage : enemy.image;

  useEffect(() => {
    const isCurrentEnemy = index === currentEnemyIndex;
    const isNextEnemy = index === currentEnemyIndex + 1;
    const isPreviousEnemy = index === currentEnemyIndex - 1;
    
    // More stable rendering logic - once loaded, keep it loaded longer
    if (isCurrentEnemy || isNextEnemy || (isPreviousEnemy && index >= 0)) {
      const listener = enemyPosition.addListener(({ value }) => {
        // Less aggressive unloading - keep enemies loaded longer
        const shouldRender = value >= -SCREEN_WIDTH * 0.8; // Increased buffer
        setShouldRenderLottie(shouldRender);
      });

      const currentValue = enemyPosition._value || 0;
      setShouldRenderLottie(currentValue >= -SCREEN_WIDTH * 0.8);

      return () => {
        enemyPosition.removeListener(listener);
      };
    } else {
      // Delay unloading to prevent glitching
      const unloadTimeout = setTimeout(() => {
        setShouldRenderLottie(false);
        setIsPreloaded(false);
      }, 1000); // 1 second delay before unloading

      return () => clearTimeout(unloadTimeout);
    }
  }, [enemyPosition, index, currentEnemyIndex]);

  // Preload logic
  useEffect(() => {
    const isCurrentOrNext = index === currentEnemyIndex || index === currentEnemyIndex + 1;
    if (isCurrentOrNext && !isPreloaded) {
      setIsPreloaded(true);
    }
  }, [currentEnemyIndex, index, isPreloaded]);

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
      {shouldRenderLottie ? (
        <LottieView
          ref={lottieRef}
          source={{ uri: currentImage }}
          style={[
            styles.enemyImage,
            isAttacking && styles.enemyAttackImage,
            isPaused && styles.pausedElement
          ]} 
          autoPlay={!isPaused}
          loop={true}
          speed={isPaused ? 0 : 1}
          resizeMode='contain'
          cacheComposition={true}
          renderMode='HARDWARE'
          hardwareAccelerationAndroid={true}
          imageAssetsFolder={''}
          enableMergePathsAndroidForKitKatAndAbove={true}
          onAnimationLoaded={() => {
            console.log(`Enemy ${index} Lottie loaded`);
          }}
          onAnimationFailure={(error) => {
            console.warn(`Enemy ${index} Lottie failed:`, error);
          }}
        />
      ) : (
        <Animated.View style={[styles.enemyImage, { backgroundColor: 'transparent' }]} />
      )}
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