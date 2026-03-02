import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import PopSequenceAnimation from './PopSequenceAnimation';
import { gameScale } from '../../../../Responsiveness/gameResponsive';

const popSequenceImages = [
  'https://github.com/user-attachments/assets/c7f6b7b0-d029-46b2-ad98-0f03e135877c', 
  'https://github.com/user-attachments/assets/6c00ee09-9e8c-4cf0-a8d0-076d16dab60e', 
  'https://github.com/user-attachments/assets/b6e6a306-82ef-4309-8b7c-09ffad01f5c2', 
];

const PopAnimations = ({ 
  mapName, 
  calculateContentHeight, 
}) => {

  const createInfinitePopAnimations = () => {
    if (mapName !== 'CSS') return [];

    const originalPopAnimations = [
      { id: 'pop0', top: gameScale(100), right: gameScale(10), zIndex: 50 },
      { id: 'pop1', top: gameScale(140), right: gameScale(40), zIndex: 50 },
      { id: 'pop2', top: gameScale(180), right: gameScale(30), zIndex: 50 },
      { id: 'pop3', top: gameScale(220), right: gameScale(-100), zIndex: 50 },
      { id: 'pop4', top: gameScale(260), right: gameScale(-50), zIndex: 50 },
      { id: 'pop5', top: gameScale(300), right: gameScale(-100), zIndex: 50 },
    ];

    const contentHeight = calculateContentHeight();
    const patternHeight = gameScale(305);
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
    width: gameScale(490),
    height: gameScale(420),
  },
});

export default PopAnimations;