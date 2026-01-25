import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, Text, Image, Animated } from 'react-native';
import { gameScale } from '../../Components/Responsiveness/gameResponsive'; 

const AttributePanel = forwardRef(({ 
  attributeData, 
  cardsData, 
  selectedHero,
  styles 
}, ref) => {
  
  // 1. Existing Attribute Animations (3 items)
  const slideAnims = useRef(
    Array(3).fill(null).map(() => new Animated.Value(0))
  ).current;
  
  const fadeAnims = useRef(
    Array(3).fill(null).map(() => new Animated.Value(0))
  ).current;

  // 2. New Card Container Animation (Treating it as the 4th Panel)
  const cardsSlideAnim = useRef(new Animated.Value(0)).current;
  const cardsFadeAnim = useRef(new Animated.Value(0)).current;

  const startAnimations = () => {
    // Animate the first 3 panels
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

    // Animate the Cards (4th Panel) - Starts after the 3rd panel (Damage)
    const cardsSlide = Animated.timing(cardsSlideAnim, {
      toValue: 0,
      duration: 1200,
      delay: 900, // 3 * 300ms delay
      useNativeDriver: true,
    });

    const cardsFade = Animated.timing(cardsFadeAnim, {
      toValue: 1,
      duration: 1500,
      delay: 900,
      useNativeDriver: true,
    });

    Animated.parallel([
      ...slideAnimations, 
      ...fadeAnimations,
      cardsSlide,
      cardsFade
    ]).start();
  };

  const resetAnimations = () => {
    const slideDistance = gameScale(78);
    
    // Reset Attributes (Left, Right, Left)
    slideAnims.forEach((anim, index) => {
      anim.setValue(index % 2 === 0 ? slideDistance : -slideDistance);
    });
    fadeAnims.forEach(anim => anim.setValue(0));

    // Reset Cards (4th item = Right Side, so slide from positive)
    cardsSlideAnim.setValue(-slideDistance); 
    cardsFadeAnim.setValue(0);
  };

  useImperativeHandle(ref, () => ({
    startAnimations
  }));

  useEffect(() => {
    resetAnimations();
  }, [selectedHero]);

  return (
    // Overflow visible allows the Right-aligned panels to stick out of the center container
    <View style={[styles.attributePanel, { overflow: 'visible' }]}>
      
      {attributeData.map((attr, index) => (
        <Animated.View
          key={`attr-${index}`}
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

      {/* 4. Cards Panel (No Background, Row Style, Aligned Right) */}
      <Animated.View
        style={[
          styles.cardsContainerRow, // New style for positioning
          {
            transform: [{ translateX: cardsSlideAnim }],
            opacity: cardsFadeAnim
          }
        ]}
      >
        {cardsData && cardsData.map((card, index) => (
          <Image 
            key={`card-${index}`}
            source={{ uri: card.character_attack_card }} 
            style={styles.cardImageSmall}
            resizeMode="contain"
          />
        ))}
      </Animated.View>

    </View>
  );
});

export default AttributePanel;