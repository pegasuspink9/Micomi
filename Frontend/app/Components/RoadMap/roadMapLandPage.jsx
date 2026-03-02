import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Pressable, Image, Dimensions, Text} from "react-native";
import { useLocalSearchParams, useRouter } from 'expo-router'; 
import { LinearGradient } from 'expo-linear-gradient';

// Import the universal component
import UniversalMapLevel from "./MapLevel/universalMapLevel";
import MapHeader from '../Map/mapHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { universalAssetPreloader } from '../../services/preloader/universalAssetPreloader';
import { DEFAULT_THEME } from './MapLevel/MapDatas/mapData';
import { gameScale } from '../Responsiveness/gameResponsive';

export default function RoadMapLandPage() {
  const { mapName } = useLocalSearchParams();
  const router = useRouter();
  const [focusedLevel, setFocusedLevel] = useState(null);

  const getCachedAssetUrl = (url) => {
    return universalAssetPreloader.getCachedAssetPath(url);
  };

  const ICON_IMAGES = useMemo(() => ({
    shopButton: getCachedAssetUrl(DEFAULT_THEME?.icons?.shopButton || DEFAULT_THEME.icons.shopButton),
  }), []);

  return (
    <View style={styles.container}>
      <View style={styles.headerOverlay}>
        <MapHeader />
      </View>
      
      <View style={styles.body}>
        
        {/* UPDATED: Woody Focus Info Banner mimicking PotionShop Frame */}
        {focusedLevel && (
          <View style={styles.focusBannerContainer}>
            <View style={styles.woodyFrame}>
              
              {/* --- 3D DOTS (Bolts/Rivets) --- */}
              <View style={[styles.cornerDot, styles.dotTopLeft]} />
              <View style={[styles.cornerDot, styles.dotTopRight]} />
              <View style={[styles.cornerDot, styles.dotBottomLeft]} />
              <View style={[styles.cornerDot, styles.dotBottomRight]} />

              <View style={styles.woodySlot}>
                <View style={styles.woodySlotContent}>
                  <View style={styles.woodyHighlight} />
                  <View style={styles.woodyShadow} />

                  <View style={styles.bannerInnerContainer}>
                    {focusedLevel.level_number != null && focusedLevel.level_number !== 'null' && (
                      <>
                        <View style={styles.levelNumWrapper}>
                          <Text style={styles.bannerLevelNumber} adjustsFontSizeToFit numberOfLines={1}>{focusedLevel.level_number}</Text>
                        </View>
                        <View style={styles.verticalDivider} />
                      </>
                    )}
                    
                    <View style={styles.titleInfoContainer}>
                      <Text style={styles.lessonToLearnText}>Lesson to learn</Text>
                      
                      <Text 
                        style={styles.bannerLevelTitle} 
                        adjustsFontSizeToFit 
                        numberOfLines={1}
                      >
                        {focusedLevel.level_title && focusedLevel.level_title !== 'null' 
                          ? focusedLevel.level_title 
                          : (focusedLevel.level_type || 'Level').toUpperCase()}
                      </Text>
                      
                      <Text style={[
                        styles.lockStatusText,
                        focusedLevel.is_unlocked ? styles.unlockedText : styles.lockedText
                      ]}>
                        {focusedLevel.is_unlocked ? 'Unlocked' : ' Locked'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Shop Button - Scrolls with the body content */}
        <Pressable
          style={{
            position: 'absolute',
            bottom: gameScale(70),
            left: gameScale(20),
            width: gameScale(80),
            height: gameScale(80),  // Increased height to fit text
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 30,
            borderRadius: gameScale(30),
          }}
          onPress={() => {
            router.push('/PotionShop');
          }}
        >

          
          
          <View style={{ alignItems: 'center', marginTop: gameScale(-100) }}>
            <Image
              source={require('./ShopButton.png')}
              style={{
                width: gameScale(80),  
                height: gameScale(70),
              }}
              resizeMode="contain"
            />
            <Text style={{
              fontSize: gameScale(14),
              color: '#a2e3ceff',
              fontFamily: 'MusicVibes',
              textAlign: 'center',
            }}>
            </Text>
          </View>
        </Pressable>

          <Pressable
          style={{
            position: 'absolute',
            bottom: gameScale(40),
            left: gameScale(20),
            width: gameScale(80),
            height: gameScale(80),
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000, 
          }}
          onPress={() => {
            router.back();
          }}
        >
          <Image
            source={require('../icons/map.png')} // Uses the global map icon
            style={{
              width: gameScale(90),  
              height: gameScale(90),
              left: gameScale(10),
            }}
            resizeMode="contain"
          />
        </Pressable>

        <UniversalMapLevel onLevelFocus={setFocusedLevel} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  body: {
    flex: 1,
    backgroundColor: 'white',
    position: 'relative'
  },
  headerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
  },
  // NEW STYLES: PotionShop Woody Banner Frame
  focusBannerContainer: {
    position: 'absolute',
    top: gameScale(85), 
    alignSelf: 'center', 
    zIndex: 50,
    width: '85%', 
    height: gameScale(85), // Required Fixed Height
  },
  woodyFrame: {
    flex: 1,
    backgroundColor: '#943f02', // Woody brown
    borderRadius: gameScale(10),
    padding: gameScale(4),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: gameScale(4) },
    shadowOpacity: 0.5,
    shadowRadius: gameScale(6),
    elevation: 12,
    borderTopWidth: gameScale(2),
    borderLeftWidth: gameScale(2),
    borderBottomWidth: gameScale(4),
    borderRightWidth: gameScale(2),
    borderTopColor: '#c46623',
    borderLeftColor: '#c46623',
    borderBottomColor: '#4a1e00',
    borderRightColor: '#6e2f01',
    position: 'relative',
  },
  woodySlot: {
    flex: 1,
    borderRadius: gameScale(6),
    backgroundColor: '#700909',
    borderTopWidth: gameScale(2),
    borderLeftWidth: gameScale(2),
    borderBottomWidth: gameScale(2),
    borderRightWidth: gameScale(2),
    borderTopColor: '#3a1301',
    borderLeftColor: '#3a1301',
    borderBottomColor: '#a65116',
    borderRightColor: '#a65116',
    overflow: 'hidden',
  },
  woodySlotContent: {
    flex: 1,
    backgroundColor: '#6b2d01',
    justifyContent: 'center',
    position: 'relative',
  },
  woodyHighlight: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  woodyShadow: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '30%',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  // --- 3D DOTS STYLES ---
  cornerDot: {
    position: 'absolute',
    width: gameScale(6),
    height: gameScale(6),
    borderRadius: gameScale(3),
    backgroundColor: '#d4af37', 
    borderWidth: 1,
    borderColor: '#8b4513',
    zIndex: 5,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.6,
    elevation: 3,
  },
  dotTopLeft: { top: gameScale(4), left: gameScale(4) },
  dotTopRight: { top: gameScale(4), right: gameScale(4) },
  dotBottomLeft: { bottom: gameScale(4), left: gameScale(4) },
  dotBottomRight: { bottom: gameScale(4), right: gameScale(4) },
  
  // Content Layout
  bannerInnerContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: gameScale(15),
  },
  titleInfoContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: gameScale(5),
  },
  levelNumWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: gameScale(35),
  },
  bannerLevelNumber: {
    color: '#FFD700',
    fontSize: gameScale(28),
    fontFamily: 'Grobold',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  verticalDivider: {
    width: gameScale(2),
    height: '65%',
    backgroundColor: '#c46623',
    marginHorizontal: gameScale(12),
    borderRadius: gameScale(1),
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 0 },
    shadowOpacity: 0.5,
  },
  
  // Text Elements
  lessonToLearnText: {
    color: '#e9e1d9',
    fontSize: gameScale(10),
    fontFamily: 'DynaPuff',
    textTransform: 'uppercase',
    opacity: 0.85,
    marginBottom: gameScale(-1),
  },
  bannerLevelTitle: {
    color: '#ffffff',
    fontSize: gameScale(22), // Sets upper bounds, will scale down automatically if title is too long
    fontFamily: 'Grobold',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    maxHeight: gameScale(28), // prevents tall cutoff
  },
  lockStatusText: {
    fontSize: gameScale(9),
    fontFamily: 'Grobold',
    marginTop: gameScale(2),
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  unlockedText: {
    color: '#4ade80', // Soft neon green
  },
  lockedText: {
    color: '#ff6b6b', // Soft neon red
  },
});