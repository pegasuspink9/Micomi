import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  Image,
  Pressable
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PotionGrid = ({ 
  potions = [
      { id: 1, name: 'Health', count: 3, image: 'https://github.com/user-attachments/assets/062f823a-2381-4a64-8c83-9c6d9349b24a' },
    { id: 2, name: 'Strong', count: 1, image: 'https://github.com/user-attachments/assets/e368c20c-e7fa-46ec-8b66-1334ac2de1d2' },
    { id: 3, name: 'Hint', count: 2, image: 'https://github.com/user-attachments/assets/ff2e041c-9f7b-438c-91e6-1f371cfe1966' }
  ],
  onPotionPress
}) => {
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
      }
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
        
      <View style={[
        styles.potionNameContainer,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
        }
      ]}>
          <Text style={[
            styles.potionName,
            potion && potion.count === 0 && styles.potionNameDisabled
          ]}>
            {potion ? potion.name : ''}
          </Text>
      </View>

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

  // Create 3x3 grid with potions and empty slots
  const createGrid = () => {
    const grid = [];
    for (let i = 0; i < potions.length; i++) {
      const potion = potions[i];
      grid.push(
        <PotionSlot 
          key={i} 
          potion={potion} 
          isEmpty={!potion}
        />
      );
    }
    return grid;
  };

  return (
    <View style={styles.gridContainer}>
      {createGrid()}
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
    padding: SCREEN_WIDTH * 0.04,
  },

  potionFrame: {
    width: '26%',
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
    // Pressed state - invert the 3D effect (same as AnswerOption)
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
    width: '70%',
    height: SCREEN_WIDTH * 0.16,
    borderRadius: 30,
    zIndex: 2,
  },

  potionImageDisabled: {
    opacity: 0.5,
  },

  potionNameContainer: {
    position: 'absolute',
    top: 55,
    alignSelf: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 2,
    zIndex: 10, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 8,
  },

  potionName: {
    fontSize: 10,
    color: '#fff',
    fontFamily: 'DynaPuff', 
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  potionNameDisabled: {
    color: '#888',
  },

  countContainer: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: '#0824428d',
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
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'monospace', // Console font
  },
});

export default PotionGrid;