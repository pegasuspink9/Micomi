import { Image as RNImage } from 'react-native';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

class UniversalAssetPreloader {
  constructor() {
    this.downloadedAssets = new Map();
    this.preloadedAssets = new Map();
    this.downloadQueue = new Map();
    this.isDownloading = false;
    this.cacheDirectory = FileSystem.documentDirectory + 'gameAssets/';
    this.maxConcurrentDownloads = 3; // Prevent overwhelming the device
  }

  // ✅ Create cache directory structure
  async ensureCacheDirectory(category = '') {
    const targetDir = category ? `${this.cacheDirectory}${category}/` : this.cacheDirectory;
    const dirInfo = await FileSystem.getInfoAsync(targetDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true });
      console.log(`📁 Created cache directory: ${category || 'root'}`);
    }
    return targetDir;
  }

  // ✅ Generate local file path for asset
  getLocalFilePath(url, category = 'general') {
    const urlParts = url.split('/');
    const fileName = urlParts.pop().split('?')[0] || `asset_${Date.now()}`;
    
    // Handle different hosts and ensure proper file extensions
    let finalFileName = fileName;
    if (!fileName.includes('.')) {
      // If no extension, try to determine from URL or use default
      if (url.includes('cloudinary')) {
        finalFileName += '.png'; // Cloudinary usually serves images
      } else if (url.includes('github')) {  
        finalFileName += '.png'; // GitHub assets are typically images
      } else if (url.includes('lottie')) {
        finalFileName += '.json'; // Lottie files
      } else {
        finalFileName += '.png'; // Default to PNG
      }
    }
    
    return `${this.cacheDirectory}${category}/${finalFileName}`;
  }

  // ✅ Download single asset with retry logic
  async downloadSingleAsset(url, category = 'general', onProgress = null, retries = 2) {
    try {
      await this.ensureCacheDirectory(category);
      
      const localPath = this.getLocalFilePath(url, category);
      
      // Check if already downloaded and file exists
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (fileInfo.exists && fileInfo.size > 0) {
        console.log(`📦 Asset already cached: ${url.slice(-50)}`);
        this.downloadedAssets.set(url, { localPath, category, url });
        return { success: true, localPath, cached: true, url };
      }

      console.log(`📦 Downloading ${category} asset: ${url.slice(-50)}`);
      const startTime = Date.now();
      
      // Create download with progress tracking
      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        localPath,
        {},
        onProgress ? (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          onProgress({ 
            progress: Math.min(progress, 1), 
            url, 
            category,
            downloadProgress,
            bytesWritten: downloadProgress.totalBytesWritten,
            totalBytes: downloadProgress.totalBytesExpectedToWrite
          });
        } : undefined
      );

      const result = await downloadResumable.downloadAsync();
      const downloadTime = Date.now() - startTime;

      if (result && result.uri) {
        // Verify the downloaded file
        const downloadedFileInfo = await FileSystem.getInfoAsync(result.uri);
        if (!downloadedFileInfo.exists || downloadedFileInfo.size === 0) {
          throw new Error('Downloaded file is empty or corrupted');
        }

        this.downloadedAssets.set(url, { 
          localPath: result.uri, 
          category, 
          url,
          downloadedAt: Date.now(),
          fileSize: downloadedFileInfo.size
        });
        
        // Preload images to memory cache (skip for non-image files)
        if (this.isImageFile(url)) {
          try {
            await RNImage.prefetch(`file://${result.uri}`);
            this.preloadedAssets.set(url, {
              loadedAt: Date.now(),
              loadTime: downloadTime,
              url,
              localPath: result.uri,
              category
            });
          } catch (prefetchError) {
            console.warn(`⚠️ Failed to prefetch ${category} asset to memory:`, prefetchError);
            // Don't fail the download if prefetch fails
          }
        }

        console.log(`✅ ${category} asset downloaded in ${downloadTime}ms: ${url.slice(-50)}`);
        return { 
          success: true, 
          localPath: result.uri, 
          downloadTime, 
          url, 
          category,
          fileSize: downloadedFileInfo.size
        };
      } else {
        throw new Error('Download failed - no result URI');
      }
    } catch (error) {
      console.error(`❌ Failed to download ${category} asset: ${url}`, error);
      
      // Retry logic
      if (retries > 0) {
        console.log(`🔄 Retrying download (${retries} retries left): ${url.slice(-50)}`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        return this.downloadSingleAsset(url, category, onProgress, retries - 1);
      }
      
      return { success: false, error: error.message, url, category };
    }
  }

  // ✅ Check if URL is an image file
  isImageFile(url) {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
    const lowerUrl = url.toLowerCase();
    
    // Check file extension
    if (imageExtensions.some(ext => lowerUrl.includes(ext))) {
      return true;
    }
    
    // Check if it's from image hosting services
    if (lowerUrl.includes('cloudinary.com') || 
        lowerUrl.includes('github.com') || 
        lowerUrl.includes('githubusercontent.com')) {
      return true;
    }
    
    return false;
  }

  // ✅ Extract character assets from character data
  extractCharacterAssets(charactersData) {
    const assets = [];
    
    Object.values(charactersData).forEach(character => {
      const charAssets = [
        { url: character.character_avatar, name: 'avatar', type: 'image' },
        { url: character.character_image_display, name: 'display_image', type: 'image' },
        { url: character.character_hero_lottie, name: 'hero_lottie', type: 'animation' },
        { url: character.roleIcon, name: 'role_icon', type: 'image' },
        { url: character.damageIcon, name: 'damage_icon', type: 'image' },
        { url: character.character_run, name: 'run_animation', type: 'animation' },
        { url: character.character_dies, name: 'death_animation', type: 'animation' },
        { url: character.character_hurt, name: 'hurt_animation', type: 'animation' },
        { url: character.avatar_image, name: 'avatar_image', type: 'image' }
      ];

      // Handle character attacks array
      if (Array.isArray(character.character_attacks)) {
        character.character_attacks.forEach((attackUrl, index) => {
          if (attackUrl) {
            charAssets.push({
              url: attackUrl,
              name: `attack_${index}`,
              type: 'animation'
            });
          }
        });
      }

      // Filter out null/undefined URLs and add character context
      charAssets
        .filter(asset => asset.url && typeof asset.url === 'string')
        .forEach(asset => {
          assets.push({
            ...asset,
            characterName: character.character_name,
            characterId: character.character_id,
            category: 'characters'
          });
        });
    });

    return assets;
  }


  extractPlayerProfileAssets(playerData) {
    const assets = [];
    
    if (!playerData) return assets;

    // Hero/Character assets
    if (playerData.heroSelected) {
      assets.push({
        url: playerData.heroSelected.avatar,
        name: 'hero_avatar',
        type: 'image',
        category: 'player_profile'
      });
    }

    if (playerData.background) {
      assets.push({
        url: playerData.background,
        name: 'background',
        type: 'image',
        category: 'player_profile'
      });
    }

    if (playerData.containerBackground) {
      assets.push({
        url: playerData.containerBackground,
        name: 'container_background',
        type: 'image',
        category: 'player_profile'
      });
    }

    // Stats icons
    if (playerData.statsIcons) {
      Object.entries(playerData.statsIcons).forEach(([key, url]) => {
        if (url) {
          assets.push({
            url: url,
            name: `stats_${key}`,
            type: 'image',
            category: 'player_profile'
          });
        }
      });
    }

    // Badge assets
    if (playerData.badges) {
      playerData.badges.forEach((badge, index) => {
        if (badge.icon) {
          assets.push({
            url: badge.icon,
            name: `badge_${badge.id || index}`,
            type: 'image',
            category: 'player_profile',
            badgeId: badge.id,
            badgeName: badge.name
          });
        }
      });
    }

    // Potion assets
    if (playerData.potions) {
      playerData.potions.forEach((potion, index) => {
        if (potion.icon) {
          assets.push({
            url: potion.icon,
            name: `potion_${potion.id || index}`,
            type: 'image',
            category: 'player_profile',
            potionId: potion.id,
            potionName: potion.name
          });
        }
      });
    }

    // Quest reward icons (assuming they use coin icon)
    if (playerData.quests) {
      playerData.quests.forEach((quest, index) => {
        // Add common reward icons
        const rewardIconUrl = "https://github.com/user-attachments/assets/cdbba724-147a-41fa-89c5-26e7252c66cd";
        assets.push({
          url: rewardIconUrl,
          name: `quest_reward_${quest.id || index}`,
          type: 'image',
          category: 'player_profile',
          questId: quest.id,
          questTitle: quest.title
        });
      });
    }

    // Badge border frame
    const badgeBorderUrl = 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1760065969/Untitled_design_6_ioccva.png';
    assets.push({
      url: badgeBorderUrl,
      name: 'badge_border_frame',
      type: 'image',
      category: 'player_profile'
    });

    // Remove duplicates
    const uniqueAssets = assets.filter((asset, index, self) => 
      index === self.findIndex(a => a.url === asset.url)
    );

    console.log(`📦 Extracted ${uniqueAssets.length} player profile assets`);
    return uniqueAssets;
  }



  // ✅ Download all character assets
  async downloadCharacterAssets(charactersData, onProgress = null, onAssetComplete = null) {
    if (this.isDownloading) {
      console.warn('⚠️ Asset downloading already in progress');
      return { success: false, reason: 'already_downloading' };
    }

    this.isDownloading = true;
    
    try {
      console.log('📦 Starting character asset download...');
      
      const assets = this.extractCharacterAssets(charactersData);
      console.log(`📦 Found ${assets.length} character assets to download`);

      if (assets.length === 0) {
        console.log('📦 No character assets to download');
        this.isDownloading = false;
        return { success: true, downloaded: 0, total: 0 };
      }

      const startTime = Date.now();
      let successCount = 0;
      const results = [];
      const downloadPromises = [];

      // Group assets by character for better organization
      const assetsByCharacter = {};
      assets.forEach(asset => {
        if (!assetsByCharacter[asset.characterName]) {
          assetsByCharacter[asset.characterName] = [];
        }
        assetsByCharacter[asset.characterName].push(asset);
      });

      console.log(`📦 Downloading assets for ${Object.keys(assetsByCharacter).length} characters`);

      // Download assets with controlled concurrency
      for (let i = 0; i < assets.length; i += this.maxConcurrentDownloads) {
        const batch = assets.slice(i, i + this.maxConcurrentDownloads);
        
        const batchPromises = batch.map(async (asset, batchIndex) => {
          const globalIndex = i + batchIndex;
          
          // Individual asset progress callback
          if (onAssetComplete) {
            onAssetComplete({
              url: asset.url,
              name: asset.name,
              type: asset.type,
              characterName: asset.characterName,
              progress: 0,
              currentIndex: globalIndex,
              totalAssets: assets.length
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
                  characterName: asset.characterName,
                  progress: downloadProgress.progress,
                  currentIndex: globalIndex,
                  totalAssets: assets.length,
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
              total: assets.length,
              progress: results.length / assets.length,
              successCount,
              currentAsset: asset,
              category: 'characters'
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
        const cacheKey = 'characterAssets';
        const cacheInfo = {
          downloadedAt: Date.now(),
          category: 'characters',
          assets: Array.from(this.downloadedAssets.entries()),
          totalAssets: successCount,
          charactersData: Object.keys(charactersData) // Store character names for reference
        };
        await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheInfo));
        console.log(`💾 Saved character asset cache info to storage`);
      } catch (error) {
        console.warn('⚠️ Failed to save cache info to AsyncStorage:', error);
      }

      console.log(`📦 Character asset download completed: ${successCount}/${assets.length} in ${totalTime}ms`);
      
      return {
        success: true,
        downloaded: successCount,
        total: assets.length,
        totalTime,
        results,
        category: 'characters',
        failedAssets: results
          .filter(r => !r.result.success)
          .map(r => r.asset),
        assetsByCharacter: assetsByCharacter
      };

    } catch (error) {
      console.error('❌ Error downloading character assets:', error);
      this.isDownloading = false;
      throw error;
    }
  }

  async downloadPlayerProfileAssets(playerData, onProgress = null, onAssetComplete = null) {
    if (this.isDownloading) {
      console.warn('⚠️ Asset downloading already in progress');
      return { success: false, reason: 'already_downloading' };
    }

    this.isDownloading = true;
    
    try {
      console.log('📦 Starting player profile asset download...');
      
      const assets = this.extractPlayerProfileAssets(playerData);
      console.log(`📦 Found ${assets.length} player profile assets to download`);

      if (assets.length === 0) {
        console.log('📦 No player profile assets to download');
        this.isDownloading = false;
        return { success: true, downloaded: 0, total: 0 };
      }

      const startTime = Date.now();
      let successCount = 0;
      const results = [];

      // Download assets with controlled concurrency
      for (let i = 0; i < assets.length; i += this.maxConcurrentDownloads) {
        const batch = assets.slice(i, i + this.maxConcurrentDownloads);
        
        const batchPromises = batch.map(async (asset, batchIndex) => {
          const globalIndex = i + batchIndex;
          
          // Individual asset progress callback
          if (onAssetComplete) {
            onAssetComplete({
              url: asset.url,
              name: asset.name,
              type: asset.type,
              category: asset.category,
              progress: 0,
              currentIndex: globalIndex,
              totalAssets: assets.length
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
                  progress: downloadProgress.progress,
                  currentIndex: globalIndex,
                  totalAssets: assets.length,
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
              total: assets.length,
              progress: results.length / assets.length,
              successCount,
              currentAsset: asset,
              category: 'player_profile'
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
        const cacheKey = 'playerProfileAssets';
        const cacheInfo = {
          downloadedAt: Date.now(),
          category: 'player_profile',
          assets: Array.from(this.downloadedAssets.entries()).filter(([url, info]) => 
            info.category === 'player_profile'
          ),
          totalAssets: successCount
        };
        await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheInfo));
        console.log(`💾 Saved player profile asset cache info to storage`);
      } catch (error) {
        console.warn('⚠️ Failed to save cache info to AsyncStorage:', error);
      }

      console.log(`📦 Player profile asset download completed: ${successCount}/${assets.length} in ${totalTime}ms`);
      
      return {
        success: true,
        downloaded: successCount,
        total: assets.length,
        totalTime,
        results,
        category: 'player_profile',
        failedAssets: results
          .filter(r => !r.result.success)
          .map(r => r.asset)
      };

    } catch (error) {
      console.error('❌ Error downloading player profile assets:', error);
      this.isDownloading = false;
      throw error;
    }
  }

   async arePlayerProfileAssetsCached(playerData) {
    const assets = this.extractPlayerProfileAssets(playerData);
    
    if (assets.length === 0) {
      return { cached: true, total: 0, available: 0 };
    }

    let availableCount = 0;
    for (const asset of assets) {
      const assetInfo = this.downloadedAssets.get(asset.url);
      if (assetInfo && assetInfo.localPath) {
        const fileInfo = await FileSystem.getInfoAsync(assetInfo.localPath);
        if (fileInfo.exists && fileInfo.size > 0) {
          availableCount++;
        }
      }
    }

    const cached = availableCount === assets.length;
    console.log(`🔍 Player profile assets cache check: ${availableCount}/${assets.length} available`);
    
    return {
      cached,
      total: assets.length,
      available: availableCount,
      missing: assets.length - availableCount,
      missingAssets: assets
        .filter(asset => !this.downloadedAssets.has(asset.url))
        .map(asset => ({ url: asset.url, name: asset.name, type: asset.type }))
    };
  }

  transformPlayerDataWithCache(playerData) {
    if (!playerData) return playerData;

    const transformedData = { ...playerData };
    
    // Transform hero avatar
    if (transformedData.heroSelected && transformedData.heroSelected.avatar) {
      transformedData.heroSelected.avatar = this.getCachedAssetPath(transformedData.heroSelected.avatar);
    }

    // Transform backgrounds
    if (transformedData.background) {
      transformedData.background = this.getCachedAssetPath(transformedData.background);
    }
    if (transformedData.containerBackground) {
      transformedData.containerBackground = this.getCachedAssetPath(transformedData.containerBackground);
    }

    // Transform stats icons
    if (transformedData.statsIcons) {
      Object.keys(transformedData.statsIcons).forEach(key => {
        if (transformedData.statsIcons[key]) {
          transformedData.statsIcons[key] = this.getCachedAssetPath(transformedData.statsIcons[key]);
        }
      });
    }

    // Transform badge icons
    if (transformedData.badges) {
      transformedData.badges = transformedData.badges.map(badge => ({
        ...badge,
        icon: badge.icon ? this.getCachedAssetPath(badge.icon) : badge.icon
      }));
    }

    // Transform potion icons
    if (transformedData.potions) {
      transformedData.potions = transformedData.potions.map(potion => ({
        ...potion,
        icon: potion.icon ? this.getCachedAssetPath(potion.icon) : potion.icon
      }));
    }

    return transformedData;
  }

  // ✅ Get cached asset path (local file or original URL)
  getCachedAssetPath(url) {
    const assetInfo = this.downloadedAssets.get(url);
    if (assetInfo && assetInfo.localPath) {
      return `file://${assetInfo.localPath}`;
    }
    return url; // Fallback to original URL
  }

  getCachedAssetPaths(urls) {
    const paths = {};
    urls.forEach(url => {
      paths[url] = this.getCachedAssetPath(url);
    });
    return paths;
  }

  async loadCachedAssets(category = 'characters') {
    try {
      await this.ensureCacheDirectory(category);
      
      const cacheKey = category === 'characters' ? 'characterAssets' : `${category}Assets`;
      const cacheInfoString = await AsyncStorage.getItem(cacheKey);
      
      if (cacheInfoString) {
        const cacheInfo = JSON.parse(cacheInfoString);
        
        // Verify cached files still exist
        let loadedCount = 0;
        for (const [url, assetInfo] of cacheInfo.assets) {
          if (assetInfo && assetInfo.localPath) {
            const fileInfo = await FileSystem.getInfoAsync(assetInfo.localPath);
            if (fileInfo.exists && fileInfo.size > 0) {
              this.downloadedAssets.set(url, {
                ...assetInfo,
                loadedFromCache: true
              });
              
              // Also add to preloaded if it's an image
              if (this.isImageFile(url)) {
                this.preloadedAssets.set(url, {
                  loadedAt: cacheInfo.downloadedAt,
                  url,
                  localPath: assetInfo.localPath,
                  fromCache: true,
                  category
                });
              }
              
              loadedCount++;
            } else {
              console.warn(`⚠️ Cached file missing or empty: ${assetInfo.localPath}`);
            }
          }
        }
        
        console.log(`📂 Loaded ${loadedCount} cached ${category} assets from storage`);
        return { success: true, loadedCount, totalCached: cacheInfo.assets.length };
      }
      
      return { success: true, loadedCount: 0, totalCached: 0 };
    } catch (error) {
      console.warn(`⚠️ Failed to load cached ${category} assets:`, error);
      return { success: false, error: error.message };
    }
  }

  async areCharacterAssetsCached(charactersData) {
    const assets = this.extractCharacterAssets(charactersData);
    
    if (assets.length === 0) {
      return { cached: true, total: 0, available: 0 };
    }

    let availableCount = 0;
    for (const asset of assets) {
      const assetInfo = this.downloadedAssets.get(asset.url);
      if (assetInfo && assetInfo.localPath) {
        const fileInfo = await FileSystem.getInfoAsync(assetInfo.localPath);
        if (fileInfo.exists && fileInfo.size > 0) {
          availableCount++;
        }
      }
    }

    const cached = availableCount === assets.length;
    console.log(`🔍 Character assets cache check: ${availableCount}/${assets.length} available`);
    
    return {
      cached,
      total: assets.length,
      available: availableCount,
      missing: assets.length - availableCount,
      missingAssets: assets
        .filter(asset => !this.downloadedAssets.has(asset.url))
        .map(asset => ({ url: asset.url, name: asset.name, character: asset.characterName }))
    };
  }

  transformCharacterDataWithCache(charactersData) {
    const transformedData = { ...charactersData };
    
    Object.keys(transformedData).forEach(characterName => {
      const character = transformedData[characterName];
      
      // Replace URLs with cached paths
      const urlFields = [
        'character_avatar',
        'character_image_display', 
        'character_hero_lottie',
        'roleIcon',
        'damageIcon',
        'character_run',
        'character_dies', 
        'character_hurt',
        'avatar_image'
      ];
      
      urlFields.forEach(field => {
        if (character[field]) {
          character[field] = this.getCachedAssetPath(character[field]);
        }
      });
      
      // Handle character attacks array
      if (Array.isArray(character.character_attacks)) {
        character.character_attacks = character.character_attacks.map(url => 
          url ? this.getCachedAssetPath(url) : url
        );
      }
    });
    
    return transformedData;
  }
  
  getDownloadStats() {
    return {
      downloadedCount: this.downloadedAssets.size,
      preloadedCount: this.preloadedAssets.size,
      isDownloading: this.isDownloading,
      downloadedUrls: Array.from(this.downloadedAssets.keys()),
      cacheDirectory: this.cacheDirectory,
      maxConcurrentDownloads: this.maxConcurrentDownloads
    };
  }

  // ✅ Clear cache for specific category
  async clearCategoryCache(category = 'characters') {
    try {
      const cacheKey = category === 'characters' ? 'characterAssets' : `${category}Assets`;
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
  }

  // ✅ Clear all caches
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
}

// Export singleton instance
export const universalAssetPreloader = new UniversalAssetPreloader();