import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const profileMethods = {
extractPlayerProfileAssets(playerData) {
    const assets = [];
    
    if (!playerData) return assets;

    // Hero/Character assets
    if (playerData.heroSelected) {
      assets.push({
        url: playerData.heroSelected.character_image_display,
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
  },

extractProfileAssetsForMapReuse(profileData) {
    const assets = [];
    const addedUrls = new Set();

    const addAsset = (url, name, type, category) => {
      if (url && typeof url === 'string' && !addedUrls.has(url)) {
        addedUrls.add(url);
        assets.push({ url, name, type, category });
      }
    };

    if (!profileData) return assets;

    // Hero/Character display image (same as Map API character assets)
    if (profileData.heroSelected?.character_image_display) {
      addAsset(profileData.heroSelected.character_image_display, 'hero_display', 'image', 'game_images');
    }

    // Badge icons (same URLs as Map API)
    if (profileData.badges && Array.isArray(profileData.badges)) {
      profileData.badges.forEach((badge, i) => {
        if (badge.icon) {
          addAsset(badge.icon, `badge_icon_${i}`, 'image', 'game_images');
        }
        if (badge.landscape_image) {
          addAsset(badge.landscape_image, `badge_landscape_${i}`, 'image', 'game_images');
        }
      });
    }

    // Selected badge landscape image
    if (profileData.selectedBadge?.landscape_image) {
      addAsset(profileData.selectedBadge.landscape_image, 'selected_badge_landscape', 'image', 'game_images');
    }

    // Potion icons (same URLs as Map API)
    if (profileData.potions && Array.isArray(profileData.potions)) {
      profileData.potions.forEach((potion, i) => {
        if (potion.icon) {
          addAsset(potion.icon, `potion_icon_${i}`, 'image', 'game_images');
        }
      });
    }

    // Stats icons (coin icon, etc.)
    if (profileData.statsIcons) {
      Object.entries(profileData.statsIcons).forEach(([key, url]) => {
        if (url) {
          addAsset(url, `stats_icon_${key}`, 'image', 'game_images');
        }
      });
    }

    // Background images
    if (profileData.background) {
      addAsset(profileData.background, 'profile_background', 'image', 'game_images');
    }
    if (profileData.containerBackground) {
      addAsset(profileData.containerBackground, 'container_background', 'image', 'game_images');
    }

    console.log(`📦 Extracted ${assets.length} profile assets for Map cache reuse`);
    return assets;
  },

async areProfileAssetsCachedFromMap(profileData) {
    const assets = this.extractProfileAssetsForMapReuse(profileData);

    if (assets.length === 0) {
      return { cached: true, total: 0, available: 0, missing: 0, missingAssets: [] };
    }

    let availableCount = 0;
    const missingAssets = [];

    for (const asset of assets) {
      let isAvailable = false;

      // Check in-memory cache (includes Map API preloaded assets)
      const assetInfo = this.downloadedAssets.get(asset.url);
      
      if (assetInfo && assetInfo.localPath) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(assetInfo.localPath);
          if (fileInfo.exists && fileInfo.size > 0) {
            isAvailable = true;
          }
        } catch (e) {
          // File check failed
        }
      }
      
      // If not in memory, check disk in multiple categories (Map API may have stored in different category)
      if (!isAvailable) {
        const categoriesToCheck = ['game_images', 'game_animations', 'map_assets', 'player_profile'];
        
        for (const category of categoriesToCheck) {
          const localPath = this.getLocalFilePath(asset.url, category);
          try {
            const fileInfo = await FileSystem.getInfoAsync(localPath);
            if (fileInfo.exists && fileInfo.size > 0) {
              // Found on disk - add to memory cache
              this.downloadedAssets.set(asset.url, {
                localPath,
                category,
                url: asset.url,
                downloadedAt: Date.now(),
                fileSize: fileInfo.size
              });
              isAvailable = true;
              console.log(`📦 Found profile asset in ${category} cache: ${asset.name}`);
              break;
            }
          } catch (e) {
            // Continue checking other categories
          }
        }
      }

      if (isAvailable) {
        availableCount++;
      } else {
        missingAssets.push(asset);
      }
    }

    const cached = availableCount === assets.length;
    
    console.log(`🔍 Profile asset cache check (Map reuse): ${availableCount}/${assets.length} available`, {
      cached,
      missing: missingAssets.length,
      missingNames: missingAssets.slice(0, 5).map(a => a.name)
    });

    return {
      cached,
      total: assets.length,
      available: availableCount,
      missing: assets.length - availableCount,
      missingAssets
    };
  },

async downloadMissingProfileAssets(missingAssets, onProgress = null) {
    if (!missingAssets || missingAssets.length === 0) {
      console.log(' No missing profile assets to download');
      return { success: true, downloaded: 0, total: 0 };
    }

    console.log(`📦 Downloading ${missingAssets.length} missing profile assets...`);
    
    const startTime = Date.now();
    let successCount = 0;

    for (let i = 0; i < missingAssets.length; i += this.maxConcurrentDownloads) {
      const batch = missingAssets.slice(i, i + this.maxConcurrentDownloads);
      
      const results = await Promise.all(
        batch.map(asset => 
          this.downloadSingleAsset(asset.url, 'game_images', null, 2)
        )
      );

      results.forEach(result => {
        if (result.success) successCount++;
      });

      if (onProgress) {
        onProgress({
          loaded: Math.min(i + batch.length, missingAssets.length),
          total: missingAssets.length,
          progress: Math.min(i + batch.length, missingAssets.length) / missingAssets.length
        });
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`📦 Missing profile assets download completed: ${successCount}/${missingAssets.length} in ${totalTime}ms`);

    return {
      success: successCount === missingAssets.length,
      downloaded: successCount,
      total: missingAssets.length,
      totalTime
    };
  },

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
  },

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
  },

transformPlayerDataWithCache(playerData) {
    if (!playerData) return playerData;

    const transformedData = { ...playerData };
    
    // Transform hero avatar
    if (transformedData.heroSelected && transformedData.heroSelected.character_image_display) {
      transformedData.heroSelected.character_image_display = this.getCachedAssetPath(transformedData.heroSelected.character_image_display);
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
  },

transformProfileDataWithMapCache(profileData) {
    if (!profileData) return profileData;

    const transformedData = { ...profileData };

    // Transform hero display image
    if (transformedData.heroSelected?.character_image_display) {
      transformedData.heroSelected = {
        ...transformedData.heroSelected,
        character_image_display: this.getCachedAssetPath(transformedData.heroSelected.character_image_display)
      };
    }

    // Transform selected badge landscape image
    if (transformedData.selectedBadge?.landscape_image) {
      transformedData.selectedBadge = {
        ...transformedData.selectedBadge,
        landscape_image: this.getCachedAssetPath(transformedData.selectedBadge.landscape_image)
      };
    }

    // Transform badge icons and landscape images
    if (transformedData.badges && Array.isArray(transformedData.badges)) {
      transformedData.badges = transformedData.badges.map(badge => ({
        ...badge,
        icon: badge.icon ? this.getCachedAssetPath(badge.icon) : badge.icon,
        landscape_image: badge.landscape_image ? this.getCachedAssetPath(badge.landscape_image) : badge.landscape_image
      }));
    }

    // Transform potion icons
    if (transformedData.potions && Array.isArray(transformedData.potions)) {
      transformedData.potions = transformedData.potions.map(potion => ({
        ...potion,
        icon: potion.icon ? this.getCachedAssetPath(potion.icon) : potion.icon
      }));
    }

    // Transform stats icons
    if (transformedData.statsIcons) {
      const transformedIcons = {};
      Object.entries(transformedData.statsIcons).forEach(([key, url]) => {
        transformedIcons[key] = url ? this.getCachedAssetPath(url) : url;
      });
      transformedData.statsIcons = transformedIcons;
    }

    // Transform backgrounds
    if (transformedData.background) {
      transformedData.background = this.getCachedAssetPath(transformedData.background);
    }
    if (transformedData.containerBackground) {
      transformedData.containerBackground = this.getCachedAssetPath(transformedData.containerBackground);
    }

    console.log(' Profile data transformed with Map API cached paths');
    return transformedData;
  }
};
