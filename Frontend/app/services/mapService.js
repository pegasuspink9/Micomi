import { apiService } from './api';
import { universalAssetPreloader } from './preloader/universalAssetPreloader';

export const mapService = {
  getAllMapsWithLevels: async () => {
    try {
      const response = await apiService.get('/map/11');
      console.log('🗺️ Maps with levels response:', response);
      
      if (response.success && response.data && response.data.data) {
        return response.data.data;
      }
      
      return response.success ? response.data : response;
    } catch (error) {
      console.error('Failed to fetch maps with levels:', error);
      throw error;
    }
  },

  getMapWithLevels: async (mapId) => {
    try {
      const response = await apiService.post(`/map/select-map/11/${mapId}`);
      console.log(`🗺️ Map ${mapId} with levels FULL response:`, JSON.stringify(response, null, 2));
      
      if (response.success && response.data && response.data.map) {
        const mapData = response.data.map;
        console.log(`🗺️ Extracted map data:`, JSON.stringify(mapData, null, 2));
        console.log(`🗺️ Map has ${mapData.levels?.length || 0} levels`);
        return mapData;
      }
      
      console.error('❌ Unexpected response structure:', response);
      return null;
    } catch (error) { 
      console.error(`Failed to fetch map ${mapId} with levels:`, error);
      throw error;
    }
  },

  extractLevelsFromMap: (mapData) => {
    console.log('🔍 Extracting levels from mapData:', mapData);
    
    if (!mapData) {
      console.warn('⚠️ mapData is null or undefined');
      return [];
    }
    
    if (!mapData.levels) {
      console.warn('⚠️ No levels property found in map data. Keys:', Object.keys(mapData));
      return [];
    }
    
    if (!Array.isArray(mapData.levels)) {
      console.warn('⚠️ levels is not an array:', typeof mapData.levels);
      return [];
    }
    
    console.log(`📋 Extracting ${mapData.levels.length} levels from map: ${mapData.map_name}`);
    return mapData.levels;
  },

  getMapPreloadData: async (playerId) => {
    try {
      console.log(`🗺️ Fetching preload data for player ${playerId}...`);
      const response = await apiService.get(`/map/${playerId}`);

      if (response.success && response.data) {
        console.log('🗺️ Map preload data received.');
        return response.data;
      }

      console.error('❌ Failed to get map preload data:', response);
      return null;
    } catch (error) {
      console.error('❌ Error fetching map preload data:', error);
      throw error;
    }
  },

  //  Preload all assets including character select static assets
  preloadAllGameAssets: async (mapLevelData, onProgress = null) => {
    try {
      console.log('🎮 Starting comprehensive game asset preload (Map + Character Select)...');
      
    const results = {
      mapAssets: null,
      characterSelectAssets: null,
      soundAssets: null,
      totalDownloaded: 0,
      totalAssets: 0,
      startTime: Date.now()
    };

      // Step 1: Check what's already cached
    const [mapCacheStatus, charSelectCacheStatus, soundCacheStatus] = await Promise.all([
      universalAssetPreloader.areMapAssetsCached(mapLevelData),
      universalAssetPreloader.areStaticCharacterSelectAssetsCached(),
      universalAssetPreloader.areStaticSoundAssetsCached()  // NEW
    ]);

    const totalMissing = mapCacheStatus.missing + charSelectCacheStatus.missing + soundCacheStatus.missing;
    results.totalAssets = mapCacheStatus.total + charSelectCacheStatus.total + soundCacheStatus.total;

    console.log(`📦 Cache status: Map (${mapCacheStatus.available}/${mapCacheStatus.total}), CharSelect (${charSelectCacheStatus.available}/${charSelectCacheStatus.total}), Sounds (${soundCacheStatus.available}/${soundCacheStatus.total})`);

      if (totalMissing === 0) {
        console.log(' All game assets already cached!');
        return {
          success: true,
          cached: true,
          ...results,
          totalDownloaded: 0
        };
      }

      let downloadedSoFar = 0;

      if (mapCacheStatus.missing > 0) {
        console.log(`📦 Downloading ${mapCacheStatus.missing} missing map assets...`);
        results.mapAssets = await universalAssetPreloader.downloadAllMapAssets(
          mapLevelData,
          (progress) => {
            if (onProgress) {
              onProgress({
                phase: 'map',
                loaded: progress.loaded,
                total: totalMissing,
                progress: progress.loaded / totalMissing,
                currentAsset: progress.currentAsset
              });
            }
          }
        );
        downloadedSoFar += results.mapAssets.downloaded || 0;
      }

      if (charSelectCacheStatus.missing > 0) {
        console.log(`🎨 Downloading ${charSelectCacheStatus.missing} missing character select assets...`);
        results.characterSelectAssets = await universalAssetPreloader.downloadStaticCharacterSelectAssets(
          (progress) => {
            if (onProgress) {
              onProgress({
                phase: 'character_select',
                loaded: downloadedSoFar + progress.loaded,
                total: totalMissing,
                progress: (downloadedSoFar + progress.loaded) / totalMissing,
                currentAsset: progress.currentAsset
              });
            }
          }
        );
        downloadedSoFar += results.characterSelectAssets.downloaded || 0;
      }

      if (soundCacheStatus.missing > 0) {
      console.log(`🔊 Downloading ${soundCacheStatus.missing} missing sound assets...`);
      results.soundAssets = await universalAssetPreloader.downloadStaticSoundAssets(
        (progress) => {
          if (onProgress) {
            onProgress({
              phase: 'sounds',
              loaded: downloadedSoFar + progress.loaded,
              total: totalMissing,
              progress: (downloadedSoFar + progress.loaded) / totalMissing,
              currentAsset: progress.currentAsset
            });
          }
        }
      );
      downloadedSoFar += results.soundAssets.downloaded || 0;
    }

      results.totalDownloaded = downloadedSoFar;
      results.totalTime = Date.now() - results.startTime;

      console.log(`🎮 Comprehensive preload completed: ${downloadedSoFar} assets in ${results.totalTime}ms`);

      return {
        success: true,
        cached: false,
        ...results
      };
    } catch (error) {
      console.error('❌ Error in comprehensive game asset preload:', error);
      throw error;
    }
  }
};