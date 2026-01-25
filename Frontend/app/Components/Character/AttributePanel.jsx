import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { View, Text, Image, Animated, Pressable } from 'react-native';
import { gameScale } from '../../Components/Responsiveness/gameResponsive'; 

// --- Individual Card Component ---
const SkillCard = ({ card, index, isFlipped, onPress, styles }) => {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: isFlipped ? 1 : 0,
      friction: 8,     
      tension: 40,     
      useNativeDriver: true,
    }).start();
  }, [isFlipped]);

  // --- INTERPOLATIONS ---

  const scaleAnim = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 6.5], 
  });

  // ✅ CHANGED: Set to '1080deg' (3 full spins). 
  // This creates the "Turnado" effect while animating, 
  // but since 1080 is a full circle, it lands back on the FRONT face.
  const rotateYAnim = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '1080deg'], 
  });

  const itemTotalRowSpace = gameScale(43);
  const centerOffset = (1.5 - index) * itemTotalRowSpace;
  
  const translateXAnim = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, centerOffset], 
  });

  const moveUpDistance = gameScale(-150); 
  const translateYAnim = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, moveUpDistance], 
  });

  return (
    <Pressable onPress={onPress} style={{ zIndex: isFlipped ? 999 : 1 }}>
      <Animated.View style={[styles.skillCardWrapper, { transform: [
        { translateX: translateXAnim }, { translateY: translateYAnim },
        { scale: scaleAnim }, { rotateY: rotateYAnim } 
      ]}]}>
        
        {/* FRONT SIDE (Icon + Layered Text) */}
        {/* Overflow visible ensures the Name (hanging at the bottom) is seen */}
        <View style={[styles.cardFace, styles.cardFaceFront, { overflow: 'visible' }]}>
           
           <Image source={{ uri: card.character_attack_card }} style={styles.skillCardImage} resizeMode="contain" />

            <View style={styles.cardDamageContainer}>
              <Text style={styles.cardDamageValue}>+{card.damage_attack}</Text>
            </View>

            <View style={styles.cardNameContainer}>
              <Text style={styles.cardTitle}>{card.card_type}</Text>
            </View>

        </View>

        {/* BACK SIDE (Hidden because rotation lands on Front) */}
        <View style={[styles.cardFace, styles.cardFaceBack]}>
        </View>

      </Animated.View>
    </Pressable>
  );
};

const AttributePanel = forwardRef(({ 
  attributeData, 
  cardsData, 
  selectedHero,
  styles 
}, ref) => {
  
  const [flippedIndex, setFlippedIndex] = useState(null);

  // Animation Refs
  const slideAnims = useRef(Array(3).fill(null).map(() => new Animated.Value(0))).current;
  const fadeAnims = useRef(Array(3).fill(null).map(() => new Animated.Value(0))).current;
  const cardsSlideAnim = useRef(new Animated.Value(0)).current;
  const cardsFadeAnim = useRef(new Animated.Value(0)).current;

  const startAnimations = () => {
    setFlippedIndex(null); 

    const slideAnimations = slideAnims.map((anim, index) =>
      Animated.timing(anim, { toValue: 0, duration: 1200, delay: index * 300, useNativeDriver: true })
    );
    const fadeAnimations = fadeAnims.map((anim, index) =>
      Animated.timing(anim, { toValue: 1, duration: 1500, delay: index * 300, useNativeDriver: true })
    );

    const cardsSlide = Animated.timing(cardsSlideAnim, {
      toValue: 0, duration: 1200, delay: 900, useNativeDriver: true
    });
    const cardsFade = Animated.timing(cardsFadeAnim, {
      toValue: 1, duration: 1500, delay: 900, useNativeDriver: true
    });

    Animated.parallel([...slideAnimations, ...fadeAnimations, cardsSlide, cardsFade]).start();
  };

  const resetAnimations = () => {
    const slideDistance = gameScale(78);
    slideAnims.forEach((anim, index) => anim.setValue(index % 2 === 0 ? slideDistance : -slideDistance));
    fadeAnims.forEach(anim => anim.setValue(0));
    cardsSlideAnim.setValue(-slideDistance); 
    cardsFadeAnim.setValue(0);
    setFlippedIndex(null);
  };

  useImperativeHandle(ref, () => ({ startAnimations }));

  useEffect(() => { resetAnimations(); }, [selectedHero]);

  const handleCardPress = (index) => {
    setFlippedIndex(prev => prev === index ? null : index);
  };

  return (
    <View style={[styles.attributePanel, { overflow: 'visible' }]}>
      
      {/* Attribute Columns */}
      {attributeData.map((attr, index) => (
        <Animated.View
          key={`attr-${index}`}
          style={[styles.attributeText, attr.style, { transform: [{ translateX: slideAnims[index] }], opacity: fadeAnims[index] }]}
        >
          {attr.icon && <Image source={{ uri: attr.icon }} style={styles.heroRoleIcon} />}
          <Text style={styles.attributeTextContent}>{attr.text}</Text>
          {attr.number && <Text style={styles.attributeTextContentNumber}>{attr.number}</Text>}
        </Animated.View>
      ))}

      {/* Cards Row */}
       <Animated.View
        style={[
          styles.cardsContainerRow,
          { transform: [{ translateX: cardsSlideAnim }], opacity: cardsFadeAnim }
        ]}
      >
        {cardsData && cardsData.slice().reverse().map((card, index) => ( 
          <SkillCard 
            key={`card-${index}`}
            card={card}
            index={index}
            isFlipped={flippedIndex === index}
            onPress={() => handleCardPress(index)}
            styles={styles}
          />
        ))}
      </Animated.View>

    </View>
  );
});

export default AttributePanel;