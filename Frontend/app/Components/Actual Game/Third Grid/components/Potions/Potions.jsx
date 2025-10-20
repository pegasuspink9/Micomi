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
import { scale, scaleWidth, scaleHeight, hp, wp } from '../../../../Responsiveness/gameResponsive';

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

  const PotionSlot = React.memo(({ potion }) => {
    const colors = getPotionColors(potion.name);
    const isSelected = selectedPotion && selectedPotion.id === potion.id;
    const isOutOfStock = potion.count === 0;
    const isDisabled = isOutOfStock || loadingPotions || potionUsed; //  Include potionUsed

    return (
      <View style={[
        styles.potionFrame,
        { backgroundColor: colors.frameColor },
        (isOutOfStock || potionUsed) && styles.outOfStockSlot, //  Apply disabled style
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
                  (isOutOfStock || potionUsed) && styles.potionImageDisabled //  Apply disabled style
                ]}
              />
              
              <View style={[
                styles.countContainer,
                isOutOfStock && styles.countContainerDisabled,
                potionUsed && styles.countContainerDisabled,
                isSelected && styles.selectedCountContainer 
              ]}>
                <Text style={[
                  styles.countText,
                  isSelected && styles.selectedCountText 
                ]}>
                  {potion.count}
                </Text>
              </View>
              
              {/*  Potion name label */}
              <View style={styles.nameContainer}>
                <Text style={[
                  styles.nameText,
                  isSelected && styles.selectedNameText,
                  (isOutOfStock || potionUsed) && styles.nameTextDisabled //  Apply disabled style
                ]}>
                  {potion.name}
                </Text>
              </View>
            </View>
          </View>
        </Pressable>
      </View>
    );
  }, (prevProps, nextProps) => {
    return (
      JSON.stringify(prevProps.potions) === JSON.stringify(nextProps.potions) &&
      prevProps.selectedPotion?.id === nextProps.selectedPotion?.id &&
      prevProps.loadingPotions === nextProps.loadingPotions &&
      prevProps.potionUsed === nextProps.potionUsed
    );
  });

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
    paddingHorizontal: wp(4), //  Responsive padding (4% of width)
    alignItems: 'center',
  },

  potionSlotWrapper: {
    marginHorizontal: wp(1.5), //  Responsive margin (1.5% of width)
  },

  potionFrame: {
    width: scaleWidth(70),
    height: scaleHeight(70),
    borderRadius: wp(3), //  Responsive borderRadius (3% of width)
    padding: scale(2), //  Responsive padding
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: scale(6), //  Responsive shadow height
    },
    shadowOpacity: 0.4,
    shadowRadius: scale(8), //  Responsive shadow radius
    elevation: 12,
    borderTopWidth: wp(0.4), //  Responsive border width (0.4% of width)
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderLeftWidth: wp(0.4),
    borderLeftColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: wp(0.6),
    borderBottomColor: 'rgba(0, 0, 0, 0.4)',
    borderRightWidth: wp(0.4),
    borderRightColor: 'rgba(0, 0, 0, 0.3)',
  },

  potionSlot: {
    flex: 1,
    borderRadius: wp(2.5), //  Responsive borderRadius (2.5% of width)
    position: 'relative',
    overflow: 'visible',
    
    borderTopWidth: scale(2), //  Responsive border width
    borderLeftWidth: scale(2),
    borderBottomWidth: scale(3),
    borderRightWidth: scale(3),
    
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: scale(4), //  Responsive shadow height
    },
    shadowOpacity: 0.3,
    shadowRadius: scale(6), //  Responsive shadow radius
    elevation: 10,
  },

  potionSlotPressed: {
    transform: [{ translateY: scale(1) }], //  Responsive translateY
    shadowOffset: {
      width: 0,
      height: scale(2), //  Responsive shadow height
    },
    shadowOpacity: 0.2,
    borderTopWidth: scale(3), //  Responsive border width
    borderLeftWidth: scale(3),
    borderBottomWidth: scale(1),
    borderRightWidth: scale(1),
  },

  outOfStockSlot: {
    opacity: 0.4,
  },

  potionSlotInner: {
    flex: 1,
    borderRadius: wp(2), //  Responsive borderRadius (2% of width)
    padding: scale(2), //  Responsive padding
    overflow: 'hidden',
  },

  potionSlotContent: {
    flex: 1,
    borderRadius: wp(1.5), //  Responsive borderRadius (1.5% of width)
    backgroundColor: '#10075380',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    
    borderTopWidth: scale(1), //  Responsive border width
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    borderLeftWidth: scale(1),
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: scale(1),
    borderBottomColor: 'rgba(0, 0, 0, 0.3)',
    borderRightWidth: scale(1),
    borderRightColor: 'rgba(0, 0, 0, 0.2)',
  },

  potionHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderTopLeftRadius: wp(1.5), //  Responsive borderRadius
    borderTopRightRadius: wp(1.5),
    pointerEvents: 'none',
  },

  potionShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderBottomLeftRadius: wp(1.5), //  Responsive borderRadius
    borderBottomRightRadius: wp(1.5),
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
    width: scale(3), //  Responsive width
    height: scale(3), //  Responsive height
    borderRadius: scale(1.5), //  Responsive borderRadius
    backgroundColor: '#666',
  },

  dotTopLeft: {
    top: scale(4), //  Responsive position
    left: scale(4),
  },

  dotTopRight: {
    top: scale(4),
    right: scale(4),
  },

  dotBottomLeft: {
    bottom: scale(4),
    left: scale(4),
  },

  dotBottomRight: {
    bottom: scale(4),
    right: scale(4),
  },

  potionImage: {
    width: wp(80), //  Responsive width (80% of width)
    height: hp(8), //  Responsive height (8% of height)
    borderRadius: scale(8), //  Responsive borderRadius
    zIndex: 2,
    resizeMode: 'contain',
  },

  potionImageDisabled: {
    opacity: 0.3,
  },

  countContainer: {
    position: 'absolute',
    top: scale(2), //  Responsive position
    right: scale(2),
    borderRadius: scale(6), //  Responsive borderRadius
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: scale(1), //  Responsive border width
    borderColor: '#000000ff',
    backgroundColor: 'rgba(60, 4, 91, 0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(1) }, //  Responsive shadow
    shadowOpacity: 0.5,
    shadowRadius: scale(1), //  Responsive shadow radius
    elevation: 3,
    zIndex: 3,
  },

  countContainerDisabled: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderColor: '#666',
  },

  countText: {
    color: '#ffffff',
    fontSize: wp(2), //  Responsive fontSize (2% of width)
    fontFamily: 'DynaPuff',
  },

  nameContainer: {
    position: 'absolute',
    bottom: scale(-1), //  Responsive position
    left: scale(2),
    right: scale(2),
    borderRadius: scale(4), //  Responsive borderRadius
    paddingVertical: scale(1), //  Responsive padding
    paddingHorizontal: scale(2),
    zIndex: 3,
  },

  nameText: {
    color: '#ffffffff',
    fontSize: scale(8), //  Responsive fontSize
    fontFamily: 'MusicVibes',
    textAlign: 'center',
  },

  nameTextDisabled: {
    color: '#666',
  },

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


  loadingText: {
    color: '#ffffff94',
    fontSize: scale(16), //  Responsive fontSize
    fontFamily: 'DynaPuff',
  },

  emptyText: {
    color: '#ffffff94',
    fontSize: scale(14), //  Responsive fontSize
    fontFamily: 'DynaPuff',
  },
});

export default PotionGrid;