import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  Image,
  Pressable
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';


const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PotionGrid = ({ 
  potions = [
      { id: 1, name: 'Health', count: 3, image: 'https://github.com/user-attachments/assets/765b1917-5b6a-4156-9d38-0acbdbfc909a' },
    { id: 2, name: 'Strong', count: 1, image: 'https://github.com/user-attachments/assets/3264eb79-0afd-4987-8c64-6d46b0fc03a0' },
    { id: 3, name: 'Hint', count: 2, image: 'https://github.com/user-attachments/assets/1fb726a5-f63d-44f4-8e33-8d9c961940ff' },
    { id: 4, name: 'Immune', count: 2, image: 'https://github.com/user-attachments/assets/d2a4ab58-2d5d-4e35-80b2-71e591bdd297' },
  ],
  onPotionPress
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const getPotionColors = (name) => {
    const colorMap = {
      'Health': {
        background: 'rgba(220, 38, 38, 1)', 
        border: '#dc2626', 
        frameColor: '#991b1b', 
        innerColor: '#f87171', 
        pressedColor: '#b91c1c' 
      },
      'Strong': {
        background: 'rgba(245, 159, 11, 1)', 
        border: '#f59e0b', 
        frameColor: '#d97706', 
        innerColor: '#fbbf24',
        pressedColor: '#ea580c' 
      },
      'Hint': {
        background: 'rgba(37, 100, 235, 1)', 
        border: '#2563eb', 
        frameColor: '#1d4ed8', 
        innerColor: '#60a5fa', 
        pressedColor: '#1e40af' 
      },
      'Mana': {
        background: 'rgba(0, 213, 255, 0.44)', 
        border: '#00d5ff',
        frameColor: '#0891b2',
        innerColor: '#22d3ee',
        pressedColor: '#0e7490'
      },
    };
    
    return colorMap[name] || {
      background: 'rgba(0, 213, 255, 0.44)', // Default cyan
      border: '#00d5ff',
      frameColor: '#0891b2',
      innerColor: '#22d3ee',
      pressedColor: '#0e7490'
    };
  };

  const PotionSlot = ({ potion, isEmpty = false }) => {
    const colors = potion ? getPotionColors(potion.name) : getPotionColors('default');
    
    return (
    <View style={[
      styles.potionFrame,
      { backgroundColor: colors.frameColor },
      isEmpty && styles.emptySlot,
      potion && potion.count === 0 && styles.outOfStockSlot
    ]}>
      <Pressable 
        style={({ pressed }) => [
          styles.potionSlot,
          {
            backgroundColor: colors.border,
            borderTopColor: colors.innerColor,
            borderLeftColor: colors.innerColor,
            borderBottomColor: colors.frameColor,
            borderRightColor: colors.frameColor,
          },
          pressed && !isEmpty && potion && potion.count > 0 && [
            styles.potionSlotPressed,
            { backgroundColor: colors.pressedColor }
          ]
        ]}
        onPress={() => potion && potion.count > 0 && onPotionPress && onPotionPress(potion)}
        disabled={!potion || potion.count === 0}
      >
        
       

        <View style={styles.potionSlotInner}>
          <View style={styles.potionSlotContent}>
            <View style={styles.potionHighlight} />
            <View style={styles.potionShadow} />
            
            {/* Decorative dots */}
            <View style={styles.dotsContainer}>
              <View style={[styles.dot, styles.dotTopLeft]} />
              <View style={[styles.dot, styles.dotTopRight]} />
              <View style={[styles.dot, styles.dotBottomLeft]} />
              <View style={[styles.dot, styles.dotBottomRight]} />
            </View>
            
            {!isEmpty && potion && (
              <>
                <Image 
                  source={{ uri: potion.image }} 
                  style={[
                    styles.potionImage,
                    potion.count === 0 && styles.potionImageDisabled
                  ]}
                />
                <View style={[
                  styles.countContainer,
                  potion.count === 0 && styles.countContainerDisabled
                ]}>
                  <Text style={styles.countText}>{potion.count}</Text>
                </View>
              </>
            )}
          </View>
        </View>
      </Pressable>
    </View>
    );
  };

  // Compute pixel positions so arrows sit just outside the centered potion container
  const CONTAINER_PCT = 0.12;
  const CONTAINER_WIDTH = SCREEN_WIDTH * CONTAINER_PCT;
  const ARROW_SIZE = SCREEN_WIDTH * 0.1; 
  const GAP = 10; // small gap between potion frame and arrow

  const leftArrowLeft = (SCREEN_WIDTH / 3.2) - (CONTAINER_WIDTH / 2) - GAP;
  const rightArrowLeft = (SCREEN_WIDTH / 2) + (CONTAINER_WIDTH / 2) + GAP;

  const createSingleView = () => {
    const potion = potions && potions.length > 0 ? potions[currentIndex] : null;
    return (
      <View style={styles.singleWrapper}>
        <View style={styles.singleSlotContainer}>
          <PotionSlot potion={potion} isEmpty={!potion} />
        </View>

        {/* Left arrow - absolutely positioned just outside left edge */}
        <Pressable
          style={({ pressed }) => [
            styles.arrowButton,
            { left: leftArrowLeft, width: ARROW_SIZE, height: ARROW_SIZE, marginTop: -(ARROW_SIZE/2) },
            currentIndex === 0 && styles.arrowDisabled,
            pressed && styles.arrowPressed
          ]}
          onPress={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)}
          disabled={currentIndex === 0}
        >
            <Image source={{uri: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1758945991/469163197-5f2b8e72-f49e-4f06-8b76-40b580289d54_mf5hcw.png'}}  style={[styles.arrowImage, styles.flippedHorizontal]}  />
        </Pressable>

        {/* Right arrow - absolutely positioned just outside right edge */}
        <Pressable
          style={({ pressed }) => [
            styles.arrowButton,
            { left: rightArrowLeft, width: ARROW_SIZE, height: ARROW_SIZE, marginTop: -(ARROW_SIZE/2) },
            currentIndex >= (potions.length - 1) && styles.arrowDisabled,
            pressed && styles.arrowPressed
          ]}
          onPress={() => currentIndex < (potions.length - 1) && setCurrentIndex(currentIndex + 1)}
          disabled={currentIndex >= (potions.length - 1)}
        > 
        <Image source={{uri: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1758945991/469163197-5f2b8e72-f49e-4f06-8b76-40b580289d54_mf5hcw.png'}} style={styles.arrowImage} />
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.gridContainer}>
      {createSingleView()}
    </View>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    alignItems: 'flex-start',
    paddingTop: SCREEN_WIDTH * 0.02,
  },

  arrowImage:{
    width: SCREEN_WIDTH * 0.2,
    height: SCREEN_WIDTH * 0.2,
    resizeMode: 'contain',
  },

  flippedHorizontal: {
    transform: [{ scaleX: -1 }],
  },

  // wrapper centers the potionFrame; arrows are absolutely positioned to sit centered vertically near it
  singleWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: SCREEN_WIDTH * 0.02,
  },

  singleSlotContainer: {
    width: '22%', 
    alignItems: 'center',
    justifyContent: 'center',
  },

  arrowButton: {
    // size set dynamically to keep same visual size; base visuals kept here
    borderRadius: SCREEN_WIDTH * 0.02,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    position: 'absolute',
  },

  arrowText: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
  },

  arrowDisabled: {
    opacity: 0.3,
  },

  arrowPressed: {
    transform: [{ translateY: 1 }],
  },

  potionFrame: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: SCREEN_WIDTH * 0.03,
    padding: 2,
    marginBottom: SCREEN_WIDTH * 0.02,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 12,
    // Outer 3D frame (same as AnswerOption)
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(0, 0, 0, 0.4)',
    borderRightWidth: 2,
    borderRightColor: 'rgba(0, 0, 0, 0.3)',
  },

  potionSlot: {
    flex: 1,
    borderRadius: SCREEN_WIDTH * 0.025,
    position: 'relative',
    overflow: 'visible',
    
    // Console-style 3D borders (same as AnswerOption)
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },

  potionSlotPressed: {
    transform: [{ translateY: 1 }],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderBottomWidth: 1,
    borderRightWidth: 1,
  },

  emptySlot: {
    opacity: 0.3,
  },

  outOfStockSlot: {
    opacity: 0.6,
  },

  potionSlotInner: {
    flex: 1,
    borderRadius: SCREEN_WIDTH * 0.02,
    padding: 2,
    overflow: 'hidden',
  },

  potionSlotContent: {
    flex: 1,
    borderRadius: SCREEN_WIDTH * 0.015,
    backgroundColor: '#10075380',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    
    // Inner content borders for extra depth (same as AnswerOption)
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.3)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.2)',
  },

  potionHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderTopLeftRadius: SCREEN_WIDTH * 0.015,
    borderTopRightRadius: SCREEN_WIDTH * 0.015,
    pointerEvents: 'none',
  },

  potionShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderBottomLeftRadius: SCREEN_WIDTH * 0.015,
    borderBottomRightRadius: SCREEN_WIDTH * 0.015,
    pointerEvents: 'none',
  },

  dotsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },

  dot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#666',
  },

  dotTopLeft: {
    top: 6,
    left: 6,
  },

  dotTopRight: {
    top: 6,
    right: 6,
  },

  dotBottomLeft: {
    bottom: 6,
    left: 6,
  },

  dotBottomRight: {
    bottom: 6,
    right: 6,
  },

  potionImage: {
    width: '100%',
    height: SCREEN_WIDTH * 0.19,
    borderRadius: 30,
    zIndex: 2,
  },

  potionImageDisabled: {
    opacity: 0.5,
  },




  potionNameDisabled: {
    color: '#888',
  },

  countContainer: {
    position: 'absolute',
    top: 3,
    right: 3,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 5,
    zIndex: 3,
  },


  countText: {
    color: '#ffffff94',
    fontSize: 10,
    fontFamily: 'DynaPuff', 
  },
});

export default PotionGrid;
