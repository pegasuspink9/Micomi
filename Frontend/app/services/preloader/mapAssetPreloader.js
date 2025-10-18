import { Image as RNImage } from 'react-native';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

class MapAssetPreloader {
  constructor() {
    this.downloadedAssets = new Map();
    this.preloadedAssets = new Map();
    this.isDownloading = false;
    this.cacheDirectory = FileSystem.documentDirectory + 'mapAssets/';
  }

  //  Create cache directory if it doesn't exist
  async ensureCacheDirectory() {
    const dirInfo = await FileSystem.getInfoAsync(this.cacheDirectory);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(this.cacheDirectory, { intermediates: true });
      console.log('📁 Created map assets cache directory');
    }
  }

  //  Generate local file path for asset
  getLocalFilePath(url) {
    const fileName = url.split('/').pop().split('?')[0] || `asset_${Date.now()}`;
    return this.cacheDirectory + fileName;
  }

  //  Download and cache single asset
  async downloadSingleAsset(url, onProgress = null) {
    try {
      await this.ensureCacheDirectory();
      
      const localPath = this.getLocalFilePath(url);
      
      // Check if already downloaded
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (fileInfo.exists) {
        console.log(`📦 Asset already cached: ${url.slice(-50)}`);
        this.downloadedAssets.set(url, localPath);
        return { success: true, localPath, cached: true };
      }

      console.log(`📦 Downloading asset: ${url.slice(-50)}`);
      const startTime = Date.now();
      
      // Download with progress tracking
      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        localPath,
        {},
        onProgress ? (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          onProgress({ progress, url, downloadProgress });
        } : undefined
      );

      const result = await downloadResumable.downloadAsync();
      const downloadTime = Date.now() - startTime;

      if (result && result.uri) {
        this.downloadedAssets.set(url, result.uri);
        
        // Also preload to memory cache for images (skip for Lottie files)
        if (!url.includes('.lottie') && !url.includes('.json')) {
          try {
            await RNImage.prefetch(`file://${result.uri}`);
            this.preloadedAssets.set(url, {
              loadedAt: Date.now(),
              loadTime: downloadTime,
              url,
              localPath: result.uri
            });
          } catch (prefetchError) {
            console.warn('⚠️ Failed to prefetch asset to memory:', prefetchError);
          }
        }

        console.log(` Asset downloaded and cached in ${downloadTime}ms: ${url.slice(-50)}`);
        return { success: true, localPath: result.uri, downloadTime };
      } else {
        throw new Error('Download failed - no result URI');
      }
    } catch (error) {
      console.error(`❌ Failed to download asset: ${url}`, error);
      return { success: false, error: error.message };
    }
  }

  //  Extract all asset URLs from theme data
  extractThemeAssets(themeData) {
    const assets = [];
    
    // Helper to recursively find URL strings
    const findUrls = (obj, category = '', path = '') => {
      if (!obj) return;
      
      Object.entries(obj).forEach(([key, value]) => {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('https'))) {
          assets.push({
            url: value,
            category: category || key,
            name: key,
            path: currentPath
          });
        } else if (typeof value === 'object' && value !== null) {
          findUrls(value, category || key, currentPath);
        }
      });
    };

    findUrls(themeData);
    return assets;
  }

  //  Download all theme assets with progress tracking
  async downloadThemeAssets(themeData, mapName, onProgress = null, onAssetComplete = null) {
    if (this.isDownloading) {
      console.warn('⚠️ Map asset downloading already in progress');
      return { success: false, reason: 'already_downloading' };
    }

    this.isDownloading = true;
    
    try {
      console.log(`📦 Starting map asset download for: ${mapName}`);
      
      const assets = this.extractThemeAssets(themeData);
      console.log(`📦 Found ${assets.length} assets to download for ${mapName}:`, assets);

      if (assets.length === 0) {
        console.log('📦 No assets to download');
        this.isDownloading = false;
        return { success: true, downloaded: 0, total: 0 };
      }

      const startTime = Date.now();
      let successCount = 0;
      const results = [];

      // Download assets one by one
      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        
        // Individual asset progress callback
        if (onAssetComplete) {
          onAssetComplete({
            url: asset.url,
            category: asset.category,
            name: asset.name,
            progress: 0,
            currentIndex: i,
            totalAssets: assets.length
          });
        }

        const result = await this.downloadSingleAsset(asset.url, (downloadProgress) => {
          // Individual asset download progress
          if (onAssetComplete) {
            onAssetComplete({
              url: asset.url,
              category: asset.category,
              name: asset.name,
              progress: downloadProgress.progress,
              currentIndex: i,
              totalAssets: assets.length
            });
          }
        });
        
        if (result.success) {
          successCount++;
        }
        
        results.push({ asset, result });
        
        // Overall progress callback
        if (onProgress) {
          onProgress({
            loaded: i + 1,
            total: assets.length,
            progress: (i + 1) / assets.length,
            successCount,
            currentAsset: asset,
            mapName
          });
        }
      }

      const totalTime = Date.now() - startTime;
      this.isDownloading = false;

      // Save cache info to AsyncStorage
      try {
        const cacheKey = `mapAssets_${mapName}`;
        const cacheInfo = {
          downloadedAt: Date.now(),
          mapName,
          assets: Array.from(this.downloadedAssets.entries()),
          totalAssets: successCount,
          themeData: themeData // Store theme structure for reference
        };
        await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheInfo));
        console.log(`💾 Saved ${mapName} asset cache info to storage`);
      } catch (error) {
        console.warn('⚠️ Failed to save cache info to AsyncStorage:', error);
      }

      console.log(`📦 Map asset download completed for ${mapName}: ${successCount}/${assets.length} in ${totalTime}ms`);
      
      return {
        success: true,
        downloaded: successCount,
        total: assets.length,
        totalTime,
        results,
        mapName,
        failedAssets: results
          .filter(r => !r.result.success)
          .map(r => r.asset)
      };

    } catch (error) {
      console.error('❌ Error downloading map assets:', error);
      this.isDownloading = false;
      throw error;
    }
  }

  //  Get cached asset path (local file or original URL)
  getCachedAssetPath(url) {
    const localPath = this.downloadedAssets.get(url);
    if (localPath) {
      return `file://${localPath}`;
    }
    return url; // Fallback to original URL
  }

  //  Load cached assets from storage on app start
  async loadCachedAssets(mapName) {
    try {
      await this.ensureCacheDirectory();
      
      const cacheKey = `mapAssets_${mapName}`;
      const cacheInfoString = await AsyncStorage.getItem(cacheKey);
      
      if (cacheInfoString) {
        const cacheInfo = JSON.parse(cacheInfoString);
        
        // Verify cached files still exist
        let loadedCount = 0;
        for (const [url, localPath] of cacheInfo.assets) {
          const fileInfo = await FileSystem.getInfoAsync(localPath);
          if (fileInfo.exists) {
            this.downloadedAssets.set(url, localPath);
            this.preloadedAssets.set(url, {
              loadedAt: cacheInfo.downloadedAt,
              url,
              localPath,
              fromCache: true
            });
            loadedCount++;
          }
        }
        
        console.log(`📂 Loaded ${loadedCount} cached assets for ${mapName} from storage`);
        return { success: true, loadedCount, totalCached: cacheInfo.assets.length };
      }
      
      return { success: true, loadedCount: 0, totalCached: 0 };
    } catch (error) {
      console.warn(`⚠️ Failed to load cached assets for ${mapName}:`, error);
      return { success: false, error: error.message };
    }
  }

  //  Check if all theme assets are cached
  async areThemeAssetsCached(themeData, mapName) {
    const assets = this.extractThemeAssets(themeData);
    
    if (assets.length === 0) {
      return { cached: true, total: 0, available: 0 };
    }

    let availableCount = 0;
    for (const asset of assets) {
      if (this.downloadedAssets.has(asset.url)) {
        const localPath = this.downloadedAssets.get(asset.url);
        const fileInfo = await FileSystem.getInfoAsync(localPath);
        if (fileInfo.exists) {
          availableCount++;
        }
      }
    }

    const cached = availableCount === assets.length;
    console.log(`🔍 Assets cache check for ${mapName}: ${availableCount}/${assets.length} available`);
    
    return {
      cached,
      total: assets.length,
      available: availableCount,
      missing: assets.length - availableCount
    };
  }

  //  Get download statistics
  getDownloadStats() {
    return {
      downloadedCount: this.downloadedAssets.size,
      preloadedCount: this.preloadedAssets.size,
      isDownloading: this.isDownloading,
      downloadedUrls: Array.from(this.downloadedAssets.keys()),
      cacheDirectory: this.cacheDirectory
    };
  }

  //  Clear cache for specific map
  async clearMapCache(mapName) {
    try {
      const cacheKey = `mapAssets_${mapName}`;
      await AsyncStorage.removeItem(cacheKey);
      
      // Remove from memory maps
      const urlsToRemove = Array.from(this.downloadedAssets.keys());
      urlsToRemove.forEach(url => {
        this.downloadedAssets.delete(url);
        this.preloadedAssets.delete(url);
      });
      
      console.log(`🗑️ Cleared cache for ${mapName}`);
    } catch (error) {
      console.error(`❌ Failed to clear cache for ${mapName}:`, error);
    }
  }

  //  Clear all caches
  async clearAllCaches() {
    try {
      // Clear memory caches
      this.downloadedAssets.clear();
      this.preloadedAssets.clear();
      this.isDownloading = false;
      
      // Clear all AsyncStorage entries (this is a bit brute force)
      const keys = await AsyncStorage.getAllKeys();
      const mapAssetKeys = keys.filter(key => key.startsWith('mapAssets_'));
      if (mapAssetKeys.length > 0) {
        await AsyncStorage.multiRemove(mapAssetKeys);
      }
      
      // Delete cached files
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDirectory);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(this.cacheDirectory, { idempotent: true });
      }
      
      console.log('🗑️ All map asset caches cleared');
    } catch (error) {
      console.error('❌ Failed to clear all caches:', error);
    }
  }
}

// Export singleton instance
export const mapAssetPreloader = new MapAssetPreloader();