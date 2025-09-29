import React, { useState, useEffect } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ImageBackground,
  ActivityIndicator
} from 'react-native';
import LottieView from 'lottie-react-native';
import { useRouter } from 'expo-router';
import { useMapData } from '../../hooks/useMapData'; 

const { width, height } = Dimensions.get('window');

const LEVEL_SELECTOR_IMAGES = {
  'HTML': 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1758945741/469539795-f1ade869-bb35-4864-a796-2a964749f83b_hbzsxn.png',
  'CSS': 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1758945759/469539799-b20d16ef-7374-4eae-b87e-ec9d61171071_g0qgdf.png',
  'JavaScript': 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1758945815/469015824-570e2a1e-a6cb-4f7f-bdfd-54920f810694_yr5mi8.png',
  'Computer': 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1758945877/469628154-8ab0728b-8988-46dd-8ad7-395abc4ba273_1_dsr2b5.png'
};

export default function MapNavigate({ onMapChange }) {
  const [currentMapIndex, setCurrentMapIndex] = useState(0);
  const router = useRouter();
  
  const { maps, loading, error, refetch } = useMapData();

  // Add safety check for current map
  const currentMap = maps[currentMapIndex];
  const isValidMap = currentMap && typeof currentMap === 'object';

  useEffect(() => {
    if (onMapChange && maps.length > 0 && isValidMap) {
      onMapChange(maps[currentMapIndex].map_name);
    }
  }, [currentMapIndex, onMapChange, maps, isValidMap]);

  const handlePrevious = () => {
    setCurrentMapIndex(prevIndex => prevIndex > 0 ? prevIndex - 1 : maps.length - 1);
  };

  const handleNext = () => {
    setCurrentMapIndex(prevIndex => prevIndex < maps.length - 1 ? prevIndex + 1 : 0);
  };

  const handleIslandClick = () => {
    if (isValidMap && maps[currentMapIndex].is_active) {
      const currentMap = maps[currentMapIndex].map_name;
      
      router.push({
        pathname: '/Components/RoadMap/roadMapLandPage',
        params: { 
          mapName: currentMap,
          mapType: currentMap,
          mapId: maps[currentMapIndex].map_id
        }
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading Maps...</Text>
      </View>
    );
  }

  // Error state with no maps available
  if (error && maps.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load maps</Text>
        <Text style={styles.errorSubText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // No maps available
  if (maps.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No maps available</Text>
        <Text style={styles.errorSubText}>Please check your backend connection</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Get proper image source for LottieView
  const getMapImageSource = (mapData) => {
    if (!mapData) {
      return { uri: 'https://lottie.host/9875685d-8bb8-4749-ac63-c56953f45726/UnBHY7vAPX.json' };
    }
    
    // Handle backend format (map_image is a string URL)
    if (mapData.map_image && typeof mapData.map_image === 'string') {
      if (mapData.map_image.startsWith('http')) {
        return { uri: mapData.map_image };
      }
    }
    
    // Handle local format (map_image is already an object with uri)
    if (mapData.map_image && mapData.map_image.uri) {
      return mapData.map_image;
    }
    
    // Ultimate fallback
    return { uri: 'https://lottie.host/9875685d-8bb8-4749-ac63-c56953f45726/UnBHY7vAPX.json' };
  };

  return (
    <View style={styles.scrollContent}>
      {/* Show error banner if there was an error but we have data */}
      {error && maps.length > 0 && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>
            Backend connection issue - Some features may be limited
          </Text>
        </View>
      )}

      {/* Floating Island */}
      <View style={styles.mapWrapper}>
        <TouchableOpacity 
          style={styles.island}
          onPress={handleIslandClick}
          disabled={!isValidMap || !maps[currentMapIndex].is_active}
        >
          <LottieView
            source={getMapImageSource(maps[currentMapIndex])}
            style={styles.islandImage}
            autoPlay
            loop
            speed={isValidMap && maps[currentMapIndex].is_active ? 1 : 0}
            resizeMode='contain'
            cacheComposition={true}
            renderMode='HARDWARE'
          />

          {isValidMap && !maps[currentMapIndex].is_active && (
            <Image
              source={{ uri: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1758945939/473288860-e8a1b478-91d3-44c9-8a59-4bc46db4d1c0_jaroj9.png'}}
              style={styles.lockedOverlay}
              resizeMode='contain'
            />
          )}

        </TouchableOpacity>

        <View style={styles.levelSelector}>
          <TouchableOpacity 
            style={[styles.navArrow, currentMapIndex === 0 && styles.disabledArrow]} 
            onPress={handlePrevious}
            disabled={currentMapIndex === 0}
          >
            <Image source={{uri: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1758945991/469163197-5f2b8e72-f49e-4f06-8b76-40b580289d54_mf5hcw.png'}} style={[styles.arrowImage, styles.flippedHorizontal]} />
          </TouchableOpacity>
          
          <ImageBackground
            source={{uri: LEVEL_SELECTOR_IMAGES[isValidMap ? maps[currentMapIndex].map_name : 'HTML']}}
            style={styles.levelSelectorImage}
            resizeMode="contain"
          >
            <View style={styles.currentLevel}>
              <Text style={styles.currentLevelText} numberOfLines={1} adjustsFontSizeToFit={true}>
                {isValidMap ? maps[currentMapIndex].map_name : 'Loading...'}
              </Text>
            </View>
          </ImageBackground>
          
          <TouchableOpacity 
            style={[styles.navArrow, currentMapIndex === maps.length - 1 && styles.disabledArrow]} 
            onPress={handleNext}
            disabled={currentMapIndex === maps.length - 1}
          >
            <Image source={{uri: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1758945991/469163197-5f2b8e72-f49e-4f06-8b76-40b580289d54_mf5hcw.png'}} style={styles.arrowImage} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flex: 1,
    justifyContent: 'center',
  },
  mapWrapper: {
    flex: 1,
    alignItems: 'center',
    maxHeight: height * 1,
    paddingVertical: 20,
  },
  island: {
    position: 'relative',
    width: width * 1,
    aspectRatio: 1,
    maxWidth: 700,
    maxHeight: 700,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    top: 50
  },
  islandImage: {
    width: '130%',
    height: '130%',
  },
  levelSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: -30,
  },
  levelSelectorImage: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowImage: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginHorizontal: -20,
  },
  navArrow: {
    padding: 10
  },
  flippedHorizontal: {
    transform: [{ scaleX: -1 }],
  },
  currentLevel: {
    paddingHorizontal: 30,
    paddingVertical: 10,
    marginHorizontal: 20,
    width: 150
  },
  currentLevelText: {
    color: '#fff',
    fontSize: 30,
    textAlign: 'center',
    color: 'white',
    fontFamily: 'FunkySign',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 10,
    fontFamily: 'FunkySign',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 20,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 18,
    textAlign: 'center',
    fontFamily: 'FunkySign',
    marginBottom: 10,
  },
  errorSubText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.8,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'FunkySign',
  },
  errorBanner: {
    backgroundColor: '#ff9800',
    paddingVertical: 8,
    paddingHorizontal: 15,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  errorBannerText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'FunkySign',
  },
  disabledArrow: {
    opacity: 0.5,
  },
  lockedOverlay: {
    position: 'absolute',
    width: '120%',
    height: '120%',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    left: -26,
    opacity: 0.9,
  },
});