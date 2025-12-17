import React from 'react';
import { View, StyleSheet, Pressable, Image, Dimensions } from "react-native";
import { useLocalSearchParams, useRouter } from 'expo-router'; 

// Import the universal component
import UniversalMapLevel from "./MapLevel/universalMapLevel";
import MapHeader from '../Map/mapHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { universalAssetPreloader } from '../../services/preloader/universalAssetPreloader';
import { DEFAULT_THEME } from './MapLevel/MapDatas/mapData';
import { useMemo } from 'react';

const { height: defaultHeight, width: defaultWidth } = Dimensions.get('window');

const BASE_HEIGHT = 844;
const BASE_WIDTH = 390;

export default function RoadMapLandPage() {
  const { mapName } = useLocalSearchParams();
  const router = useRouter();

  const responsive = {
    heightRatio: defaultHeight / BASE_HEIGHT,
    widthRatio: defaultWidth / BASE_WIDTH,
  };

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
            top: 140 * responsive.heightRatio,
            right: 20 * responsive.widthRatio,
            width: 80 * responsive.widthRatio,
            height: 60 * responsive.heightRatio,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 30,
            borderRadius: 30,
          }}
          onPress={() => {
            router.push('/PotionShop');
          }}
        >
          <Image
            source={require('./ShopButton.png')}
            style={{
              width: '100%',
              height: '100%'
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
    top: 30,
    left: 0,
    right: 0,
    zIndex: 100,
  }
});