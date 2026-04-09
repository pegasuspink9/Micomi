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
const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));

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
  
  const [, setCurrentAssetProgress] = useState({
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
  const shimmerAnim = useRef(new Animated.Value(-1)).current;
  const hasAutoPreloaded = useRef(false);

  const uiProgress = downloadProgress.isComplete
    ? 1
    : Math.max(0, Math.min(1, downloadProgress.progress || 0));
  const uiPercent = Math.round(uiProgress * 100);

  // 1. Timer logic (Linear 5-second progress bar fill)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setTimerFinished(true);
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const shimmerLoop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    shimmerLoop.start();

    return () => {
      shimmerLoop.stop();
      shimmerAnim.setValue(-1);
    };
  }, [shimmerAnim]);

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

  const setStagedProgress = (stageStart, stageSpan, ratio, extra = {}) => {
    const normalized = clamp01(ratio);
    const nextProgress = clamp01(stageStart + (stageSpan * normalized));

    setDownloadProgress(prev => ({
      ...prev,
      ...extra,
      progress: Math.max(clamp01(prev.progress), nextProgress),
    }));
  };

  const fillProgressToFull = async (durationMs = 500) => {
    const frameMs = 16;
    const steps = Math.max(1, Math.ceil(durationMs / frameMs));
    const startProgress = clamp01(downloadProgress.progress);

    if (startProgress >= 1) {
      return;
    }

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const eased = 1 - Math.pow(1 - t, 2);
      const next = clamp01(startProgress + ((1 - startProgress) * eased));

      setDownloadProgress(prev => ({
        ...prev,
        isDownloading: true,
        isComplete: false,
        progress: Math.max(clamp01(prev.progress), next),
      }));

      await new Promise(resolve => setTimeout(resolve, frameMs));
    }
  };

  const runFullVerification = async (preloadData, stageStart, stageSpan) => {
    const section = stageSpan / 4;

    const mapCheckPromise = preloadData
      ? universalAssetPreloader.areMapAssetsCached(preloadData, (p) => {
          const ratio = p.total > 0 ? p.available / p.total : 1;
          setStagedProgress(stageStart + (section * 3), section, ratio, {
            isDownloading: true,
            isComplete: false,
            mapName: 'Checking Game Assets',
          });
        })
      : Promise.resolve({ cached: true, total: 0, available: 0, missing: 0, missingAssets: [] });

    const [themesCacheStatus, charSelectCacheStatus, soundCacheStatus, mapCacheStatus] = await Promise.all([
      universalAssetPreloader.areMapThemeAssetsCached(MAP_THEMES, (p) => {
        const ratio = p.total > 0 ? p.available / p.total : 1;
        setStagedProgress(stageStart, section, ratio, {
          isDownloading: true,
          isComplete: false,
          mapName: 'Checking System Assets',
        });
      }),
      universalAssetPreloader.areStaticCharacterSelectAssetsCached((p) => {
        const ratio = p.total > 0 ? p.available / p.total : 1;
        setStagedProgress(stageStart + section, section, ratio, {
          isDownloading: true,
          isComplete: false,
          mapName: 'Checking System Assets',
        });
      }),
      universalAssetPreloader.areStaticSoundAssetsCached((p) => {
        const ratio = p.total > 0 ? p.available / p.total : 1;
        setStagedProgress(stageStart + (section * 2), section, ratio, {
          isDownloading: true,
          isComplete: false,
          mapName: 'Checking System Assets',
        });
      }),
      mapCheckPromise,
    ]);

    const totalStaticMissing = themesCacheStatus.missing + charSelectCacheStatus.missing + soundCacheStatus.missing;

    return {
      themesCacheStatus,
      charSelectCacheStatus,
      soundCacheStatus,
      mapCacheStatus,
      totalStaticMissing,
    };
  };

  const autoPreloadAssets = async () => {
    try {
      console.log('🚀 MainLoading: Checking asset cache and updates...');

      setDownloadProgress(prev => ({
        ...prev,
        isDownloading: true,
        isComplete: false,
        mapName: 'Preparing Cache',
        progress: 0,
      }));
      
      // Load existing cache into memory
      await universalAssetPreloader.loadAllCachedAssets();
      setStagedProgress(0, 0.05, 1, {
        isDownloading: true,
        isComplete: false,
        mapName: 'Preparing Cache',
      });
      soundManager.clearUrlCache();

      // Step 1: Fetch map preload data first so checks can include map assets
      const preloadData = await mapService.getMapPreloadData();
      if (!preloadData) {
        console.warn('⚠️ MainLoading: preloadData unavailable, proceeding with static verification only.');
      }
      
      // Step 2: Verify all static + map assets before downloading
      const {
        themesCacheStatus,
        charSelectCacheStatus,
        soundCacheStatus,
        mapCacheStatus,
        totalStaticMissing,
      } = await runFullVerification(preloadData, 0.05, 0.5);
      
      const totalStaticAssets = themesCacheStatus.total + charSelectCacheStatus.total + soundCacheStatus.total;

      if (totalStaticMissing > 0) {
        setDownloadProgress(prev => ({
          ...prev,
          isDownloading: true,
          isComplete: false,
          mapName: 'System Assets',
          loaded: 0,
          total: totalStaticAssets,
          progress: Math.max(clamp01(prev.progress), 0.55),
          successCount: themesCacheStatus.available + charSelectCacheStatus.available + soundCacheStatus.available
        }));

        // Download missing themes
        if (themesCacheStatus.missing > 0) {
          await universalAssetPreloader.downloadMapThemeAssets(
            MAP_THEMES,
            (progress) => {
              const ratio = progress.total > 0 ? (progress.loaded / progress.total) : 1;
              setStagedProgress(0.55, 0.08, ratio, {
                isDownloading: true,
                isComplete: false,
                mapName: 'System Assets',
                loaded: progress.loaded,
                total: totalStaticMissing,
                successCount: progress.successCount,
                currentAsset: progress.currentAsset,
              });
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
        }

        // Download missing character assets
        if (charSelectCacheStatus.missing > 0) {
          await universalAssetPreloader.downloadStaticCharacterSelectAssets(
            (progress) => {
              const ratio = progress.total > 0 ? (progress.loaded / progress.total) : 1;
              setStagedProgress(0.63, 0.08, ratio, {
                isDownloading: true,
                isComplete: false,
                mapName: 'System Assets',
                loaded: progress.loaded,
                total: totalStaticMissing,
                successCount: themesCacheStatus.total + progress.successCount,
                currentAsset: progress.currentAsset,
              });
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
        }

        // Download missing sounds
        if (soundCacheStatus.missing > 0) {
          await universalAssetPreloader.downloadStaticSoundAssets(
            (progress) => {
              const ratio = progress.total > 0 ? (progress.loaded / progress.total) : 1;
              setStagedProgress(0.71, 0.04, ratio, {
                isDownloading: true,
                isComplete: false,
                mapName: 'System Assets',
                loaded: progress.loaded,
                total: totalStaticMissing,
                successCount: themesCacheStatus.total + charSelectCacheStatus.total + progress.successCount,
                currentAsset: progress.currentAsset,
              });
            }
          );
        }
        soundManager.clearUrlCache();
      }
      
      if (preloadData && !mapCacheStatus.cached) {
        setDownloadProgress(prev => ({
          ...prev,
          isDownloading: true,
          isComplete: false,
          mapName: 'Game Levels',
          loaded: 0,
          total: mapCacheStatus.total,
          progress: Math.max(clamp01(prev.progress), 0.75),
          successCount: mapCacheStatus.available
        }));

        await universalAssetPreloader.downloadAllMapAssets(
          preloadData,
          (progress) => {
            setStagedProgress(0.75, 0.2, progress.progress, {
              isDownloading: true,
              isComplete: false,
              mapName: 'Game Levels',
              loaded: progress.loaded,
              total: progress.total,
              successCount: progress.successCount,
              currentAsset: progress.currentAsset,
            });
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

      // Step 3: Re-verify to ensure no partial files slipped through
      let finalVerification = await runFullVerification(preloadData, 0.95, 0.04);
      const hasMissingAfterDownload = finalVerification.totalStaticMissing > 0 || !finalVerification.mapCacheStatus.cached;

      if (hasMissingAfterDownload) {
        console.warn('⚠️ MainLoading: Missing assets detected after first pass. Running one repair pass.');

        if (finalVerification.themesCacheStatus.missing > 0) {
          await universalAssetPreloader.downloadMapThemeAssets(MAP_THEMES);
        }
        if (finalVerification.charSelectCacheStatus.missing > 0) {
          await universalAssetPreloader.downloadStaticCharacterSelectAssets();
        }
        if (finalVerification.soundCacheStatus.missing > 0) {
          await universalAssetPreloader.downloadStaticSoundAssets();
        }
        if (preloadData && !finalVerification.mapCacheStatus.cached) {
          await universalAssetPreloader.downloadAllMapAssets(preloadData);
        }

        finalVerification = await runFullVerification(preloadData, 0.97, 0.02);
      }

      if (preloadData && finalVerification.mapCacheStatus.cached && finalVerification.totalStaticMissing === 0) {
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
      }

      soundManager.clearUrlCache();

      // Step 4: Complete and save state
      await universalAssetPreloader.saveCacheInfoToStorage();
      soundManager.clearUrlCache();

      await fillProgressToFull(550);

      setDownloadProgress(prev => ({
        ...prev,
        isDownloading: false,
        isComplete: true,
        mapName: 'Ready',
        progress: 1,
      }));
      setAssetsReady(true);

    } catch (error) {
      console.error('❌ Auto-preload failed on initial load:', error);
      await fillProgressToFull(350);
      setDownloadProgress(prev => ({
        ...prev,
        isDownloading: false,
        isComplete: true,
        mapName: 'Ready',
        progress: 1,
      }));
      setAssetsReady(true); // Proceed anyway to avoid bricking the app
    }
  };

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-gameScale(50), width * 0.85],
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
                <View style={[styles.progressFillWrapper, { width: `${uiProgress * 100}%` }]}>
                  <LinearGradient
                    colors={['#00D1FF', '#0077FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.progressBarFill}
                  />
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.progressShimmerOverlay,
                      {
                        transform: [{ translateX: shimmerTranslateX }],
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          </View>

          <Text style={[styles.statusText, !fontsLoaded && styles.fallbackFont]}>
            {downloadProgress.isDownloading
              ? `${downloadProgress.mapName || 'Preloading Game Data'}... ${uiPercent}%`
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
    overflow: 'hidden',
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
  progressShimmerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: gameScale(50),
    borderRadius: gameScale(16),
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
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