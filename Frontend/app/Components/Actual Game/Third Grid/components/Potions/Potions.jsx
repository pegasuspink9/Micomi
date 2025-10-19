import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  Image,
  Pressable,
  ScrollView
} from 'react-native';
import { SCREEN } from '../../../../Responsiveness/gameResponsive';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PotionGrid = ({ 
  potions = [],
  onPotionPress,
  selectedPotion = null, 
  loadingPotions = false,
  potionUsed = false
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
      },
      'Mana': {
        background: 'rgba(0, 213, 255, 0.44)', 
        border: '#00d5ff',
        frameColor: '#0891b2',
        innerColor: '#22d3ee',
        pressedColor: '#0e7490'
      },
      'Freeze': {
        background: 'rgba(168, 85, 247, 0.8)', 
        border: '#a855f7',
        frameColor: '#7c3aed',
        innerColor: '#c4b5fd',
        pressedColor: '#6d28d9'
      },
      'Speed': {
        background: 'rgba(34, 197, 94, 0.8)', 
        border: '#22c55e',
        frameColor: '#16a34a',
        innerColor: '#86efac',
        pressedColor: '#15803d'
      },
      'Immune': {
        background: 'rgba(156, 163, 175, 0.8)', 
        border: '#9ca3af',
        frameColor: '#6b7280',
        innerColor: '#d1d5db',
        pressedColor: '#4b5563'
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

  const PotionSlot = ({ potion }) => {
    const colors = getPotionColors(potion.name);
    const isSelected = selectedPotion && selectedPotion.id === potion.id;
    const isOutOfStock = potion.count === 0;
    const isDisabled = isOutOfStock || loadingPotions || potionUsed; // ✅ Include potionUsed

    return (
      <View style={[
        styles.potionFrame,
        { backgroundColor: colors.frameColor },
        (isOutOfStock || potionUsed) && styles.outOfStockSlot, // ✅ Apply disabled style
        isSelected && styles.selectedPotionFrame 
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
            pressed && !isDisabled && [
              styles.potionSlotPressed,
              { backgroundColor: colors.pressedColor }
            ],
            isSelected && styles.selectedPotionSlot 
          ]}
          onPress={() => !isDisabled && onPotionPress && onPotionPress(potion)} 
          disabled={isDisabled} 
        >
          <View style={styles.potionSlotInner}>
            <View style={[
              styles.potionSlotContent,
              isSelected && styles.selectedPotionContent
            ]}>
              <View style={styles.potionHighlight} />
              <View style={styles.potionShadow} />
              
              {/* Decorative dots */}
              <View style={styles.dotsContainer}>
                <View style={[styles.dot, styles.dotTopLeft]} />
                <View style={[styles.dot, styles.dotTopRight]} />
                <View style={[styles.dot, styles.dotBottomLeft]} />
                <View style={[styles.dot, styles.dotBottomRight]} />
              </View>
              
              <Image 
                source={{ uri: potion.image }} 
                style={[
                  styles.potionImage,
                  (isOutOfStock || potionUsed) && styles.potionImageDisabled // ✅ Apply disabled style
                ]}
              />
              
              <View style={[
                styles.countContainer,
                isOutOfStock && styles.countContainerDisabled,
                potionUsed && styles.countContainerDisabled, // ✅ Apply disabled style
                isSelected && styles.selectedCountContainer 
              ]}>
                <Text style={[
                  styles.countText,
                  isSelected && styles.selectedCountText 
                ]}>
                  {potion.count}
                </Text>
              </View>
              
              {/* ✅ Potion name label */}
              <View style={styles.nameContainer}>
                <Text style={[
                  styles.nameText,
                  isSelected && styles.selectedNameText,
                  (isOutOfStock || potionUsed) && styles.nameTextDisabled // ✅ Apply disabled style
                ]}>
                  {potion.name}
                </Text>
              </View>
            </View>
          </View>
        </Pressable>
      </View>
    );
  };

    if (loadingPotions) {
      return (
        <View style={[styles.gridContainer, styles.centerContent]}>
          <Text style={styles.loadingText}>Loading potions...</Text>
        </View>
      );
    }

    if (!potions || potions.length === 0) {
      return (
        <View style={[styles.gridContainer, styles.centerContent]}>
          <Text style={styles.emptyText}>No potions available</Text>
        </View>
      );
    }

    return (
      <View style={styles.gridContainer}>
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
          style={styles.scrollView}
        >
          {potions.map((potion, index) => (
            <View key={potion.id || index} style={styles.potionSlotWrapper}>
              <PotionSlot potion={potion} />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

const styles = StyleSheet.create({
  gridContainer: {
    flex: 1,
  },

  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  scrollView: {
    flex: 1,
  },

  scrollContainer: {
    paddingHorizontal: SCREEN_WIDTH * 0.04,
    alignItems: 'center',
  },

  potionSlotWrapper: {
    marginHorizontal: SCREEN_WIDTH * 0.015,
  },

  potionFrame: {
    width: SCREEN_WIDTH * 0.18,
    height: SCREEN_WIDTH * 0.20,
    borderRadius: SCREEN_WIDTH * 0.03,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 12,
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

  outOfStockSlot: {
    opacity: 0.4,
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
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#666',
  },

  dotTopLeft: {
    top: 4,
    left: 4,
  },

  dotTopRight: {
    top: 4,
    right: 4,
  },

  dotBottomLeft: {
    bottom: 4,
    left: 4,
  },

  dotBottomRight: {
    bottom: 4,
    right: 4,
  },

  potionImage: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_HEIGHT * 0.08,
    borderRadius: 8,
    zIndex: 2,
    resizeMode: 'contain',
  },

  potionImageDisabled: {
    opacity: 0.3,
  },

  countContainer: {
    position: 'absolute',
    top: 2,
    right: 2,
    borderRadius: 6,
    minWidth: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
    elevation: 3,
    zIndex: 3,
  },

  countContainerDisabled: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderColor: '#666',
  },

  countText: {
    color: '#ffffff',
    fontSize: 9,
    fontFamily: 'DynaPuff',
    fontWeight: 'bold',
  },

  nameContainer: {
    position: 'absolute',
    bottom: -1,
    left: 2,
    right: 2,
    borderRadius: 4,
    paddingVertical: 1,
    paddingHorizontal: 2,
    zIndex: 3,
  },

  nameText: {
    color: '#ffffffff',
    fontSize: 8,
    fontFamily: 'MusicVibes',
    textAlign: 'center',
  },

  nameTextDisabled: {
    color: '#666',
  },

  // ✅ Selected styles
  selectedPotionFrame: {
    borderTopColor: 'rgba(255, 255, 255, 0.8)',
    borderLeftColor: 'rgba(255, 255, 255, 0.8)',
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
    borderRightColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#fff',
    shadowOpacity: 0.6,
    transform: [{ scale: 1.05 }],
  },

  selectedPotionSlot: {
    borderTopColor: 'rgba(255, 255, 255, 0.9)',
    borderLeftColor: 'rgba(255, 255, 255, 0.9)',
  },

  selectedPotionContent: {
    borderTopColor: 'rgba(255, 255, 255, 0.4)',
    borderLeftColor: 'rgba(255, 255, 255, 0.3)',
  },

  selectedCountContainer: {
    borderColor: '#ffeb3b',
    shadowColor: '#ffeb3b',
    backgroundColor: 'rgba(255, 235, 59, 0.9)',
  },

  selectedCountText: {
    color: '#000',
    fontWeight: 'bold',
  },

  selectedNameText: {
    color: '#ffeb3b',
    fontWeight: 'bold',
  },

  // ✅ Loading and empty states
  loadingText: {
    color: '#ffffff94',
    fontSize: 16,
    fontFamily: 'DynaPuff',
  },

  emptyText: {
    color: '#ffffff94',
    fontSize: 14,
    fontFamily: 'DynaPuff',
  },
});

export default PotionGrid;