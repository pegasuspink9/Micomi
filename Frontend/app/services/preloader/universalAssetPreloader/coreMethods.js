import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const coreMethods = {
async ensureCacheDirectory(category = '') {
    const targetDir = category ? `${this.cacheDirectory}${category}/` : this.cacheDirectory;
    const dirInfo = await FileSystem.getInfoAsync(targetDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true });
      console.log(`📁 Created cache directory: ${category || 'root'}`);
    }
    return targetDir;
  },

getAdaptiveConcurrency(totalAssets = 0, category = 'general') {
    const base = this.maxConcurrentDownloads || 8;

    if (category === 'video' || category === 'ui_videos') {
      return Math.min(base, 2);
    }

    if (totalAssets >= 180) return Math.max(base, 16);
    if (totalAssets >= 90) return Math.max(base, 14);
    if (totalAssets >= 40) return Math.max(base, 12);

    return base;
  },

async saveCacheInfoToStorage() {
    try {
      // Group assets by category
      const assetsByCategory = {};
      
      this.downloadedAssets.forEach((assetInfo, url) => {
        const category = assetInfo.category || 'general';
        if (!assetsByCategory[category]) {
          assetsByCategory[category] = [];
        }
        assetsByCategory[category].push([url, assetInfo]);
      });

      // Save each category
      for (const [category, assets] of Object.entries(assetsByCategory)) {
        const cacheKey = `${category}Assets`;
        const cacheInfo = {
          downloadedAt: Date.now(),
          category: category,
          assets: assets,
          totalAssets: assets.length
        };
        await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheInfo));
        console.log(`💾 Saved ${assets.length} ${category} assets to storage`);
      }

      // Also save a master list for quick lookup
      const masterList = {
        downloadedAt: Date.now(),
        totalAssets: this.downloadedAssets.size,
        categories: Object.keys(assetsByCategory)
      };
      await AsyncStorage.setItem('masterAssetCache', JSON.stringify(masterList));
      
      console.log(`💾 Saved cache info for ${this.downloadedAssets.size} total assets`);
      return { success: true, totalSaved: this.downloadedAssets.size };
    } catch (error) {
      console.error('❌ Failed to save cache info to storage:', error);
      return { success: false, error: error.message };
    }
  },

async loadAllCachedAssets() {
    try {
      console.log('📦 Loading all cached assets from storage...');
      
      const categories = [
        'game_animations',
        'game_audio', 
        'game_visuals',
        'game_images',
        'map_assets',
        'characters',
        'player_profile',
        'potion_shop',
        'static_sounds',
        'character_select_ui'
      ];

      let totalLoaded = 0;
      
      for (const category of categories) {
        const result = await this.loadCachedAssets(category);
        if (result.success) {
          totalLoaded += result.loadedCount;
        }
      }

      console.log(`📦 Loaded ${totalLoaded} total cached assets into memory`);
      return { success: true, totalLoaded };
    } catch (error) {
      console.error('❌ Failed to load all cached assets:', error);
      return { success: false, error: error.message };
    }
  },

getLocalFilePath(url, category = 'general') {
  const urlParts = url.split('/');
  
  //  Use more of the URL path to ensure uniqueness
  const pathSegments = urlParts.slice(-3); // Take last 3 segments: ['Hero', 'Gino', 'idle.png']
  const fileName = pathSegments.join('_').split('?')[0]; // 'Hero_Gino_idle.png'
  
  // Handle different hosts and ensure proper file extensions
  let finalFileName = fileName;
  if (!fileName.includes('.')) {
    if (url.includes('cloudinary')) {
      finalFileName += '.png';
    } else if (url.includes('github')) {  
      finalFileName += '.png';
    } else if (url.includes('r2.dev')) {
      finalFileName += '.png'; 
    } else if (url.includes('lottie')) {
      finalFileName += '.json';
    } else {
      finalFileName += '.png';
    }
  }
  
  return `${this.cacheDirectory}${category}/${finalFileName}`;
  },

getMinimumValidFileSize(url = '') {
  const lowerUrl = (url || '').toLowerCase().split('?')[0];

  if (lowerUrl.endsWith('.mp4') || lowerUrl.endsWith('.mov') || lowerUrl.endsWith('.webm')) {
    return 2048;
  }

  if (lowerUrl.endsWith('.mp3') || lowerUrl.endsWith('.wav') || lowerUrl.endsWith('.ogg') || lowerUrl.endsWith('.m4a')) {
    return 512;
  }

  if (lowerUrl.endsWith('.json') || lowerUrl.includes('.lottie')) {
    return 128;
  }

  if (this.isImageFile(lowerUrl)) {
    return 256;
  }

  return 128;
  },

async validateCachedFile(localPath, url = '', expectedBytes = 0) {
  try {
    const fileInfo = await FileSystem.getInfoAsync(localPath);

    if (!fileInfo.exists || !fileInfo.size || fileInfo.size <= 0) {
      return { valid: false, reason: 'missing_or_empty', size: 0 };
    }

    const minimumBytes = this.getMinimumValidFileSize(url);
    if (fileInfo.size < minimumBytes) {
      await FileSystem.deleteAsync(localPath, { idempotent: true });
      return {
        valid: false,
        reason: 'too_small',
        size: fileInfo.size,
        minimumBytes,
      };
    }

    const numericExpected = Number(expectedBytes || 0);
    if (Number.isFinite(numericExpected) && numericExpected > 0) {
      // Allow a tiny margin for servers that report slightly different content-length values.
      const lowerBound = Math.floor(numericExpected * 0.98);
      if (fileInfo.size < lowerBound) {
        await FileSystem.deleteAsync(localPath, { idempotent: true });
        return {
          valid: false,
          reason: 'incomplete_download',
          size: fileInfo.size,
          expected: numericExpected,
        };
      }
    }

    return { valid: true, reason: 'ok', size: fileInfo.size };
  } catch (error) {
    return { valid: false, reason: 'stat_failed', error: error.message || 'unknown_error', size: 0 };
  }
  },

async downloadSingleAsset(url, category = 'general', onProgress = null, retries = 2) {
    if (!url || typeof url !== 'string') {
      console.warn('⚠️ Invalid URL provided to downloadSingleAsset:', url);
      return { success: false, error: 'Invalid URL', url, category };
    }

    if (url.startsWith('file://') || url.startsWith('/data/')) {
      console.log(`📦 Asset is already a local file, skipping download: ${url.slice(-50)}`);
      return { 
        success: true, 
        localPath: url.replace('file://', ''), 
        cached: true, 
        url, 
        category 
      };
    }

    let fullUrl = url;
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
      console.warn(`⚠️ URL missing scheme, prepending 'https://': ${url}`);
      fullUrl = `https://${fullUrl}`;
    }

    try {
      console.log(`📥 Starting download: ${url.slice(-60)}`);
      
      await this.ensureCacheDirectory(category);
      
      const localPath = this.getLocalFilePath(url, category);
      
      // Check if already downloaded and file exists
      const existingValidation = await this.validateCachedFile(localPath, url);
      if (existingValidation.valid) {
        console.log(`📦 Asset already cached: ${url.slice(-50)}`);
        this.downloadedAssets.set(url, {
          localPath,
          category,
          url,
          downloadedAt: Date.now(),
          fileSize: existingValidation.size
        });
        return { success: true, localPath, cached: true, url, category };
      }

      console.log(`📦 Downloading ${category} asset: ${url.slice(-50)}`);
      const startTime = Date.now();
      
      const downloadResumable = FileSystem.createDownloadResumable(
        fullUrl,
        localPath,
        {
          headers: {
            'User-Agent': 'MicomoGame/1.0',
            'Accept': 'image/*'
          }
        },
        onProgress ? (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          onProgress({ progress, url, downloadProgress });
        } : undefined
      );

      const result = await downloadResumable.downloadAsync();
      const downloadTime = Date.now() - startTime;

      if (result && result.uri) {
        const downloadedLocalPath = result.uri.replace('file://', '');
        const expectedBytes = Number(result.headers?.['content-length'] || result.headers?.['Content-Length'] || 0);
        const downloadedValidation = await this.validateCachedFile(downloadedLocalPath, url, expectedBytes);

        if (!downloadedValidation.valid) {
          throw new Error(`Downloaded file is invalid: ${downloadedValidation.reason}`);
        }

        this.downloadedAssets.set(url, {
          localPath: downloadedLocalPath,
          category,
          url,
          downloadedAt: Date.now(),
          downloadTime,
          fileSize: downloadedValidation.size
        });
        
        console.log(` Asset downloaded in ${downloadTime}ms: ${url.slice(-50)}`);
        return { success: true, localPath: downloadedLocalPath, downloadTime, url, category };
      } else {
        throw new Error('Download failed - no result URI');
      }
    } catch (error) {
      console.error(`❌ Failed to download ${category} asset: ${url}`, {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode
      });
      
      // Retry logic
      if (retries > 0) {
        console.log(`🔄 Retrying download (${retries} attempts left): ${url.slice(-50)}`);
        await new Promise(resolve => setTimeout(resolve, 250));
        return this.downloadSingleAsset(url, category, onProgress, retries - 1);
      }
      
      return { 
        success: false, 
        error: error.message, 
        url, 
        category,
        errorCode: error.code,
        statusCode: error.statusCode
      };
    }
  },

isAudioFile(url) {
  if (!url || typeof url !== 'string') return false;
  const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a'];
  const lowerUrl = url.toLowerCase().split('?')[0];
  return audioExtensions.some(ext => lowerUrl.endsWith(ext));
},

async testR2Download(testUrl) {
  console.log(`🧪 Testing R2 URL: ${testUrl}`);
  
  try {
    const response = await fetch(testUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'MicomoGame/1.0'
      }
    });
    
    console.log(` R2 URL test successful:`, {
      status: response.status,
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length')
    });
    
    return { 
      success: true, 
      status: response.status,
      contentType: response.headers.get('content-type')
    };
  } catch (error) {
    console.error(`❌ R2 URL test failed:`, error.message);
    return { success: false, error: error.message };
  }
},

isImageFile(url) {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
    const lowerUrl = url.toLowerCase();
    
    // Check file extension
    if (imageExtensions.some(ext => lowerUrl.includes(ext))) {
      return true;
    }

    const imageHosts = [
    'cloudinary.com',
    'github.com',
    'githubusercontent.com',
    'r2.dev',
    'pub-',  
    'micomi-assets.me',
    'cdn.jsdelivr.net'
    ];
    
    // Check if it's from image hosting services
      if (imageHosts.some(host => lowerUrl.includes(host))) {
    console.log(` Image detected by host: ${imageHosts.find(h => lowerUrl.includes(h))}`);
    return true;
  }
  
  console.log(`❌ Not recognized as image`);
  return false;
  },

async rebuildMemoryCacheFromDisk(category = 'game_animations') {
    try {
      const categoryDir = `${this.cacheDirectory}${category}/`;
      const dirInfo = await FileSystem.getInfoAsync(categoryDir);
      
      if (!dirInfo.exists) {
        console.log(`📁 Cache directory doesn't exist for ${category}`);
        return { success: true, rebuilt: 0 };
      }

      const files = await FileSystem.readDirectoryAsync(categoryDir);
      let rebuiltCount = 0;

      for (const fileName of files) {
        const localPath = `${categoryDir}${fileName}`;
        const fileInfo = await FileSystem.getInfoAsync(localPath);
        
        if (fileInfo.exists && fileInfo.size > 0) {
          // Try to reconstruct the original URL from the filename
          // This is a reverse lookup - not perfect but helps
          const existingEntry = Array.from(this.downloadedAssets.entries())
            .find(([url, info]) => info.localPath === localPath);
          
          if (!existingEntry) {
            // File exists but not in memory - we need to track it
            // The URL reconstruction isn't perfect, but the file is available
            console.log(`📦 Found orphaned cache file: ${fileName}`);
          }
          rebuiltCount++;
        }
      }

      console.log(`🔄 Rebuilt memory cache for ${category}: ${rebuiltCount} files found`);
      return { success: true, rebuilt: rebuiltCount };
    } catch (error) {
      console.warn(`⚠️ Failed to rebuild memory cache for ${category}:`, error);
      return { success: false, error: error.message };
    }
  },

isAssetCached(url) {
    if (!url) return false;
    
    // Check if it's already a local file path
    if (url.startsWith('file://')) return true;
    
    // Check memory cache
    const assetInfo = this.downloadedAssets.get(url);
    return !!(assetInfo && assetInfo.localPath);
  },

getCachedAssetPathSync(url) {
    if (!url) return url;
    if (url.startsWith('file://')) return url;
    
    const assetInfo = this.downloadedAssets.get(url);
    if (assetInfo && assetInfo.localPath) {
      return `file://${assetInfo.localPath}`;
    }
    return url;
  },

getCachedAssetPath(url) {
    if (!url) return url;
    
    // 1. Try exact match
    let assetInfo = this.downloadedAssets.get(url);
    
    // 2. Try encoded match (if url is unencoded but cache has encoded)
    if (!assetInfo) {
      try {
        const encodedUrl = encodeURI(url);
        if (encodedUrl !== url) {
             assetInfo = this.downloadedAssets.get(encodedUrl);
        }
      } catch (e) {}
    }
    // 3. Try decoded match (if url is encoded but cache has unencoded)
    if (!assetInfo) {
      try {
        const decodedUrl = decodeURI(url);
         if (decodedUrl !== url) {
            assetInfo = this.downloadedAssets.get(decodedUrl);
         }
      } catch (e) {}
    }

    if (assetInfo && assetInfo.localPath) {
      return `file://${assetInfo.localPath}`;
    }
    return url; // Fallback to original URL
  },

getCachedAssetPaths(urls) {
    const paths = {};
    urls.forEach(url => {
      paths[url] = this.getCachedAssetPath(url);
    });
    return paths;
  },

async loadCachedAssets(category = 'characters') {
    try {
      await this.ensureCacheDirectory(category);
      
      const cacheKey = category === 'characters' ? 'characterAssets' : `${category}Assets`;
      const cacheInfoString = await AsyncStorage.getItem(cacheKey);
      
      let loadedCount = 0;
      
      if (cacheInfoString) {
        const cacheInfo = JSON.parse(cacheInfoString);
        
        if (cacheInfo.assets && Array.isArray(cacheInfo.assets)) {
          for (const [url, assetInfo] of cacheInfo.assets) {
            if (assetInfo && assetInfo.localPath) {
              // Verify file still exists
              const fileInfo = await FileSystem.getInfoAsync(assetInfo.localPath);
              if (fileInfo.exists && fileInfo.size > 0) {
                this.downloadedAssets.set(url, assetInfo);
                loadedCount++;
              }
            }
          }
        }
        
        console.log(`📦 Loaded ${loadedCount} cached ${category} assets from AsyncStorage`);
      }

      //  Also scan the directory for any files not in AsyncStorage
      const categoryDir = `${this.cacheDirectory}${category}/`;
      const dirInfo = await FileSystem.getInfoAsync(categoryDir);
      
      if (dirInfo.exists) {
        const files = await FileSystem.readDirectoryAsync(categoryDir);
        console.log(`📁 Found ${files.length} files in ${category} cache directory`);
      }
      
      return { success: true, loadedCount, totalCached: loadedCount };
    } catch (error) {
      console.warn(`⚠️ Failed to load cached ${category} assets:`, error);
      return { success: false, error: error.message };
    }
  },

getDownloadStats() {
    return {
      downloadedCount: this.downloadedAssets.size,
      preloadedCount: this.preloadedAssets.size,
      isDownloading: this.isDownloading,
      downloadedUrls: Array.from(this.downloadedAssets.keys()),
      cacheDirectory: this.cacheDirectory,
      maxConcurrentDownloads: this.maxConcurrentDownloads
    };
  },

async clearCategoryCache(category = 'characters') {
    try {
       const cacheKey = `${category}Assets`;
      await AsyncStorage.removeItem(cacheKey);
      
      // Remove from memory maps (filter by category)
      const urlsToRemove = [];
      this.downloadedAssets.forEach((assetInfo, url) => {
        if (assetInfo.category === category) {
          urlsToRemove.push(url);
        }
      });
      
      urlsToRemove.forEach(url => {
        this.downloadedAssets.delete(url);
        this.preloadedAssets.delete(url);
      });
      
      // Delete category folder
      const categoryDir = `${this.cacheDirectory}${category}/`;
      const dirInfo = await FileSystem.getInfoAsync(categoryDir);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(categoryDir, { idempotent: true });
      }
      
      console.log(`🗑️ Cleared ${category} cache`);
    } catch (error) {
      console.error(`❌ Failed to clear ${category} cache:`, error);
    }
  },

async clearAllCaches() {
    try {
      // Clear memory caches
      this.downloadedAssets.clear();
      this.preloadedAssets.clear();
      this.downloadQueue.clear();
      this.isDownloading = false;
      
      // Clear all AsyncStorage entries
      const keys = await AsyncStorage.getAllKeys();
      const assetKeys = keys.filter(key => key.endsWith('Assets'));
      if (assetKeys.length > 0) {
        await AsyncStorage.multiRemove(assetKeys);
      }
      
      // Delete cache directory
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDirectory);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(this.cacheDirectory, { idempotent: true });
      }
      
      console.log('🗑️ All asset caches cleared');
    } catch (error) {
      console.error('❌ Failed to clear all caches:', error);
    }
  }
};
