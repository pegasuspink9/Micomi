import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation
} from 'react-native-reanimated';
import { usePlayerProfile } from '../../hooks/usePlayerProfile';
import { wp, gameScale } from '../Responsiveness/gameResponsive';
import PotionDetailModal from './Badge Modal/PotionDetailModal';

export default function PotionsView() {
  const router = useRouter();
  const { playerData, loading } = usePlayerProfile();
  const [selectedPotion, setSelectedPotion] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  //  Simplified loading state - assets are already cached from Map API
  if (loading || !playerData) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#2c1810', '#4a2c1a', '#3d2115', '#5c3a22', '#2c1810']}
          locations={[0, 0.25, 0.5, 0.75, 1]}
          style={styles.backgroundContainer}
        >
          <View style={styles.backgroundOverlay} />
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading potions...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const getTotalPotions = () => {
    return playerData.potions.reduce((total, potion) => total + potion.count, 0);
  };

  const handlePotionPress = (potion) => {
    setSelectedPotion(potion);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Woody cabinet gradient background */}
      <LinearGradient
        colors={['#2c1810', '#4a2c1a', '#3d2115', '#5c3a22', '#4a2c1a', '#2c1810']}
        locations={[0, 0.2, 0.4, 0.6, 0.8, 1]}
        style={styles.backgroundContainer}
      >
        <View style={styles.backgroundOverlay} />
        
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Potion Inventory</Text>
          </View>
          <View style={styles.headerCurve} />
        </View>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Summary */}
          <View style={styles.summarySection}>
            <Text style={styles.summaryLabel}>Total Potions:</Text>
            <Text style={styles.summaryValue}>{getTotalPotions()}</Text>
          </View>

          <View style={styles.potionsGrid}>
            {playerData.potions.map((potion) => (
              <View key={potion.id} style={styles.potionGridItem}>
                <TouchableOpacity 
                  onPress={() => handlePotionPress(potion)}
                  activeOpacity={0.8}
                >
                  <View style={styles.potionBorderOuter}>
                    <View style={styles.potionBorderMiddle}>
                      <View style={styles.potionContent}>
                        <PotionCardAnimated potion={potion} />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={{ height: gameScale(20) }} />
        </ScrollView>

        <View style={styles.footerContainer}>
          <View style={styles.footerCurve} />
          <View style={styles.footer} />
        </View>
      </LinearGradient>

      {/* Potion Detail Modal */}
      <PotionDetailModal
        visible={modalVisible}
        potion={selectedPotion}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

// Animated Potion Card with Sprite Animation
const PotionCardAnimated = ({ potion }) => {
  const SPRITE_COLUMNS = 6;
  const SPRITE_ROWS = 4;
  const TOTAL_FRAMES = 24;
  const FRAME_DURATION = 40;
  const FRAME_SIZE = gameScale(100);

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
    <View style={styles.potionCard}>
      <View style={styles.cabinetLayer1}>
        <View style={styles.cabinetLayer2}>
          <View style={styles.cabinetLayer3}>
            {/* Animated Sprite Container */}
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
                  source={{ uri: potion.icon }}
                  style={styles.spriteImage}
                  resizeMode="stretch"
                />
              </Reanimated.View>
            </View>
            
            {/* Count Badge - Top Right Corner */}
            <View style={styles.potionCountBadge}>
              <Text style={styles.potionCountText}>{potion.count}</Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* Potion Name Below the Card */}
      <Text style={styles.potionName}>{potion.name}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  backgroundContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.54)', 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: gameScale(14),
    textAlign: 'center',
  },
  headerContainer: {
    position: 'relative',
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: gameScale(6),
    paddingBottom: gameScale(130),
    backgroundColor: '#3d2115',
  },
  headerCurve: {
    position: 'absolute',
    bottom: gameScale(-20),
    left: '50%',
    marginLeft: gameScale(-100), 
    width: gameScale(200),
    height: gameScale(40),
    backgroundColor: '#3d2115',
    borderBottomLeftRadius: gameScale(60),
    borderBottomRightRadius: gameScale(60),
    zIndex: 5,
  },
  footerContainer: {
    position: 'relative',
    zIndex: 10,
  },
  footer: {
    height: gameScale(90),
    backgroundColor: '#3d2115',
  },
  footerCurve: {
    position: 'absolute',
    top: gameScale(-20),
    left: '50%',
    marginLeft: gameScale(-100),
    width: gameScale(200),
    height: gameScale(40),
    backgroundColor: '#3d2115',
    borderTopLeftRadius: gameScale(60),
    borderTopRightRadius: gameScale(60),
    zIndex: 5,
  },
  backButton: {
    position: 'absolute',
    top: gameScale(20),   
    left: gameScale(20),   
    zIndex: 20,           
    padding: gameScale(0),
  },
  backButtonText: {
    color: '#ffffffff',
    fontSize: gameScale(14),
    fontFamily: 'MusicVibes',
    borderWidth: gameScale(1),
    padding: gameScale(6),
    borderColor: 'white',
    borderRadius: gameScale(6),
  },
  headerTitle: {
    position: 'absolute',
    top: gameScale(80),
    transform: [{ translateX: gameScale(36) }], 
    fontSize: gameScale(40),
    color: 'white',
    fontFamily: 'MusicVibes',
    textAlign: 'center',
    zIndex: 10,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: gameScale(12),
  },
  summarySection: {
    alignItems: 'center',
    paddingVertical: gameScale(16),
    marginTop: gameScale(80),
  },
  summaryLabel: {
    fontSize: gameScale(30),
    color: 'white',
    fontFamily: 'MusicVibes',
    marginBottom: gameScale(4),
    textShadowColor: '#773030ff',
    textShadowOffset: { width: gameScale(2), height: gameScale(2) },
    textShadowRadius: gameScale(5),
  },
  summaryValue: {
    fontSize: gameScale(30),
    color: 'white',
    fontFamily: 'Grobold',
    marginBottom: gameScale(10),
    textShadowColor: '#773030ff',
    textShadowOffset: { width: gameScale(2), height: gameScale(2) },
    textShadowRadius: gameScale(5),
  },
  potionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: gameScale(10),
    gap: gameScale(12),
  },
  potionGridItem: {
    width: '45%',
    marginBottom: gameScale(8),
  },
  potionBorderOuter: {
    backgroundColor: '#8b4513',
    borderWidth: gameScale(2),
    borderTopColor: '#5c2e0f',
    borderLeftColor: '#5c2e0f',
    borderBottomColor: '#5c2e0f',
    borderRightColor: '#5c2e0f',
    padding: gameScale(3),
    shadowColor: '#000',
    shadowOffset: { width: gameScale(2), height: gameScale(3) },
    shadowOpacity: 0.6,
    shadowRadius: gameScale(4),
    elevation: 5,
    overflow: 'hidden',
    borderRadius: gameScale(15),
  },
  potionBorderMiddle: {
    flex: 1,
    backgroundColor: '#654321',
    borderWidth: gameScale(2),
    borderTopColor: '#5c2e0f',
    borderLeftColor: '#5c2e0f',
    borderBottomColor: '#5c2e0f',
    borderRightColor: '#5c2e0f',
    padding: gameScale(2),
    borderRadius: gameScale(15),
    overflow: 'hidden',
  },
  potionContent: {
    alignItems: 'center',
    overflow: 'hidden',
  },
  potionCard: {
    alignItems: 'center',
    width: '100%',
  },
  cabinetLayer1: {
    width: gameScale(90),
    height: gameScale(90),
    borderRadius: gameScale(12),
    padding: gameScale(3),
  },
  cabinetLayer2: {
    flex: 1,
    backgroundColor: '#65432186',
    borderRadius: gameScale(9),
    borderWidth: gameScale(2),
    borderTopColor: '#8b6914',
    borderLeftColor: '#8b6914',
    borderBottomColor: '#3e2723',
    borderRightColor: '#3e2723',
    padding: gameScale(2),
  },
  cabinetLayer3: {
    flex: 1,
    backgroundColor: '#a0512d7c',
    borderRadius: gameScale(6),
    borderWidth: gameScale(1),
    borderColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  spriteContainer: {
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: gameScale(1), height: gameScale(2) },
    shadowOpacity: 0.5,
    shadowRadius: gameScale(3),
    elevation: 3,
  },
  spriteSheet: {},
  spriteImage: {
    width: '100%',
    height: '100%',
  },
  potionCountBadge: {
    position: 'absolute',
    top: gameScale(-5),
    right: gameScale(-2),
    borderRadius: gameScale(12),
    paddingHorizontal: gameScale(8),
    paddingVertical: gameScale(3),
    minWidth: gameScale(24),
    alignItems: 'center',
    zIndex: 10,
  },
  potionCountText: {
    fontSize: gameScale(12),
    color: '#ffffff',
    fontFamily: 'DynaPuff',
  },
  potionName: {
    fontSize: gameScale(15),
    color: '#f4e7d1ff',
    textAlign: 'center',
    fontFamily: 'FunkySign',
    textShadowColor: '#000000',
    textShadowOffset: { width: gameScale(1), height: gameScale(1) },
    textShadowRadius: gameScale(3),
    maxWidth: gameScale(90),
    marginTop: gameScale(4),
  },
});