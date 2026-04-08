import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const videoMethods = {
isVideoFile(url) {
  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'];
  const lowerUrl = url.toLowerCase();
  
  // Check file extension
  if (videoExtensions.some(ext => lowerUrl.includes(ext))) {
    return true;
  }
  
  // Check if it's from video hosting services
  if (lowerUrl.includes('cloudinary.com/video') || 
      lowerUrl.includes('video/upload')) {
    return true;
  }
  
  return false;
  },

extractCharacterVideoAssets(charactersData) {
  const assets = [];
  
  // Add background video from URLS
  if (charactersData.backgroundVideo) {
    assets.push({
      url: charactersData.backgroundVideo,
      name: 'character_select_background',
      type: 'video',
      category: 'character_videos',
      priority: 'high' // High priority for background video
    });
  }
  
  // Add character-specific video assets if any
  Object.values(charactersData).forEach(character => {
    // Check for any video fields in character data
    const videoFields = [
      'character_intro_video',
      'character_showcase_video',
      'character_background_video'
    ];
    
    videoFields.forEach(field => {
      if (character[field] && this.isVideoFile(character[field])) {
        assets.push({
          url: character[field],
          name: `${character.character_name.toLowerCase()}_${field}`,
          type: 'video',
          category: 'character_videos',
          characterName: character.character_name,
          characterId: character.character_id
        });
      }
    });
  });

  console.log(`📹 Extracted ${assets.length} character video assets`);
  return assets;
},

extractUIVideoAssets(uiData) {
  const assets = [];
  
  if (!uiData) return assets;

  // Common UI video assets
  const uiVideoFields = [
    'backgroundVideo',
    'loginBackgroundVideo', 
    'menuBackgroundVideo',
    'characterSelectBackgroundVideo',
    'shopBackgroundVideo',
    'gameplayBackgroundVideo'
  ];

  uiVideoFields.forEach(field => {
    if (uiData[field] && this.isVideoFile(uiData[field])) {
      assets.push({
        url: uiData[field],
        name: field,
        type: 'video',
        category: 'ui_videos',
        priority: field.includes('background') ? 'high' : 'normal'
      });
    }
  });

  console.log(`📹 Extracted ${assets.length} UI video assets`);
  return assets;
},

async downloadVideoAssets(videoAssets, onProgress = null, onAssetComplete = null) {
  if (this.isDownloading) {
    console.warn('⚠️ Asset downloading already in progress');
    return { success: false, reason: 'already_downloading' };
  }

  this.isDownloading = true;
  
  try {
    console.log('📹 Starting video asset download...');
    
    if (!Array.isArray(videoAssets)) {
      videoAssets = [videoAssets];
    }
    
    console.log(`📹 Found ${videoAssets.length} video assets to download`);

    if (videoAssets.length === 0) {
      console.log('📹 No video assets to download');
      this.isDownloading = false;
      return { success: true, downloaded: 0, total: 0 };
    }

    const startTime = Date.now();
    let successCount = 0;
    const results = [];

    // Sort by priority (high priority first)
    const sortedAssets = videoAssets.sort((a, b) => {
      const priorityOrder = { 'high': 0, 'normal': 1, 'low': 2 };
      return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
    });

    // Download videos with controlled concurrency (videos are larger, so fewer concurrent downloads)
    const videoConcurrency = Math.min(this.maxConcurrentDownloads, 2); // Limit to 2 concurrent video downloads
    
    for (let i = 0; i < sortedAssets.length; i += videoConcurrency) {
      const batch = sortedAssets.slice(i, i + videoConcurrency);
      
      const batchPromises = batch.map(async (asset, batchIndex) => {
        const globalIndex = i + batchIndex;
        
        // Individual asset progress callback
        if (onAssetComplete) {
          onAssetComplete({
            url: asset.url,
            name: asset.name,
            type: asset.type,
            category: asset.category,
            characterName: asset.characterName,
            priority: asset.priority,
            progress: 0,
            currentIndex: globalIndex,
            totalAssets: sortedAssets.length
          });
        }

        const result = await this.downloadSingleAsset(
          asset.url, 
          asset.category, 
          (downloadProgress) => {
            // Individual asset download progress
            if (onAssetComplete) {
              onAssetComplete({
                url: asset.url,
                name: asset.name,
                type: asset.type,
                category: asset.category,
                characterName: asset.characterName,
                priority: asset.priority,
                progress: downloadProgress.progress,
                currentIndex: globalIndex,
                totalAssets: sortedAssets.length,
                bytesWritten: downloadProgress.bytesWritten,
                totalBytes: downloadProgress.totalBytes
              });
            }
          }
        );
        
        if (result.success) {
          successCount++;
        }
        
        const assetResult = { asset, result };
        results.push(assetResult);
        
        // Overall progress callback
        if (onProgress) {
          onProgress({
            loaded: results.length,
            total: sortedAssets.length,
            progress: results.length / sortedAssets.length,
            successCount,
            currentAsset: asset,
            category: 'videos'
          });
        }

        return assetResult;
      });

      // Wait for current batch to complete before starting next batch
      await Promise.all(batchPromises);
    }

    const totalTime = Date.now() - startTime;
    this.isDownloading = false;

    // Save cache info to AsyncStorage
    try {
      const cacheKey = 'videoAssets';
      const cacheInfo = {
        downloadedAt: Date.now(),
        category: 'videos',
        assets: Array.from(this.downloadedAssets.entries()).filter(([url, info]) => 
          this.isVideoFile(url)
        ),
        totalAssets: successCount
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheInfo));
      console.log(`💾 Saved video asset cache info to storage`);
    } catch (error) {
      console.warn('⚠️ Failed to save video cache info to AsyncStorage:', error);
    }

    console.log(`📹 Video asset download completed: ${successCount}/${sortedAssets.length} in ${totalTime}ms`);
    
    return {
      success: true,
      downloaded: successCount,
      total: sortedAssets.length,
      totalTime,
      results,
      category: 'videos',
      failedAssets: results
        .filter(r => !r.result.success)
        .map(r => r.asset)
    };

  } catch (error) {
    console.error('❌ Error downloading video assets:', error);
    this.isDownloading = false;
    throw error;
  }
},

async downloadCharacterSelectVideo(backgroundVideoUrl, onProgress = null, onAssetComplete = null) {
  const videoAsset = {
    url: backgroundVideoUrl,
    name: 'character_select_background',
    type: 'video',
    category: 'ui_videos',
    priority: 'high'
  };

  return await this.downloadVideoAssets([videoAsset], onProgress, onAssetComplete);
},

async areVideoAssetsCached(videoAssets) {
  if (!Array.isArray(videoAssets)) {
    videoAssets = [videoAssets];
  }
  
  if (videoAssets.length === 0) {
    return { cached: true, total: 0, available: 0 };
  }

  let availableCount = 0;
  for (const asset of videoAssets) {
    const assetInfo = this.downloadedAssets.get(asset.url);
    if (assetInfo && assetInfo.localPath) {
      const fileInfo = await FileSystem.getInfoAsync(assetInfo.localPath);
      if (fileInfo.exists && fileInfo.size > 0) {
        availableCount++;
      }
    }
  }

  const cached = availableCount === videoAssets.length;
  console.log(`🔍 Video assets cache check: ${availableCount}/${videoAssets.length} available`);
  
  return {
    cached,
    total: videoAssets.length,
    available: availableCount,
    missing: videoAssets.length - availableCount,
    missingAssets: videoAssets
      .filter(asset => !this.downloadedAssets.has(asset.url))
      .map(asset => ({ url: asset.url, name: asset.name, type: asset.type }))
  };
},

transformVideoDataWithCache(data) {
  if (!data) return data;

  const transformedData = { ...data };
  
  // Handle different data structures
  if (typeof data === 'string' && this.isVideoFile(data)) {
    // Single video URL
    return this.getCachedAssetPath(data);
  }
  
  if (Array.isArray(data)) {
    // Array of video URLs
    return data.map(item => 
      typeof item === 'string' && this.isVideoFile(item) 
        ? this.getCachedAssetPath(item) 
        : item
    );
  }
  
  if (typeof data === 'object') {
    // Object with video URL properties
    Object.keys(transformedData).forEach(key => {
      const value = transformedData[key];
      if (typeof value === 'string' && this.isVideoFile(value)) {
        transformedData[key] = this.getCachedAssetPath(value);
      } else if (typeof value === 'object') {
        transformedData[key] = this.transformVideoDataWithCache(value);
      }
    });
  }

  return transformedData;
}
};
