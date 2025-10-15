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
  ActivityIndicator,
  Modal
} from 'react-native';
import LottieView from 'lottie-react-native';
import { useRouter } from 'expo-router';
import { useMapData } from '../../hooks/useMapData'; 
import { mapAssetPreloader } from '../../services/preloader/mapAssetPreloader';
import { MAP_THEMES, DEFAULT_THEME } from '../RoadMap/MapLevel/MapDatas/mapData'; // ✅ Import theme data

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
  
  // ✅ Asset download states
  const [downloadModalVisible, setDownloadModalVisible] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({
    loaded: 0,
    total: 0,
    progress: 0,
    successCount: 0,
    currentAsset: null,
    isDownloading: false,
    isComplete: false,
    mapName: ''
  });
  const [currentAssetProgress, setCurrentAssetProgress] = useState({
    url: '',
    progress: 0,
    currentIndex: 0,
    totalAssets: 0,
    category: '',
    name: ''
  });
  
  const { maps, loading, error, refetch } = useMapData();

  // Add safety check for current map
  const currentMap = maps[currentMapIndex];
  const isValidMap = currentMap && typeof currentMap === 'object';

  useEffect(() => {
    if (onMapChange && maps.length > 0 && isValidMap) {
      onMapChange(maps[currentMapIndex].map_name);
    }
  }, [currentMapIndex, onMapChange, maps, isValidMap]);

  // ✅ Load cached assets on component mount
  useEffect(() => {
    const loadCachedAssets = async () => {
      if (maps.length > 0) {
        for (const map of maps) {
          await mapAssetPreloader.loadCachedAssets(map.map_name);
        }
      }
    };
    
    loadCachedAssets();
  }, [maps]);

  const downloadMapAssets = async (mapName) => {
    try {
      const themeData = MAP_THEMES[mapName] || DEFAULT_THEME;
      
      // Check if assets are already cached
      const cacheStatus = await mapAssetPreloader.areThemeAssetsCached(themeData, mapName);
      if (cacheStatus.cached) {
        console.log(`✅ All assets for ${mapName} are already cached`);
        return { success: true, fromCache: true };
      }

      console.log(`📦 Starting asset download for ${mapName}...`);
      
      // Show download modal
      setDownloadProgress(prev => ({
        ...prev,
        isDownloading: true,
        isComplete: false,
        mapName: mapName,
        loaded: 0,
        total: 0,
        progress: 0,
        successCount: 0
      }));
      setDownloadModalVisible(true);

      // Start downloading
      const result = await mapAssetPreloader.downloadThemeAssets(
        themeData,
        mapName,
        // Overall progress callback
        (progress) => {
          setDownloadProgress(prev => ({
            ...prev,
            loaded: progress.loaded,
            total: progress.total,
            progress: progress.progress,
            successCount: progress.successCount,
            currentAsset: progress.currentAsset
          }));
        },
        // Individual asset progress callback
        (assetProgress) => {
          setCurrentAssetProgress({
            url: assetProgress.url,
            progress: assetProgress.progress,
            currentIndex: assetProgress.currentIndex,
            totalAssets: assetProgress.totalAssets,
            category: assetProgress.category,
            name: assetProgress.name
          });
        }
      );

      // Mark as complete
      setDownloadProgress(prev => ({
        ...prev,
        isDownloading: false,
        isComplete: true
      }));

      console.log(`✅ Asset download completed for ${mapName}:`, result);

      // Auto-close modal after 2 seconds
      setTimeout(() => {
        setDownloadModalVisible(false);
        resetDownloadProgress();
      }, 2000);

      return result;

    } catch (error) {
      console.error(`❌ Error downloading assets for ${mapName}:`, error);
      setDownloadProgress(prev => ({ 
        ...prev, 
        isDownloading: false, 
        isComplete: false 
      }));
      
      // Close modal after error
      setTimeout(() => {
        setDownloadModalVisible(false);
        resetDownloadProgress();
      }, 3000);
      
      throw error;
    }
  };

  // ✅ Reset download progress
  const resetDownloadProgress = () => {
    setDownloadProgress({
      loaded: 0,
      total: 0,
      progress: 0,
      successCount: 0,
      currentAsset: null,
      isDownloading: false,
      isComplete: false,
      mapName: ''
    });
    setCurrentAssetProgress({
      url: '',
      progress: 0,
      currentIndex: 0,
      totalAssets: 0,
      category: '',
      name: ''
    });
  };

  const handlePrevious = () => {
    setCurrentMapIndex(prevIndex => prevIndex > 0 ? prevIndex - 1 : maps.length - 1);
  };

  const handleNext = () => {
    setCurrentMapIndex(prevIndex => prevIndex < maps.length - 1 ? prevIndex + 1 : 0);
  };

  // ✅ Enhanced island click with asset download
  const handleIslandClick = async () => {
    if (isValidMap && maps[currentMapIndex].is_active) {
      const currentMapName = maps[currentMapIndex].map_name;
      
      try {
        // Download map assets before navigation
        await downloadMapAssets(currentMapName);
        
        // Navigate to the map after assets are downloaded
        router.push({
          pathname: '/Components/RoadMap/roadMapLandPage',
          params: { 
            mapName: currentMapName,
            mapType: currentMapName,
            mapId: maps[currentMapIndex].map_id
          }
        });
      } catch (error) {
        console.error('Failed to download assets, navigating anyway:', error);
        // Navigate even if download fails
        router.push({
          pathname: '/Components/RoadMap/roadMapLandPage',
          params: { 
            mapName: currentMapName,
            mapType: currentMapName,
            mapId: maps[currentMapIndex].map_id
          }
        });
      }
    }
  };

  // ✅ Close download modal manually
  const handleDownloadModalClose = () => {
    if (!downloadProgress.isDownloading) {
      setDownloadModalVisible(false);
      resetDownloadProgress();
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
    
    if (mapData.map_image && typeof mapData.map_image === 'string') {
      if (mapData.map_image.startsWith('http')) {
        return { uri: mapData.map_image };
      }
    }
    
    if (mapData.map_image && mapData.map_image.uri) {
      return mapData.map_image;
    }
    
    return { uri: 'https://lottie.host/9875685d-8bb8-4749-ac63-c56953f45726/UnBHY7vAPX.json' };
  };

  return (
    <>
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
      
      <Modal
        visible={downloadModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleDownloadModalClose}
      >
        <View style={styles.downloadModalOverlay}>
          <View style={styles.downloadModalContainer}>
            <ImageBackground
              source={{ uri: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1758946190/472267126-6b3dbdbb-1575-41a1-b1d8-4da2dd80f628_2_ojgh1u.png' }}
              style={styles.downloadModalBackground}
              resizeMode="cover"
            >
              <View style={styles.downloadModalHeader}>
                <Text style={styles.downloadModalTitle}>Preparing {downloadProgress.mapName}</Text>
                <Text style={styles.downloadModalSubtitle}>Downloading theme assets...</Text>
              </View>

              {/* ✅ Overall Progress */}
              <View style={styles.progressSection}>
                <View style={styles.progressLabelContainer}>
                  <Text style={styles.progressLabel}>
                    Assets ({downloadProgress.successCount}/{downloadProgress.total})
                  </Text>
                  <Text style={styles.progressPercent}>
                    {Math.round(downloadProgress.progress * 100)}%
                  </Text>
                </View>
                
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBarFill,
                      { width: `${downloadProgress.progress * 100}%` }
                    ]} 
                  />
                </View>
              </View>

              {/* ✅ Current Asset Progress */}
              {currentAssetProgress.url && (
                <View style={styles.progressSection}>
                  <View style={styles.progressLabelContainer}>
                    <Text style={styles.currentAssetLabel}>
                      {currentAssetProgress.category}/{currentAssetProgress.name}
                    </Text>
                    <Text style={styles.progressPercent}>
                      {Math.round(currentAssetProgress.progress * 100)}%
                    </Text>
                  </View>
                  
                  <View style={styles.progressBarContainer}>
                    <View 
                      style={[
                        styles.progressBarFill,
                        styles.currentAssetProgress,
                        { width: `${currentAssetProgress.progress * 100}%` }
                      ]} 
                    />
                  </View>
                  
                  <Text style={styles.currentUrlText} numberOfLines={1}>
                    {currentAssetProgress.url.slice(-50)}
                  </Text>
                </View>
              )}

              {/* ✅ Status Messages */}
              <View style={styles.statusContainer}>
                {downloadProgress.isDownloading && downloadProgress.currentAsset && (
                  <Text style={styles.statusText}>
                    📦 Downloading: {downloadProgress.currentAsset.category}/{downloadProgress.currentAsset.name}
                  </Text>
                )}
                
                {downloadProgress.isComplete && (
                  <Text style={styles.statusCompleteText}>
                    ✅ Assets Ready! Opening {downloadProgress.mapName}...
                  </Text>
                )}
              </View>

              {/* ✅ Close Button */}
              {!downloadProgress.isDownloading && (
                <TouchableOpacity 
                  style={styles.downloadModalCloseButton}
                  onPress={handleDownloadModalClose}
                >
                  <Text style={styles.downloadModalCloseText}>
                    {downloadProgress.isComplete ? 'Continue' : 'Close'}
                  </Text>
                </TouchableOpacity>
              )}
            </ImageBackground>
          </View>
        </View>
      </Modal>
    </>
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
    marginHorizontal: -20
  },
  navArrow: {
    padding: 10
  },
  flippedHorizontal: {
    transform: [{ scaleX: -1 }]
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

  // ✅ Download Modal Styles
  downloadModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  downloadModalContainer: {
    width: width * 0.85,
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  
  downloadModalBackground: {
    padding: 30,
    alignItems: 'center',
    minHeight: 300,
  },
  
  downloadModalHeader: {
    alignItems: 'center',
    marginBottom: 25,
  },
  
  downloadModalTitle: {
    fontSize: 22,
    fontFamily: 'FunkySign',
    color: '#FFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  
  downloadModalSubtitle: {
    fontSize: 14,
    fontFamily: 'FunkySign',
    color: '#FFF',
    textAlign: 'center',
    marginTop: 5,
    opacity: 0.8,
  },
  
  progressSection: {
    width: '100%',
    marginBottom: 20,
  },
  
  progressLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  progressLabel: {
    fontSize: 14,
    fontFamily: 'FunkySign',
    color: '#FFF',
    opacity: 0.9,
  },
  
  currentAssetLabel: {
    fontSize: 12,
    fontFamily: 'FunkySign',
    color: '#4CAF50',
    opacity: 0.9,
  },
  
  progressPercent: {
    fontSize: 14,
    fontFamily: 'FunkySign',
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  
  currentAssetProgress: {
    backgroundColor: '#2196F3',
  },
  
  currentUrlText: {
    fontSize: 10,
    fontFamily: 'FunkySign',
    color: '#FFF',
    opacity: 0.6,
    marginTop: 4,
    textAlign: 'center',
  },
  
  statusContainer: {
    alignItems: 'center',
    marginTop: 15,
    minHeight: 30,
  },
  
  statusText: {
    fontSize: 12,
    fontFamily: 'FunkySign',
    color: '#FFF',
    textAlign: 'center',
    opacity: 0.8,
  },
  
  statusCompleteText: {
    fontSize: 14,
    fontFamily: 'FunkySign',
    color: '#4CAF50',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  
  downloadModalCloseButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  
  downloadModalCloseText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'FunkySign',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});