import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  ImageBackground, 
  Animated, 
  Easing,
  Platform,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useMapData } from './hooks/useMapData'; 
import { MAP_THEMES } from './Components/RoadMap/MapLevel/MapDatas/mapData'; 
import { universalAssetPreloader } from './services/preloader/universalAssetPreloader';
import { mapService } from './services/mapService';
import { soundManager } from './Components/Actual Game/Sounds/UniversalSoundManager';
import { gameScale } from './Components/Responsiveness/gameResponsive';

// Use 'screen' instead of 'window' to ensure it covers the bottom navigation bar area on Android
const { width, height } = Dimensions.get('screen');

const MainLoadingScreen = ({ onComplete, fontsLoaded }) => {
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

  const [assetsReady, setAssetsReady] = useState(false);
  const [timerFinished, setTimerFinished] = useState(false);
  const { maps } = useMapData();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const hasAutoPreloaded = useRef(false);

  // 1. Timer logic (Linear 5-second progress bar fill)
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 5000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        setTimerFinished(true);
      }
    });
  }, []);

  // 2. Transferred Preloading Logic from MapNavigate
  useEffect(() => {
    if (maps.length > 0 && !hasAutoPreloaded.current) {
      hasAutoPreloaded.current = true;
      autoPreloadAssets();
    }
  }, [maps]);

  // 3. Completion check
  useEffect(() => {
    if (assetsReady && timerFinished) {
      if (onComplete) {
        // Short delay for a clean exit
        setTimeout(onComplete, 500);
      }
    }
  }, [assetsReady, timerFinished, onComplete]);

  const autoPreloadAssets = async () => {
    try {
      console.log('🚀 MainLoading: Checking asset cache and updates...');
      
      // Load existing cache into memory
      await universalAssetPreloader.loadAllCachedAssets();
      soundManager.clearUrlCache();
      
      // Step 1: Check static resources
      const [themesCacheStatus, charSelectCacheStatus, soundCacheStatus] = await Promise.all([
        universalAssetPreloader.areMapThemeAssetsCached(MAP_THEMES),
        universalAssetPreloader.areStaticCharacterSelectAssetsCached(),
        universalAssetPreloader.areStaticSoundAssetsCached()
      ]);
      
      const totalStaticMissing = themesCacheStatus.missing + charSelectCacheStatus.missing + soundCacheStatus.missing;
      const totalStaticAssets = themesCacheStatus.total + charSelectCacheStatus.total + soundCacheStatus.total;

      if (totalStaticMissing > 0) {
        setDownloadProgress(prev => ({
          ...prev,
          isDownloading: true,
          isComplete: false,
          mapName: 'System Assets',
          loaded: 0,
          total: totalStaticAssets,
          progress: 0,
          successCount: themesCacheStatus.available + charSelectCacheStatus.available + soundCacheStatus.available
        }));

        let downloadedSoFar = 0;

        // Download missing themes
        if (themesCacheStatus.missing > 0) {
          await universalAssetPreloader.downloadMapThemeAssets(
            MAP_THEMES,
            (progress) => {
              setDownloadProgress(prev => ({
                ...prev,
                loaded: progress.loaded,
                total: totalStaticMissing,
                progress: progress.loaded / totalStaticMissing * 0.4,
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

        // Download missing character assets
        if (charSelectCacheStatus.missing > 0) {
          await universalAssetPreloader.downloadStaticCharacterSelectAssets(
            (progress) => {
              setDownloadProgress(prev => ({
                ...prev,
                loaded: downloadedSoFar + progress.loaded,
                total: totalStaticMissing,
                progress: 0.4 + (progress.loaded / totalStaticMissing * 0.4),
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

        // Download missing sounds
        if (soundCacheStatus.missing > 0) {
          await universalAssetPreloader.downloadStaticSoundAssets(
            (progress) => {
              setDownloadProgress(prev => ({
                ...prev,
                loaded: downloadedSoFar + progress.loaded,
                total: totalStaticMissing,
                progress: 0.8 + (progress.loaded / totalStaticMissing * 0.2),
                successCount: themesCacheStatus.total + charSelectCacheStatus.total + progress.successCount,
                currentAsset: progress.currentAsset,
              }));
            }
          );
        }
        soundManager.clearUrlCache();
      }

      // Step 2: Fetch and download Game Map Data from API
      const preloadData = await mapService.getMapPreloadData();
      if (!preloadData) {
        setAssetsReady(true);
        return;
      }

      const mapCacheStatus = await universalAssetPreloader.areMapAssetsCached(preloadData);
      
      if (mapCacheStatus.cached && totalStaticMissing === 0) {
        // Pre-load from cache into RAM for fast access
        await Promise.all([
          universalAssetPreloader.loadCachedAssets('game_animations'),
          universalAssetPreloader.loadCachedAssets('game_images'),
          universalAssetPreloader.loadCachedAssets('game_audio'),
          universalAssetPreloader.loadCachedAssets('game_visuals'),
          universalAssetPreloader.loadCachedAssets('map_theme_assets'),
          universalAssetPreloader.loadCachedAssets('character_select_ui'),
          universalAssetPreloader.loadCachedAssets('ui_videos'),
          universalAssetPreloader.loadCachedAssets('static_sounds'),
        ]);
        soundManager.clearUrlCache();
        setAssetsReady(true);
        return;
      }

      if (!mapCacheStatus.cached) {
        setDownloadProgress(prev => ({
          ...prev,
          isDownloading: true,
          isComplete: false,
          mapName: 'Game Levels',
          loaded: 0,
          total: mapCacheStatus.total,
          progress: 0,
          successCount: mapCacheStatus.available
        }));

        await universalAssetPreloader.downloadAllMapAssets(
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
      }

      // Step 3: Complete and save state
      await universalAssetPreloader.saveCacheInfoToStorage();
      soundManager.clearUrlCache();

      setDownloadProgress(prev => ({
        ...prev,
        isDownloading: false,
        isComplete: true,
      }));
      setAssetsReady(true);

    } catch (error) {
      console.error('❌ Auto-preload failed on initial load:', error);
      setAssetsReady(true); // Proceed anyway to avoid bricking the app
    }
  };

const progressPercent = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.fullScreenWrapper}>
      <ImageBackground
        source={require('./LoadingMenuScreen.png')}
        style={styles.container}
        resizeMode="cover"
      >
        <StatusBar hidden={true} translucent={true} backgroundColor="transparent" />
        <View style={styles.loaderContainer}>
          {/* 3-Layer Progress Bar Style from BadgesView */}
          <View style={styles.progressBarLayer1}>
            <View style={styles.progressBarLayer2}>
              <View style={styles.progressBarLayer3}>
                <Animated.View style={[styles.progressFillWrapper, { width: progressPercent }]}>
                  <LinearGradient
                    colors={['#00D1FF', '#0077FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.progressBarFill}
                  />
                </Animated.View>
              </View>
            </View>
          </View>

          <Text style={[styles.statusText, !fontsLoaded && styles.fallbackFont]}>
            {downloadProgress.isDownloading 
              ? `Downloading ${downloadProgress.mapName}... ${Math.round(downloadProgress.progress * 100)}%` 
              : 'Preloading Game Data...'}
          </Text>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: width,
    height: height,
    zIndex: 99999, // Ensure it stays on top of everything
  },
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: '#034251'
  },
  loaderContainer: {
    width: '100%',
    paddingBottom: gameScale(80),
    alignItems: 'center',
  },
  // Exact layer styles from BadgesView
  progressBarLayer1: {
    width: '85%',
    height: gameScale(24),
    backgroundColor: '#1a1a1a',
    borderRadius: gameScale(20),
    padding: gameScale(2),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  progressBarLayer2: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2a2a2a',
    borderRadius: gameScale(18),
    padding: gameScale(2),
    borderWidth: gameScale(1),
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomColor: 'rgba(0, 0, 0, 0.3)',
    borderRightColor: 'rgba(0, 0, 0, 0.3)',
  },
  progressBarLayer3: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: gameScale(16),
    overflow: 'hidden',
    borderWidth: gameScale(1),
    borderColor: 'rgba(0, 0, 0, 0.4)',
  },
  progressFillWrapper: {
    height: '100%',
    borderRadius: gameScale(16),
  },
  progressBarFill: {
    flex: 1,
    height: '100%',
    borderRadius: gameScale(16),
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    marginTop: gameScale(15),
    color: '#FFF',
    fontSize: gameScale(14),
    fontFamily: 'Grobold',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  fallbackFont: {
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
    fontWeight: 'bold'
  }
});

export default MainLoadingScreen;