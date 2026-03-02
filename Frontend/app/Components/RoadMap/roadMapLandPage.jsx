import React from 'react';
import { View, StyleSheet, Pressable, Image, Dimensions, Text} from "react-native";
import { useLocalSearchParams, useRouter } from 'expo-router'; 

// Import the universal component
import UniversalMapLevel from "./MapLevel/universalMapLevel";
import MapHeader from '../Map/mapHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { universalAssetPreloader } from '../../services/preloader/universalAssetPreloader';
import { DEFAULT_THEME } from './MapLevel/MapDatas/mapData';
import { useMemo } from 'react';
import { gameScale } from '../Responsiveness/gameResponsive';

export default function RoadMapLandPage() {
  const { mapName } = useLocalSearchParams();
  const router = useRouter();

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
        {/* Shop Button - Scrolls with the body content */}
        <Pressable
          style={{
            position: 'absolute',
            top: gameScale(140),
            right: gameScale(20),
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
              left: gameScale(10), // Adjust left position to better align with the edge
            }}
            resizeMode="contain"
          />
        </Pressable>

        <UniversalMapLevel />
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
  }
});