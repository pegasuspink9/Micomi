import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import PopSequenceAnimation from './PopSequenceAnimation';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

const popSequenceImages = [
  'https://github.com/user-attachments/assets/c7f6b7b0-d029-46b2-ad98-0f03e135877c', 
  'https://github.com/user-attachments/assets/6c00ee09-9e8c-4cf0-a8d0-076d16dab60e', 
  'https://github.com/user-attachments/assets/b6e6a306-82ef-4309-8b7c-09ffad01f5c2', 
];

const PopAnimations = ({ 
  mapName, 
  calculateContentHeight, 
  getResponsiveValues 
}) => {

  const createInfinitePopAnimations = () => {
    if (mapName !== 'CSS') return [];

    const responsive = getResponsiveValues();
    const isLargerThanPhone = screenWidth > 500 || screenHeight > 900;

    const originalPopAnimations = [
      { id: 'pop0', top: 100, right: isLargerThanPhone ? -10 * responsive.heightRatio : 10 * responsive.heightRatio, zIndex: 50 },
      { id: 'pop1', top: 140, right: isLargerThanPhone ? -10 * responsive.heightRatio : 40 * responsive.heightRatio, zIndex: 50 },
      { id: 'pop2', top: 180, right: isLargerThanPhone ? 50 * responsive.heightRatio : 30 * responsive.heightRatio, zIndex: 50 },
      { id: 'pop3', top: 220, right: isLargerThanPhone ? -200 * responsive.heightRatio : -100 * responsive.heightRatio, zIndex: 50 },
      { id: 'pop4', top: 260, right: isLargerThanPhone ? -60 * responsive.heightRatio : -50 * responsive.heightRatio, zIndex: 50 },
      { id: 'pop5', top: 300, right: isLargerThanPhone ? -60 * responsive.heightRatio : -100 * responsive.heightRatio, zIndex: 50 },
    ];

    const contentHeight = calculateContentHeight();
    const patternHeight = 305;
    const repetitions = Math.ceil(contentHeight / patternHeight) + 5;

    const allPopAnimations = [];

    for (let i = 0; i < repetitions; i++) {
      originalPopAnimations.forEach((pop) => {
        allPopAnimations.push({
          ...pop,
          id: `${pop.id}-repeat-${i}`,
          top: pop.top + (i * patternHeight),
          zIndex: pop.zIndex + i,
        });
      });
    }
    return allPopAnimations;
  };

  // Don't render anything if not CSS map
  if (mapName !== 'CSS') return null;

  return (
    <View style={styles.lavaEffects}>
      {createInfinitePopAnimations().map((popData, index) => (
        <PopSequenceAnimation
          key={popData.id}
          images={popSequenceImages}
          duration={300}
          interval={1000}
          shouldAnimate={true}
          style={[
            styles.popAnimationBase,
            {
              top: popData.top,
              right: popData.right,
              zIndex: popData.zIndex,
            }
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  lavaEffects: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    pointerEvents: 'none',
  },
  popAnimationBase: {
    position: 'absolute',
    width: 490,
    height: 420,
  },
});

export default PopAnimations;