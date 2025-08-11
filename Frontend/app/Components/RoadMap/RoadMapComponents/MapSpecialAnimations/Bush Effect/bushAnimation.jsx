import React, { useRef, useEffect } from 'react';
import { View, Image, Animated, Dimensions, StyleSheet } from 'react-native'; // ADD StyleSheet import

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

const BushAnimations = ({ 
  mapName, 
  calculateContentHeight, 
  getResponsiveValues 
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

    const responsive = getResponsiveValues();
    const isLargerThanPhone = screenWidth > 500 || screenHeight > 900;

    const originalBushes = [
      { id: 'bush0', top: 200, zIndex: 100, right: isLargerThanPhone ? 380 * responsive.heightRatio : 10 * responsive.heightRatio },
      { id: 'bush1', top: 280, zIndex: 100, right: isLargerThanPhone ? 370 * responsive.heightRatio : 12 * responsive.heightRatio },
      { id: 'bush2', top: 380, zIndex: 100, right: isLargerThanPhone ? 350 * responsive.heightRatio : 100 },
      { id: 'bush3', top: 450, zIndex: 100, right: isLargerThanPhone ? 320 * responsive.heightRatio : 170 },
      { id: 'bush4', top: 550, zIndex: 100, right: isLargerThanPhone ? 350 * responsive.heightRatio : 220 },
      { id: 'bush5', top: 650, zIndex: 100, right: isLargerThanPhone ? 408 * responsive.heightRatio : 240 },
      { id: 'bush6', top: 750, zIndex: 100, right: isLargerThanPhone ? 360 * responsive.heightRatio : 80 },
      { id: 'bush11', top: 200, right: isLargerThanPhone ? -190 * responsive.heightRatio : -330, zIndex: 100 },
      { id: 'bush12', top: 300, right: isLargerThanPhone ? -220 * responsive.heightRatio : -350, zIndex: 100 },
      { id: 'bush13', top: 400, right: isLargerThanPhone ? -200 * responsive.heightRatio : -250, zIndex: 100 },
      { id: 'bush14', top: 500, right: isLargerThanPhone ? -230 * responsive.heightRatio : -140, zIndex: 100 },
      { id: 'bush15', top: 600, right: isLargerThanPhone ? -190 * responsive.heightRatio : -160, zIndex: 100 },
      { id: 'bush16', top: 1100, right: isLargerThanPhone ? -240 * responsive.heightRatio : -190, zIndex: 100 },
      { id: 'bush17', top: 700, right: isLargerThanPhone ? -280 * responsive.heightRatio : -280, zIndex: 100 },
    ];

    const contentHeight = calculateContentHeight();
    const patternHeight = 620;
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
    width: 450,
    height: 450,
  },
});

export default BushAnimations;