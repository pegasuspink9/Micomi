import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const shopMethods = {
getStaticPotionShopAssets() {
    const assets = [];
    const addedUrls = new Set();
    const addAsset = (url, name, type, category) => {
      if (url && typeof url === "string" && !addedUrls.has(url)) {
        addedUrls.add(url);
        assets.push({ url, name, type, category });
      }
    };

    addAsset(
      'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1760334965/shop_holder_deydxu.png',
      'shop_background_holder',
      'image',
      'potion_shop_ui'
    );
    addAsset(
      'https://micomi-assets.me/Hero%20Selection%20Components/Shi-Shi%20Shop.mp4',
      'shishi_shopkeeper_video',
      'video',
      'ui_videos'
    );

     addAsset(
      'https://micomi-assets.me/Sounds/Final/Shop.ogg',
      'shop_bgm',
      'audio',
      'static_sounds'
    );
    
    return assets;
  },

extractPotionShopAssets(levelPreviewData) {
    const assets = [];
    const addedUrls = new Set();
    const addAsset = (url, name, type, category) => {
      if (url && typeof url === "string" && !addedUrls.has(url)) {
        addedUrls.add(url);
        assets.push({ url, name, type, category });
      }
    };

    // Include static shop assets
    const staticAssets = this.getStaticPotionShopAssets();
    assets.push(...staticAssets);

    if (!levelPreviewData || !levelPreviewData.potionShop) return assets;

    levelPreviewData.potionShop.forEach((potion) => {
      if (potion.potion_url && typeof potion.potion_url === "string") {
        addAsset(
          potion.potion_url,
          `potion_${potion.potion_type}`,
          "image",
          "potion_shop"
        );
      }
    });

    console.log(`📦 Extracted ${assets.length} potion shop assets`);
    return assets;
  },

extractCharacterShopAssetsForMapReuse(charactersData) {
    const assets = [];
    const addedUrls = new Set();

    const addAsset = (url, name, type, category) => {
      if (url && 
          typeof url === 'string' && 
          !addedUrls.has(url) &&
          !url.startsWith('file://') &&
          !url.startsWith('/data/') &&
          (url.startsWith('http://') || url.startsWith('https://'))) {
        addedUrls.add(url);
        assets.push({ url, name, type, category });
      }
    };

    if (!charactersData) return assets;

    Object.values(charactersData).forEach(character => {
      const charName = character.character_name || 'unknown';
      
      addAsset(character.character_idle || character.avatar_image, `${charName}_idle`, 'animation', 'game_animations');
      addAsset(character.character_run, `${charName}_run`, 'animation', 'game_animations');
      addAsset(character.character_hurt, `${charName}_hurt`, 'animation', 'game_animations');
      addAsset(character.character_dies, `${charName}_dies`, 'animation', 'game_animations');
      
      // Character attacks array
      if (Array.isArray(character.character_attacks)) {
        character.character_attacks.forEach((attackUrl, i) => {
          addAsset(attackUrl, `${charName}_attack_${i}`, 'animation', 'game_animations');
        });
      }

      // Image assets (likely cached from Map API game_images)
      addAsset(character.character_avatar, `${charName}_avatar`, 'image', 'game_images');
      addAsset(character.avatar_image, `${charName}_avatar_image`, 'image', 'game_images');
      
      // Character selection specific assets (may need to download)
      addAsset(character.character_image_display, `${charName}_display`, 'image', 'characters');
      addAsset(character.character_image_select, `${charName}_select`, 'image', 'characters');
      addAsset(character.character_hero_lottie, `${charName}_lottie`, 'animation', 'characters');
      
      // Role and damage icons
      addAsset(character.roleIcon, `${charName}_role_icon`, 'image', 'characters');
      addAsset(character.damageIcon, `${charName}_damage_icon`, 'image', 'characters');
    });

    console.log(`📦 Extracted ${assets.length} character shop assets for Map cache reuse check`);
    return assets;
  },

async areCharacterShopAssetsCachedFromMap(charactersData) {
    const assets = this.extractCharacterShopAssetsForMapReuse(charactersData);

    if (assets.length === 0) {
      return { cached: true, total: 0, available: 0, missing: 0, missingAssets: [] };
    }

    let availableCount = 0;
    const missingAssets = [];
    const cachedFromMap = [];

    for (const asset of assets) {
      let isAvailable = false;

      // Skip if already a local file
      if (asset.url.startsWith('file://') || asset.url.startsWith('/data/')) {
        availableCount++;
        continue;
      }

      // Step 1: Check in-memory cache (includes Map API cached assets)
      const assetInfo = this.downloadedAssets.get(asset.url);
      if (assetInfo && assetInfo.localPath) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(assetInfo.localPath);
          if (fileInfo.exists && fileInfo.size > 0) {
            isAvailable = true;
            cachedFromMap.push(asset.name);
          }
        } catch (e) {
          // File check failed, will try disk check
        }
      }

      // Step 2: Check disk for Map API cached files
      if (!isAvailable) {
        // Check in game_animations (where Map API stores character animations)
        const animationPath = this.getLocalFilePath(asset.url, 'game_animations');
        try {
          const fileInfo = await FileSystem.getInfoAsync(animationPath);
          if (fileInfo.exists && fileInfo.size > 0) {
            // Found in Map API cache! Add to memory cache
            this.downloadedAssets.set(asset.url, {
              localPath: animationPath,
              category: 'game_animations',
              url: asset.url,
              downloadedAt: Date.now(),
              fileSize: fileInfo.size,
              reusedFromMap: true
            });
            isAvailable = true;
            cachedFromMap.push(asset.name);
          }
        } catch (e) {
          // Not in game_animations
        }

        // Also check game_images
        if (!isAvailable) {
          const imagePath = this.getLocalFilePath(asset.url, 'game_images');
          try {
            const fileInfo = await FileSystem.getInfoAsync(imagePath);
            if (fileInfo.exists && fileInfo.size > 0) {
              this.downloadedAssets.set(asset.url, {
                localPath: imagePath,
                category: 'game_images',
                url: asset.url,
                downloadedAt: Date.now(),
                fileSize: fileInfo.size,
                reusedFromMap: true
              });
              isAvailable = true;
              cachedFromMap.push(asset.name);
            }
          } catch (e) {
            // Not in game_images
          }
        }

        // Check characters category (character selection specific)
        if (!isAvailable) {
          const characterPath = this.getLocalFilePath(asset.url, 'characters');
          try {
            const fileInfo = await FileSystem.getInfoAsync(characterPath);
            if (fileInfo.exists && fileInfo.size > 0) {
              this.downloadedAssets.set(asset.url, {
                localPath: characterPath,
                category: 'characters',
                url: asset.url,
                downloadedAt: Date.now(),
                fileSize: fileInfo.size
              });
              isAvailable = true;
            }
          } catch (e) {
            // Not in characters
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

    console.log(`🔍 Character shop cache check (Map reuse): ${availableCount}/${assets.length} available`, {
      cached,
      missing: missingAssets.length,
      reusedFromMap: cachedFromMap.length,
      missingNames: missingAssets.slice(0, 5).map(a => a.name)
    });

    return {
      cached,
      total: assets.length,
      available: availableCount,
      missing: assets.length - availableCount,
      missingAssets,
      reusedFromMapCount: cachedFromMap.length
    };
  },

async downloadMissingCharacterShopAssets(missingAssets, onProgress = null, onAssetComplete = null) {
    if (!missingAssets || missingAssets.length === 0) {
      console.log('✅ No missing character shop assets to download');
      return { success: true, downloaded: 0, total: 0 };
    }

    const wasDownloading = this.isDownloading;
    this.isDownloading = true;

    try {
      console.log(`📦 Downloading ${missingAssets.length} missing character shop assets...`);
      
      const startTime = Date.now();
      let successCount = 0;
      const results = [];

      for (let i = 0; i < missingAssets.length; i += this.maxConcurrentDownloads) {
        const batch = missingAssets.slice(i, i + this.maxConcurrentDownloads);

        const batchPromises = batch.map(async (asset, batchIndex) => {
          const globalIndex = i + batchIndex;

          if (onAssetComplete) {
            onAssetComplete({
              url: asset.url,
              name: asset.name,
              type: asset.type,
              category: asset.category,
              progress: 0,
              currentIndex: globalIndex,
              totalAssets: missingAssets.length,
            });
          }

          const result = await this.downloadSingleAsset(
            asset.url,
            asset.category,
            (downloadProgress) => {
              if (onAssetComplete) {
                onAssetComplete({
                  ...asset,
                  progress: downloadProgress.progress,
                  currentIndex: globalIndex,
                  totalAssets: missingAssets.length,
                });
              }
            }
          );

          if (result.success) {
            successCount++;
          }

          const assetResult = { asset, result };
          results.push(assetResult);

          if (onProgress) {
            onProgress({
              loaded: results.length,
              total: missingAssets.length,
              progress: results.length / missingAssets.length,
              successCount,
              currentAsset: asset,
            });
          }

          return assetResult;
        });

        await Promise.all(batchPromises);
      }

      const totalTime = Date.now() - startTime;
      this.isDownloading = wasDownloading;

      console.log(`📦 Missing character shop assets download completed: ${successCount}/${missingAssets.length} in ${totalTime}ms`);

      return {
        success: successCount === missingAssets.length,
        downloaded: successCount,
        total: missingAssets.length,
        totalTime,
        results,
        failedAssets: results.filter(r => !r.result.success).map(r => r.asset)
      };
    } catch (error) {
      console.error('❌ Error downloading missing character shop assets:', error);
      this.isDownloading = wasDownloading;
      throw error;
    }
  },

async downloadPotionShopAssets(levelPreviewData, onProgress = null, onAssetComplete = null) {
  if (this.isDownloading) {
    console.warn('⚠️ Asset downloading already in progress');
    return { success: false, reason: 'already_downloading' };
  }

  this.isDownloading = true;
  
  try {
    console.log('🧪 Starting potion shop asset download...');
    
    const assets = this.extractPotionShopAssets(levelPreviewData);
    console.log(`🧪 Found ${assets.length} potion shop assets to download`);

    if (assets.length === 0) {
      console.log('🧪 No potion shop assets to download');
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
            potionType: asset.potionType,
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
                potionType: asset.potionType,
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
            category: 'potion_shop'
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
      const cacheKey = 'potionShopAssets';
      const cacheInfo = {
        downloadedAt: Date.now(),
        category: 'potion_shop',
        assets: Array.from(this.downloadedAssets.entries()).filter(([url, info]) => 
          info.category === 'potion_shop'
        ),
        totalAssets: successCount
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheInfo));
      console.log(`💾 Saved potion shop asset cache info to storage`);
    } catch (error) {
      console.warn('⚠️ Failed to save cache info to AsyncStorage:', error);
    }

    console.log(`🧪 Potion shop asset download completed: ${successCount}/${assets.length} in ${totalTime}ms`);
    
    return {
      success: true,
      downloaded: successCount,
      total: assets.length,
      totalTime,
      results,
      category: 'potion_shop',
      failedAssets: results
        .filter(r => !r.result.success)
        .map(r => r.asset)
    };

  } catch (error) {
    console.error('❌ Error downloading potion shop assets:', error);
    this.isDownloading = false;
    throw error;
  }
},

async arePotionShopAssetsCached(levelPreviewData) {
  const assets = this.extractPotionShopAssets(levelPreviewData);
  
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
  console.log(`🔍 Potion shop assets cache check: ${availableCount}/${assets.length} available`);
  
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

transformCharacterShopDataWithMapCache(charactersData) {
    if (!charactersData) return charactersData;

    const transformedData = {};

    Object.entries(charactersData).forEach(([characterName, character]) => {
      transformedData[characterName] = {
        ...character,
        // Animation assets (from Map API game_animations cache)
        character_idle: this.getCachedAssetPath(character.character_idle || character.avatar_image),
        character_run: this.getCachedAssetPath(character.character_run),
        character_hurt: this.getCachedAssetPath(character.character_hurt),
        character_dies: this.getCachedAssetPath(character.character_dies),
        avatar_image: this.getCachedAssetPath(character.avatar_image),
        
        // Character attacks array
        character_attacks: Array.isArray(character.character_attacks)
          ? character.character_attacks.map(url => this.getCachedAssetPath(url))
          : character.character_attacks,
        
        // Image assets (from Map API game_images cache)
        character_avatar: this.getCachedAssetPath(character.character_avatar),
        
        // Character selection specific assets (from characters cache)
        character_image_display: this.getCachedAssetPath(character.character_image_display),
        character_image_select: this.getCachedAssetPath(character.character_image_select),
        character_hero_lottie: this.getCachedAssetPath(character.character_hero_lottie),
        
        // Icons
        roleIcon: this.getCachedAssetPath(character.roleIcon),
        damageIcon: this.getCachedAssetPath(character.damageIcon),

        // AttributePanel card images are downloaded in map preload as game_visuals.
        cards: Array.isArray(character.cards)
          ? character.cards.map(card => ({
              ...card,
              character_attack_card: this.getCachedAssetPath(card.character_attack_card)
            }))
          : character.cards,
      };
    });

    console.log('✅ Character shop data transformed with Map API cached paths');
    return transformedData;
  },

transformPotionShopDataWithCache(levelPreviewData) {
  if (!levelPreviewData || !levelPreviewData.potionShop) return levelPreviewData;

  const transformedData = { ...levelPreviewData };
  
  // Transform potion URLs with cached paths
  transformedData.potionShop = levelPreviewData.potionShop.map(potion => ({
    ...potion,
    potion_url: potion.potion_url ? this.getCachedAssetPath(potion.potion_url) : potion.potion_url
  }));

  return transformedData;
}
};
