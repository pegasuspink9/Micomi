import React, { useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation
} from 'react-native-reanimated';
import { gameScale, wp } from '../../Responsiveness/gameResponsive';


const { width: SCREEN_WIDTH } = Dimensions.get('screen');
const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 0;

const PotionDetailModal = ({ visible, potion, onClose }) => {
  if (!visible) {
    return null;
  }
  if (!potion) return null;

  return (
    <TouchableOpacity 
      style={styles.fullScreenOverlay} 
      activeOpacity={1} 
      onPress={onClose}
    >
      <View style={styles.modalContentWrapper}>
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={(e) => e.stopPropagation()}
          style={styles.touchableContent}
        >
          <View style={styles.floatingContainer}>
            <ModalPotionSprite icon={potion.icon} />
            
            <ScrollView 
              style={styles.floatingTextScrollView} 
              contentContainerStyle={styles.scrollContentContainer} 
              showsVerticalScrollIndicator={false}
            >
              {/* Potion Name */}
              <Text style={styles.floatingName}>{potion.name}</Text>
              
              {/* Potion Description */}
              <Text style={styles.floatingDescription}>{potion.description}</Text>
              
              {/* Attributes Grid - 2 Columns */}
              <View style={styles.attributesContainer}>
                {/* Type Row */}
                <View style={styles.attributeRow}>
                  <View style={styles.attributeItem}>
                    <Text style={styles.attributeLabel}>Type</Text>
                    <Text style={styles.attributeValue}>
                      {potion.type}
                    </Text>
                  </View>
                  
                  {/* Price */}
                  <View style={styles.attributeItem}>
                    <Text style={styles.attributeLabel}>Price</Text>
                    <Text style={styles.attributeValue}>{potion.price}</Text>
                  </View>
                </View>
                
                {/* In Stock Row */}
                <View style={styles.attributeRow}>
                  <View style={styles.attributeItem}>
                    <Text style={styles.attributeLabel}>In Stock</Text>
                    <Text style={[
                      styles.attributeValue
                    ]}>
                      {potion.count}
                    </Text>
                  </View>
                  
                  {/* Rarity */}
                  <View style={styles.attributeItem}>
                    <Text style={styles.attributeLabel}>Rarity</Text>
                    <Text style={styles.attributeValue}>{potion.rarity || 'Common'}</Text>
                  </View>
                </View>
              </View>
              
            </ScrollView>
          </View>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

// Animated Sprite for Modal
const ModalPotionSprite = ({ icon }) => {
  const SPRITE_COLUMNS = 6;
  const SPRITE_ROWS = 4;
  const TOTAL_FRAMES = 24;
  const FRAME_DURATION = 40;
  const FRAME_SIZE = gameScale(300);

  const frameIndex = useSharedValue(0);

  useEffect(() => {
    frameIndex.value = withRepeat(
      withTiming(TOTAL_FRAMES - 1, {
        duration: TOTAL_FRAMES * FRAME_DURATION,
        easing: Easing.linear,
      }),
      -1,
      false
    );
    return () => cancelAnimation(frameIndex);
  }, []);

  const spriteSheetStyle = useAnimatedStyle(() => {
    const index = Math.floor(frameIndex.value);
    const col = index % SPRITE_COLUMNS;
    const row = Math.floor(index / SPRITE_COLUMNS);
    return {
      transform: [
        { translateX: -col * FRAME_SIZE },
        { translateY: -row * FRAME_SIZE },
      ],
    };
  });

  return (
    <View style={[styles.spriteContainer, { width: FRAME_SIZE, height: FRAME_SIZE }]}>
      <Reanimated.View style={[
        styles.spriteSheet,
        {
          width: FRAME_SIZE * SPRITE_COLUMNS,
          height: FRAME_SIZE * SPRITE_ROWS
        },
        spriteSheetStyle
      ]}>
        <Image
          source={{ uri: icon }}
          style={styles.spriteImage}
          resizeMode="stretch"
        />
      </Reanimated.View>
    </View>
  );
};

const styles = StyleSheet.create({
    fullScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000, 
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? STATUS_BAR_HEIGHT : 0,
  },
  modalContentWrapper: {
    width: wp(90),
    maxWidth: SCREEN_WIDTH - gameScale(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchableContent: {
    width: '100%',
    alignItems: 'center',
  },
  floatingContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: gameScale(10),
  },
  spriteContainer: {
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: gameScale(2), height: gameScale(4) },
    shadowOpacity: 0.5,
    shadowRadius: gameScale(6),
    elevation: 5,
  },
  spriteSheet: {
    // Dynamic size set in-line
  },
  spriteImage: {
    width: '100%',
    height: '100%',
  },
  floatingTextScrollView: {
    width: '100%',
    maxHeight: gameScale(280),
  },
  scrollContentContainer: {
    alignItems: 'center',
    paddingBottom: gameScale(20),
  },
  floatingName: {
    fontSize: gameScale(28),
    fontFamily: 'MusicVibes',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: gameScale(12),
    textShadowColor: '#773030ff',
    textShadowOffset: { width: gameScale(2), height: gameScale(2) },
    textShadowRadius: gameScale(4),
  },
  floatingDescription: {
    fontSize: gameScale(12),
    fontFamily: 'DynaPuff',
    color: '#dddddd',
    textAlign: 'center',
    marginBottom: gameScale(20),
    paddingHorizontal: gameScale(10),
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: gameScale(1), height: gameScale(1) },
    textShadowRadius: gameScale(3),
  },
  
  // Attributes Grid - 2 Columns
  attributesContainer: {
    width: '100%',
    paddingHorizontal: gameScale(5),
  },
  attributeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: gameScale(12),
  },
  attributeItem: {
    flex: 1,
    backgroundColor: 'rgba(61, 33, 21, 0.85)',
    borderRadius: gameScale(12),
    paddingVertical: gameScale(12),
    paddingHorizontal: gameScale(10),
    marginHorizontal: gameScale(4),
    alignItems: 'center',
    borderWidth: gameScale(1),
    borderTopColor: '#8b6914',
    borderLeftColor: '#8b6914',
    borderBottomColor: '#3e2723',
    borderRightColor: '#3e2723',
  },
  attributeLabel: {
    fontSize: gameScale(12),
    fontFamily: 'Grobold',
    color: '#aaaaaa',
    marginBottom: gameScale(4),
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: gameScale(1), height: gameScale(1) },
    textShadowRadius: gameScale(2),
  },
  attributeValue: {
    fontSize: gameScale(16),
    fontFamily: 'Grobold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: gameScale(1), height: gameScale(1) },
    textShadowRadius: gameScale(3),
  },
});

export default PotionDetailModal;