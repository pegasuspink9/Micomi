import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, Text, Image, Animated, Dimensions } from 'react-native';
import { gameScale } from '../Responsiveness/gameResponsive'; 

const { width: screenWidth } = Dimensions.get('window');

const AttributePanel = forwardRef(({ 
  attributeData, 
  selectedHero,
  styles 
}, ref) => {
  const slideAnims = useRef(
    Array(3).fill(null).map(() => new Animated.Value(0))
  ).current;
  
  const fadeAnims = useRef(
    Array(3).fill(null).map(() => new Animated.Value(0))
  ).current;

  const startAnimations = () => {
    const slideAnimations = slideAnims.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 0,
        duration: 1200,
        delay: index * 300,
        useNativeDriver: true,
      })
    );

    const fadeAnimations = fadeAnims.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 1500,
        delay: index * 300,
        useNativeDriver: true,
      })
    );

    Animated.parallel([...slideAnimations, ...fadeAnimations]).start();
  };

  const resetAnimations = () => {

    const slideDistance = gameScale(78);
    
    slideAnims.forEach((anim, index) => {
      anim.setValue(index % 2 === 0 ? slideDistance : -slideDistance);
    });
    fadeAnims.forEach(anim => anim.setValue(0));
  };

  useImperativeHandle(ref, () => ({
    startAnimations
  }));

  useEffect(() => {
    resetAnimations();
  }, [selectedHero]);

  return (
    <View style={styles.attributePanel}>
      {attributeData.map((attr, index) => (
        <Animated.View
          key={index}
          style={[
            styles.attributeText,
            attr.style,
            {
              transform: [{ translateX: slideAnims[index] }],
              opacity: fadeAnims[index]
            }
          ]}
        >
          {attr.icon && <Image source={{ uri: attr.icon }} style={styles.heroRoleIcon} />}
          <Text style={styles.attributeTextContent}>{attr.text}</Text>
          {attr.number && <Text style={styles.attributeTextContentNumber}>{attr.number}</Text>}
        </Animated.View>
      ))}
    </View>
  );
});

export default AttributePanel;