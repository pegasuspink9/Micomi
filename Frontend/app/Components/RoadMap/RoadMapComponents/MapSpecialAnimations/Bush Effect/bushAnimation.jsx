import React, { useRef, useEffect } from 'react';
import { View, Image, Animated, Dimensions, StyleSheet } from 'react-native'; 
import { gameScale } from '../../../../Responsiveness/gameResponsive';

const BushAnimations = ({ 
  mapName, 
  calculateContentHeight, 
}) => {
  const bushSwayAnim = useRef(new Animated.Value(0)).current;

  // CONDITIONAL bush animation - only for HTML/greenLand
  useEffect(() => {
    if (mapName === 'HTML') {
      const swayAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(bushSwayAnim, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: true
          }),
          Animated.timing(bushSwayAnim, {
            toValue: 0,
            duration: 4000,
            useNativeDriver: true
          })
        ])
      );
      
      swayAnimation.start();
      
      return () => swayAnimation.stop();
    }
  }, [bushSwayAnim, mapName]);

  const bushTransform = bushSwayAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 1]
  });

  const bushTransformRight = bushSwayAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 1]
  });

  // CONDITIONAL bush creation - only for HTML
  const createInfiniteBushes = () => {
    if (mapName !== 'HTML') return [];

    const originalBushes = [
      { id: 'bush0', top: gameScale(200), zIndex: 100, right: gameScale(10) },
      { id: 'bush1', top: gameScale(280), zIndex: 100, right: gameScale(12) },
      { id: 'bush2', top: gameScale(380), zIndex: 100, right: gameScale(100) },
      { id: 'bush3', top: gameScale(450), zIndex: 100, right: gameScale(170) },
      { id: 'bush4', top: gameScale(550), zIndex: 100, right: gameScale(220) },
      { id: 'bush5', top: gameScale(650), zIndex: 100, right: gameScale(240) },
      { id: 'bush6', top: gameScale(750), zIndex: 100, right: gameScale(80) },
      { id: 'bush11', top: gameScale(200), right: gameScale(-330), zIndex: 100 },
      { id: 'bush12', top: gameScale(300), right: gameScale(-350), zIndex: 100 },
      { id: 'bush13', top: gameScale(400), right: gameScale(-250), zIndex: 100 },
      { id: 'bush14', top: gameScale(500), right: gameScale(-140), zIndex: 100 },
      { id: 'bush15', top: gameScale(600), right: gameScale(-160), zIndex: 100 },
      { id: 'bush16', top: gameScale(1100), right: gameScale(-190), zIndex: 100 },
      { id: 'bush17', top: gameScale(700), right: gameScale(-280), zIndex: 100 },
    ];

    const contentHeight = calculateContentHeight();
    const patternHeight = gameScale(620);
    const repetitions = Math.ceil(contentHeight / patternHeight) + 5;
    
    const allBushes = [];
    
    for (let i = 0; i < repetitions; i++) {
      originalBushes.forEach((bush) => {
        allBushes.push({
          ...bush,
          id: `${bush.id}-repeat-${i}`,
          top: bush.top + (i * patternHeight),
          zIndex: bush.zIndex + i
        });
      });
    }
    
    return allBushes;
  };

  // Don't render anything if not HTML map
  if (mapName !== 'HTML') return null;

  return (
    <View style={styles.bushEffects}>
      {/* Right side bushes */}
      <Animated.View
        style={{
          transform: [{ translateX: bushTransform }], 
          zIndex: 100
        }}
      >
        {createInfiniteBushes()
          .filter(bush => bush.right >= 0)
          .map((bush) => (
            <Image 
              key={bush.id}
              source={{ uri: 'https://github.com/user-attachments/assets/449d431f-1b95-44f1-b1bc-dfaa2cf830a6' }} 
              style={[
                styles.bush,
                {
                  top: bush.top,
                  right: bush.right,
                  zIndex: bush.zIndex,
                }
              ]} 
            />
          ))
        }
      </Animated.View>

      {/* Left side bushes */}
      <Animated.View 
        style={{
          transform: [{ translateX: bushTransformRight }],
          zIndex: 100
        }}
      >
        {createInfiniteBushes()
          .filter(bush => bush.right < 0)
          .map((bush) => (
            <Image 
              key={bush.id}
              source={{ uri: 'https://github.com/user-attachments/assets/449d431f-1b95-44f1-b1bc-dfaa2cf830a6' }} 
              style={[
                styles.bush,
                {
                  top: bush.top,
                  right: bush.right,
                  zIndex: bush.zIndex,
                }
              ]} 
            />
          ))
        }
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  bushEffects: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    pointerEvents: 'none',
  },
  bush: {
    position: 'absolute',
    width: gameScale(370), 
    height: gameScale(180), 
  },
});

export default BushAnimations;