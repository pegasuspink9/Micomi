import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ImageBackground,
  ActivityIndicator,
  Modal,
  Animated
} from 'react-native';
import LottieView from 'lottie-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useMapData } from '../../hooks/useMapData'; 
import { MAP_THEMES, DEFAULT_THEME } from '../RoadMap/MapLevel/MapDatas/mapData'; 
import { universalAssetPreloader } from '../../services/preloader/universalAssetPreloader';
import { mapService } from '../../services/mapService';
import MiniQuestPreview from './MiniQuestPreview/MiniQuestPreview';
import { soundManager } from '../Actual Game/Sounds/UniversalSoundManager';
import MainLoading from '../Actual Game/Loading/MainLoading';

const { width, height } = Dimensions.get('window');

const LEVEL_SELECTOR_IMAGES = {
  'HTML': require('./Assets/html_selector.png'),
  'CSS': require('./Assets/css_selector.png'),
  'JavaScript': require('./Assets/javascript_selector.png'),
  'Computer': require('./Assets/computer_selector.png')
};

export default function MapNavigate({ onMapChange }) {
  const [currentMapIndex, setCurrentMapIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      setIsNavigating(false);
    }, [])
  );
  
  const [animations, setAnimations] = useState([]);
  
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
  
  // Track if auto-preload has been done
  const hasAutoPreloaded = useRef(false);
  const [assetsReady, setAssetsReady] = useState(false);

  const { maps, loading, error, refetch } = useMapData();

  // Add safety check for current map
  const currentMap = maps[currentMapIndex];
  const isValidMap = currentMap && typeof currentMap === 'object';
    
 useEffect(() => {
    const autoPreloadAssets = async () => {
      if (hasAutoPreloaded.current || maps.length === 0) {
        return;
      }

      hasAutoPreloaded.current = true;
      const playerId = 11;

      try {
        console.log('🗺️ Map screen displayed - checking asset cache...');
        
        //  IMPORTANT: Load all cached assets into memory FIRST
        console.log('📦 Loading cached assets into memory...');
        await universalAssetPreloader.loadAllCachedAssets();
        
        //  Clear sound manager URL cache to pick up newly loaded cache
        soundManager.clearUrlCache();
        
        // Step 1: Check cache status for ALL asset types (including sounds)
        console.log('📦 Checking all asset caches...');
        const [themesCacheStatus, charSelectCacheStatus, soundCacheStatus] = await Promise.all([
          universalAssetPreloader.areMapThemeAssetsCached(MAP_THEMES),
          universalAssetPreloader.areStaticCharacterSelectAssetsCached(),
          universalAssetPreloader.areStaticSoundAssetsCached()  //  NEW: Check sound cache
        ]);
        
        const totalStaticMissing = themesCacheStatus.missing + charSelectCacheStatus.missing + soundCacheStatus.missing;
        const totalStaticAssets = themesCacheStatus.total + charSelectCacheStatus.total + soundCacheStatus.total;

        console.log(`📦 Static assets status: MapThemes (${themesCacheStatus.available}/${themesCacheStatus.total}), CharSelect (${charSelectCacheStatus.available}/${charSelectCacheStatus.total}), Sounds (${soundCacheStatus.available}/${soundCacheStatus.total})`);

        // Step 2: Download static assets if needed (Map Themes + Character Select + Sounds)
        if (totalStaticMissing > 0) {
          console.log(`📦 ${totalStaticMissing} static assets need downloading...`);
          
          setDownloadProgress(prev => ({
            ...prev,
            isDownloading: true,
            isComplete: false,
            mapName: 'Static Assets',
            loaded: 0,
            total: totalStaticAssets,
            progress: 0,
            successCount: themesCacheStatus.available + charSelectCacheStatus.available + soundCacheStatus.available
          }));
          setDownloadModalVisible(true);

          let downloadedSoFar = 0;

          // Download Map Theme assets
          if (themesCacheStatus.missing > 0) {
            console.log(`🗺️ Downloading ${themesCacheStatus.missing} map theme assets...`);
            await universalAssetPreloader.downloadMapThemeAssets(
              MAP_THEMES,
              (progress) => {
                setDownloadProgress(prev => ({
                  ...prev,
                  loaded: progress.loaded,
                  total: totalStaticMissing,
                  progress: progress.loaded / totalStaticMissing * 0.4, // First 40% for themes
                  successCount: progress.successCount,
                  currentAsset: progress.currentAsset,
                }));
              },
              (assetProgress) => {
                setCurrentAssetProgress({
                  url: assetProgress.url,
                  progress: assetProgress.progress,
                  currentIndex: assetProgress.currentIndex,
                  totalAssets: assetProgress.totalAssets,
                  category: assetProgress.category || 'map_theme',
                  name: assetProgress.name,
                });
              }
            );
            downloadedSoFar += themesCacheStatus.missing;
          }

          //  Download Character Select static assets
          if (charSelectCacheStatus.missing > 0) {
            console.log(`🎨 Downloading ${charSelectCacheStatus.missing} character select static assets...`);
            await universalAssetPreloader.downloadStaticCharacterSelectAssets(
              (progress) => {
                setDownloadProgress(prev => ({
                  ...prev,
                  loaded: downloadedSoFar + progress.loaded,
                  total: totalStaticMissing,
                  progress: 0.4 + (progress.loaded / totalStaticMissing * 0.4), // 40-80% for char select
                  successCount: themesCacheStatus.total + progress.successCount,
                  currentAsset: progress.currentAsset,
                }));
              },
              (assetProgress) => {
                setCurrentAssetProgress({
                  url: assetProgress.url,
                  progress: assetProgress.progress,
                  currentIndex: assetProgress.currentIndex,
                  totalAssets: assetProgress.totalAssets,
                  category: assetProgress.category || 'character_select',
                  name: assetProgress.name,
                });
              }
            );
            downloadedSoFar += charSelectCacheStatus.missing;
          }

          //  NEW: Download Static Sound assets
          if (soundCacheStatus.missing > 0) {
            console.log(`🔊 Downloading ${soundCacheStatus.missing} static sound assets...`);
            await universalAssetPreloader.downloadStaticSoundAssets(
              (progress) => {
                setDownloadProgress(prev => ({
                  ...prev,
                  loaded: downloadedSoFar + progress.loaded,
                  total: totalStaticMissing,
                  progress: 0.8 + (progress.loaded / totalStaticMissing * 0.2), // 80-100% for sounds
                  successCount: themesCacheStatus.total + charSelectCacheStatus.total + progress.successCount,
                  currentAsset: progress.currentAsset,
                }));
              }
            );
          }
          
          //  Clear sound manager cache after downloading new sounds
          soundManager.clearUrlCache();
        } else {
          console.log(` All ${totalStaticAssets} static assets already cached`);
        }

        // Step 3: Fetch and download Map API assets
        const preloadData = await mapService.getMapPreloadData(playerId);

        if (!preloadData) {
          console.warn('⚠️ Failed to fetch map preload data');
          setAssetsReady(true);
          setDownloadModalVisible(false);
          return;
        }

        const mapCacheStatus = await universalAssetPreloader.areMapAssetsCached(preloadData);
        
        if (mapCacheStatus.cached && totalStaticMissing === 0) {
          console.log(` All assets are already cached.`);
          
          // Load cached assets into memory
          await Promise.all([
            universalAssetPreloader.loadCachedAssets('game_animations'),
            universalAssetPreloader.loadCachedAssets('game_images'),
            universalAssetPreloader.loadCachedAssets('game_audio'),
            universalAssetPreloader.loadCachedAssets('game_visuals'),
            universalAssetPreloader.loadCachedAssets('map_theme_assets'),
            universalAssetPreloader.loadCachedAssets('character_select_ui'),
            universalAssetPreloader.loadCachedAssets('ui_videos'),
            universalAssetPreloader.loadCachedAssets('static_sounds'),  //  NEW: Load static sounds
          ]);
          
          //  Clear sound manager cache after loading
          soundManager.clearUrlCache();
          
          setAssetsReady(true);
          setDownloadModalVisible(false);
          return;
        }

        if (!mapCacheStatus.cached) {
          console.log(`📦 ${mapCacheStatus.missing} Map API assets need to be downloaded.`);

          if (!downloadModalVisible) {
            setDownloadProgress(prev => ({
              ...prev,
              isDownloading: true,
              isComplete: false,
              mapName: 'Game Assets',
              loaded: 0,
              total: mapCacheStatus.total,
              progress: 0,
              successCount: mapCacheStatus.available
            }));
            setDownloadModalVisible(true);
          } else {
            // Update progress to show we're now on Map API assets
            setDownloadProgress(prev => ({
              ...prev,
              mapName: 'Game Assets',
              loaded: 0,
              total: mapCacheStatus.total,
              progress: 0,
              successCount: mapCacheStatus.available
            }));
          }

          const result = await universalAssetPreloader.downloadAllMapAssets(
            preloadData,
            (progress) => {
              setDownloadProgress(prev => ({
                ...prev,
                loaded: progress.loaded,
                total: progress.total,
                progress: progress.progress,
                successCount: progress.successCount,
                currentAsset: progress.currentAsset,
              }));
            },
            (assetProgress) => {
              setCurrentAssetProgress({
                url: assetProgress.url,
                progress: assetProgress.progress,
                currentIndex: assetProgress.currentIndex,
                totalAssets: assetProgress.totalAssets,
                category: assetProgress.category,
                name: assetProgress.name,
              });
            }
          );

          console.log(`Map API download completed:`, result);
        }

        // Save cache info
        console.log(`💾 Saving cache info...`);
        await universalAssetPreloader.saveCacheInfoToStorage();
        
        //  Clear sound manager cache after all downloads complete
        soundManager.clearUrlCache();

        // Mark as complete
        setDownloadProgress(prev => ({
          ...prev,
          isDownloading: false,
          isComplete: true,
        }));

        // Auto-close modal
        setTimeout(() => {
          setDownloadModalVisible(false);
          resetDownloadProgress();
          setAssetsReady(true);
        }, 1500);

      } catch (error) {
        console.error('❌ Auto-preload failed:', error);
        setDownloadProgress(prev => ({
          ...prev,
          isDownloading: false,
          isComplete: false,
        }));
        
        setTimeout(() => {
          setDownloadModalVisible(false);
          resetDownloadProgress();
          setAssetsReady(true);
        }, 2000);
      }
    };

    autoPreloadAssets();
  }, [maps]);

  // ...existing code for animations...
  useEffect(() => {
    if (maps.length > 0) {
      const initialAnimations = maps.map((_, index) => ({
        translateX: new Animated.Value(getInitialTranslateX(index)),
        scale: new Animated.Value(getInitialScale(index)),
        rotateY: new Animated.Value(getInitialRotateY(index)),
        opacity: new Animated.Value(getInitialOpacity(index)),
      }));
      setAnimations(initialAnimations);
    }
  }, [maps]);

  const getInitialTranslateX = (index) => {
    const prevIndex = (currentMapIndex - 1 + maps.length) % maps.length;
    const nextIndex = (currentMapIndex + 1) % maps.length;
    
    if (index === currentMapIndex) return 0;
    if (index === prevIndex) return -width * 0.4;
    if (index === nextIndex) return width * 0.4;
    return index > currentMapIndex ? width * 2 : -width * 2;
  };

  const getInitialScale = (index) => {
    const prevIndex = (currentMapIndex - 1 + maps.length) % maps.length;
    const nextIndex = (currentMapIndex + 1) % maps.length;
    
    if (index === currentMapIndex) return 1;
    if (index === prevIndex || index === nextIndex) return 0.8;
    return 0.5;
  };

  const getInitialRotateY = (index) => {
    const prevIndex = (currentMapIndex - 1 + maps.length) % maps.length;
    const nextIndex = (currentMapIndex + 1) % maps.length;
    
    if (index === currentMapIndex) return 0;
    if (index === prevIndex || index === nextIndex) return 180;
    return 180;
  };

  const getInitialOpacity = (index) => {
    const prevIndex = (currentMapIndex - 1 + maps.length) % maps.length;
    const nextIndex = (currentMapIndex + 1) % maps.length;
    
    if (index === currentMapIndex) return 1;
    if (index === prevIndex || index === nextIndex) return 0.5;
    return 0;
  };

  const animateToIndex = (newIndex) => {
    if (animations.length === 0) return;

    const anims = animations.map((anim, index) => {
      const prevIndex = (newIndex - 1 + maps.length) % maps.length;
      const nextIndex = (newIndex + 1) % maps.length;
      
      let targetTranslateX, targetScale, targetRotateY, targetOpacity;
      
      if (index === newIndex) {
        targetTranslateX = 0;
        targetScale = 1;
        targetRotateY = 0;
        targetOpacity = 1;
      } else if (index === prevIndex) {
        targetTranslateX = -width * 0.4;
        targetScale = 0.8;
        targetRotateY = 180;
        targetOpacity = 0.7;
      } else if (index === nextIndex) {
        targetTranslateX = width * 0.4;
        targetScale = 0.8;
        targetRotateY = 180;
        targetOpacity = 0.7;
      } else {
        targetTranslateX = index > newIndex ? width * 2 : -width * 2;
        targetScale = 0.5;
        targetRotateY = 180;
        targetOpacity = 0;
      }

      return Animated.parallel([
        Animated.spring(anim.translateX, {
          toValue: targetTranslateX,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(anim.scale, {
          toValue: targetScale,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(anim.rotateY, {
          toValue: targetRotateY,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(anim.opacity, {
          toValue: targetOpacity,
          duration: 300,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(anims).start();
  };

  const handlePrevious = () => {
    const newIndex = currentMapIndex > 0 ? currentMapIndex - 1 : maps.length - 1;
    setCurrentMapIndex(newIndex);
    animateToIndex(newIndex);
  };

  const handleNext = () => {
    const newIndex = currentMapIndex < maps.length - 1 ? currentMapIndex + 1 : 0;
    setCurrentMapIndex(newIndex);
    animateToIndex(newIndex);
  };

  useEffect(() => {
    if (onMapChange && maps.length > 0 && isValidMap) {
      onMapChange(maps[currentMapIndex].map_name);
    }
  }, [currentMapIndex, onMapChange, maps, isValidMap]);

  useEffect(() => {
    const loadCachedAssets = async () => {
      if (maps.length > 0) {
        // Load map theme assets into memory
        await universalAssetPreloader.loadCachedAssets('map_theme_assets');
        await universalAssetPreloader.loadCachedAssets('character_select_ui');
      }
    };
    
    loadCachedAssets();
  }, [maps]);

  // Reset download progress
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

  // Island click now just navigates (assets already preloaded)
  const handleIslandClick = () => {
    if (!isValidMap || !maps[currentMapIndex].is_active) {
      return;
    }

    const currentMapName = maps[currentMapIndex].map_name;

    setIsNavigating(true);
    
    // Navigate directly - assets are already preloaded
    setTimeout(() => {
        navigateToMap(currentMapName);
    }, 400); 
  };

  // Helper function to navigate to the map
  const navigateToMap = (mapName) => {
    router.push({
      pathname: '/Components/RoadMap/roadMapLandPage',
      params: {
        mapName: mapName,
        mapType: mapName,
        mapId: maps[currentMapIndex].map_id,
      },
    });
  };

  // Close download modal manually
  const handleDownloadModalClose = () => {
    if (!downloadProgress.isDownloading) {
      setDownloadModalVisible(false);
      resetDownloadProgress();
    }
  };

 

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

        <View style={styles.islandsContainer}>
          {maps.map((map, index) => (
            <Animated.View
              key={map.map_id || index}
              style={[
                styles.animatedIsland,
                {
                  opacity: animations[index]?.opacity,
                  zIndex: index === currentMapIndex ? 10 : 1, 
                  transform: [
                    { translateX: animations[index]?.translateX || 0 },
                    { scale: animations[index]?.scale || 0.6 },
                    { 
                      rotateY: animations[index]?.rotateY?.interpolate({
                        inputRange: [0, 180],
                        outputRange: ['0deg', '180deg']
                      }) || '0deg'
                    },
                  ],
                },
              ]}
            >
              <View 
                style={[
                  styles.island,
                  {
                    width: index === currentMapIndex ? width * 1 : width * 0.6, 
                    maxWidth: index === currentMapIndex ? width * 2 : width * 1, 
                  }
                ]}
                disabled={!map.is_active}
              >
                <LottieView
                  source={getMapImageSource(map)}
                  style={styles.islandImage}
                  autoPlay
                  loop
                  speed={map.is_active ? 1 : 0}
                  resizeMode='contain'
                  cacheComposition={true}
                  renderMode='HARDWARE'
                />

                {!map.is_active && (
                  <Image
                    source={{ uri: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1758945939/473288860-e8a1b478-91d3-44c9-8a59-4bc46db4d1c0_jaroj9.png'}}
                    style={styles.lockedOverlay}
                    resizeMode='contain'
                  />
                )}
              </View>
            </Animated.View>
          ))}
        </View>

        <View style={styles.levelSelector}>
          <TouchableOpacity 
            style={styles.navArrow} 
            onPress={handlePrevious}
          >
            <Image source={require('./Assets/right arrow.png')} style={[styles.arrowImage, styles.flippedHorizontal]} />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleIslandClick} activeOpacity={0.7}> 
            <ImageBackground
              source={LEVEL_SELECTOR_IMAGES[maps[currentMapIndex]?.map_name || 'HTML']}
              style={styles.levelSelectorImage}
              resizeMode="contain"
            >
              <View style={styles.currentLevel}>
                <Text style={styles.currentLevelText} numberOfLines={1} adjustsFontSizeToFit={true}>
                  {maps[currentMapIndex]?.map_name || 'Loading...'}
                </Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navArrow} 
            onPress={handleNext}
          >
            <Image source={require('./Assets/right arrow.png')} style={styles.arrowImage} />
          </TouchableOpacity>
        </View>
        <MiniQuestPreview playerId={11} />
      </View>
      
      {/* Download Modal - Now shows automatically when needed */}
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
                <Text style={styles.downloadModalTitle}>
                  {downloadProgress.isComplete ? ' Ready!' : 'Preparing Game Assets'}
                </Text>
                <Text style={styles.downloadModalSubtitle}>
                  {downloadProgress.isComplete 
                    ? 'All assets loaded successfully!' 
                    : 'Downloading assets for smooth gameplay...'}
                </Text>
              </View>

              {/* Overall Progress */}
              <View style={styles.progressSection}>
                <View style={styles.progressLabelContainer}>
                  <Text style={styles.progressLabel}>
                    {downloadProgress.mapName || 'Assets'} ({downloadProgress.successCount}/{downloadProgress.total})
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

              {/* Current Asset Progress */}
              {currentAssetProgress.url && !downloadProgress.isComplete && (
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
                        styles.currentAssetProgressBar,
                        { width: `${currentAssetProgress.progress * 100}%` }
                      ]} 
                    />
                  </View>
                  
                  <Text style={styles.currentUrlText} numberOfLines={1}>
                    {currentAssetProgress.url.slice(-50)}
                  </Text>
                </View>
              )}

              {/* Status Messages */}
              <View style={styles.statusContainer}>
                {downloadProgress.isDownloading && downloadProgress.currentAsset && (
                  <Text style={styles.statusText}>
                    📦 Downloading: {downloadProgress.currentAsset.category}/{downloadProgress.currentAsset.name}
                  </Text>
                )}
                
                {downloadProgress.isComplete && (
                  <Text style={styles.statusCompleteText}>
                    🎮 Ready to play!
                  </Text>
                )}
              </View>

              {/* Close Button - Only show when not downloading */}
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

      <MainLoading visible={isNavigating}/>
    </>
  );
}

// ... styles remain the same ...
const styles = StyleSheet.create({
  scrollContent: {
    flex: 1,
  },
  mapWrapper: {
    flex: 1,
    alignItems: 'center',
    maxHeight: height * 1,
    paddingVertical: 20,
  },
  islandsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: height * 0.6,
  },
  animatedIsland: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  island: {
    position: 'relative',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    top: 50,
    pointerEvents: 'none'
  },
  islandImage: {
    width: '120%',
    height: '120%',
  },
  levelSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: -50,
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
  currentAssetProgressBar: {
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