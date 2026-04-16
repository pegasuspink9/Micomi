import * as FileSystem from 'expo-file-system/legacy';

export const mapMethods = {
extractAllAssetsFromMapData(mapLevelData) {
    const assets = [];
    const addedUrls = new Set(); 

    const addAsset = (url, name, type, category) => {
      if (url && 
          typeof url === 'string' && 
          !addedUrls.has(url) &&
          !url.startsWith('file://') &&
          !url.startsWith('/data/') &&
          (url.startsWith('http://') || url.startsWith('https://') || url.includes('.'))) {
        addedUrls.add(url);
        assets.push({ url, name, type, category });
      }
    };

    if (!mapLevelData) return assets;

    const extractLevelAssets = (level, levelIndex = 0) => {
      if (!level) return;

      

      // Enemy Assets
      if (level.enemy) {
        const enemy = level.enemy;
        addAsset(enemy.enemy_idle, `${enemy.enemy_name}_idle`, 'animation', 'game_animations');
        addAsset(enemy.enemy_run, `${enemy.enemy_name}_run`, 'animation', 'game_animations');
        addAsset(enemy.enemy_attack, `${enemy.enemy_name}_attack`, 'animation', 'game_animations');
        addAsset(enemy.enemy_hurt, `${enemy.enemy_name}_hurt`, 'animation', 'game_animations');
        addAsset(enemy.enemy_dies, `${enemy.enemy_name}_dies`, 'animation', 'game_animations');
        addAsset(enemy.enemy_avatar, `${enemy.enemy_name}_avatar`, 'image', 'game_images');

         if (enemy.special_skill?.special_skill_image) {
          addAsset(enemy.special_skill.special_skill_image, `${enemy.enemy_name}_special_skill`, 'image', 'game_images');
        }

        if (enemy.enemy_attack_overlay) {
          addAsset(enemy.enemy_attack_overlay, `${enemy.enemy_name}_attack_overlay`, 'image', 'game_visuals');
        }
        
      }

      // Character Assets
      if (level.character) {
        const char = level.character;
        addAsset(char.character_idle, `${char.character_name}_idle`, 'animation', 'game_animations');
        addAsset(char.character_run, `${char.character_name}_run`, 'animation', 'game_animations');
        addAsset(char.character_hurt, `${char.character_name}_hurt`, 'animation', 'game_animations');
        addAsset(char.character_dies, `${char.character_name}_dies`, 'animation', 'game_animations');
        addAsset(char.character_avatar, `${char.character_name}_avatar`, 'image', 'game_images');
        if (Array.isArray(char.character_attack)) {
          char.character_attack.forEach((url, i) => addAsset(url, `${char.character_name}_attack_${i}`, 'animation', 'game_animations'));
        }

        if (char.special_skill?.special_skill_image) {
          addAsset(char.special_skill.special_skill_image, `${char.character_name}_special_skill`, 'image', 'game_images');
        }

        if (char.character_attack_overlay) {
          addAsset(char.character_attack_overlay, `${char.character_name}_attack_overlay`, 'image', 'game_visuals');
        }

        if (Array.isArray(char.cards)) {
          char.cards.forEach((card, i) => {
            if (card.character_attack_card) {
              addAsset(card.character_attack_card, `${char.character_name}_card_${i}`, 'image', 'game_visuals');
            }
          });
        }
      }

      // Card Assets
      if (level.card?.character_attack_card) {
        addAsset(level.card.character_attack_card, `level_${levelIndex}_attack_card`, 'image', 'game_visuals');
      }

      // ADDED: Potion Effect & Audio (from each level's challenges/potions)
      if (level.use_potion_effect) {
        addAsset(level.use_potion_effect, `level_${levelIndex}_potion_effect`, 'image', 'game_visuals');
      }
      if (level.use_potion_audio) {
        addAsset(level.use_potion_audio, `level_${levelIndex}_potion_audio`, 'audio', 'game_audio');
      }

      // Background Assets
      if (Array.isArray(level.combat_background)) {
        level.combat_background.forEach((url, i) => addAsset(url, `level_${levelIndex}_combat_bg_${i}`, 'image', 'game_visuals'));
      }
      addAsset(level.versus_background, `level_${levelIndex}_versus_background`, 'image', 'game_visuals');

      // Audio Assets
      addAsset(level.versus_audio, `level_${levelIndex}_versus_audio`, 'audio', 'game_audio');
      addAsset(level.gameplay_audio, `level_${levelIndex}_gameplay_audio`, 'audio', 'game_audio');
      if (Array.isArray(level.audioLinks)) {
        level.audioLinks.forEach((url, i) => addAsset(url, `level_${levelIndex}_audio_link_${i}`, 'audio', 'game_audio'));
      }
      
      addAsset(level.enemy_attack_audio, `level_${levelIndex}_enemy_attack_audio`, 'audio', 'game_audio');
      addAsset(level.character_attack_audio, `level_${levelIndex}_character_attack_audio`, 'audio', 'game_audio');
      addAsset(level.character_idle_audio, `level_${levelIndex}_character_idle_audio`, 'audio', 'game_audio');
      addAsset(level.enemy_idle_audio, `level_${levelIndex}_enemy_idle_audio`, 'audio', 'game_audio');
      addAsset(level.enemy_hurt_audio, `level_${levelIndex}_enemy_hurt_audio`, 'audio', 'game_audio');
      addAsset(level.character_hurt_audio, `level_${levelIndex}_character_hurt_audio`, 'audio', 'game_audio');
      addAsset(level.is_correct_audio, `level_${levelIndex}_is_correct_audio`, 'audio', 'game_audio');
      addAsset(level.death_audio, `level_${levelIndex}_death_audio`, 'audio', 'game_audio');
      addAsset(level.is_victory_audio, `level_${levelIndex}_is_victory_audio`, 'audio', 'game_audio');

      if (Array.isArray(level.audio)) {
        level.audio.forEach((url, i) => addAsset(url, `level_${levelIndex}_game_audio_${i}`, 'audio', 'game_audio'));
      }

      addAsset(level.is_victory_image, `level_${levelIndex}_is_victory_image`, 'image', 'game_images');

       if (level.lessons && Array.isArray(level.lessons.lessons)) {
        level.lessons.lessons.forEach((lesson, i) => {
          if (lesson.page_url) {
            addAsset(lesson.page_url, `level_${levelIndex}_lesson_${i}_page`, 'image', 'game_images');
          }
        });
      }


      // All Images from imagesUrls
      if (Array.isArray(level.imagesUrls)) {
        level.imagesUrls.forEach((url, i) => {
          const type = this.isAudioFile(url) ? 'audio' : (this.isVideoFile(url) ? 'video' : 'image');
          const category = type === 'audio' ? 'game_audio' : (type === 'video' ? 'game_videos' : 'game_images');
          addAsset(url, `level_${levelIndex}_image_asset_${i}`, type, category);
        });
      }
    };

    // UPDATED: If mapLevelData has a 'levels' array (from map API), extract from all levels
    if (Array.isArray(mapLevelData.levels)) {
      mapLevelData.levels.forEach((level, index) => {
        extractLevelAssets(level, index);
      });
    } else {
      // Fallback: treat mapLevelData as a single level (for enterLevel response)
      extractLevelAssets(mapLevelData, 0);
    }

    const staticShopAssets = this.getStaticPotionShopAssets();
    staticShopAssets.forEach(asset => addAsset(asset.url, asset.name, asset.type, asset.category));


    


    console.log(`📦 Extracted ${assets.length} total assets from map data.`);
    return assets;
  },

extractLevelModalAssets(levelPreviewData) {
    const assets = [];
    const addedUrls = new Set();

    const addAsset = (url, name, type, category) => {
      if (url && typeof url === 'string' && !addedUrls.has(url)) {
        addedUrls.add(url);
        assets.push({ url, name, type, category });
      }
    };

    if (!levelPreviewData) return assets;

    // Enemy assets
    if (levelPreviewData.enemy) {
      addAsset(levelPreviewData.enemy.enemy_avatar, 'enemy_avatar', 'image', 'level_modal');
      addAsset(levelPreviewData.enemy.enemy_idle, 'enemy_idle', 'image', 'level_modal');
    }

    // Character assets
    if (levelPreviewData.character) {
      addAsset(levelPreviewData.character.character_avatar, 'character_avatar', 'image', 'level_modal');
    }

    // Potion shop assets
    if (Array.isArray(levelPreviewData.potionShop)) {
      levelPreviewData.potionShop.forEach((potion, i) => {
        addAsset(potion.potion_url, `potion_${potion.potion_type || i}`, 'image', 'level_modal');
      });
    }

    const staticAssets = [
      { url: 'https://github.com/user-attachments/assets/cdbba724-147a-41fa-89c5-26e7252c66cd', name: 'coin_icon' },
      { url: 'https://github.com/user-attachments/assets/4e1d0813-aa7d-4dcf-8333-a1ff2cd0971e', name: 'energy_icon' },
      { url: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1759901895/labBackground_otqad4.jpg', name: 'modal_background' },
    ];

    staticAssets.forEach(asset => {
      addAsset(asset.url, asset.name, 'image', 'level_modal');
    });

    console.log(`📦 Extracted ${assets.length} level modal assets`);
    return assets;
  },

async downloadAllMapAssets(mapLevelData, onProgress = null, onAssetComplete = null) {
    // Allow concurrent downloads for map preloading
    const wasDownloading = this.isDownloading;
    this.isDownloading = true;

    try {
      console.log('🗺️ Starting comprehensive map asset download...');
      const assets = this.extractAllAssetsFromMapData(mapLevelData);

      if (assets.length === 0) {
        console.log('🗺️ No assets to download from map data.');
        this.isDownloading = wasDownloading;
        return { success: true, downloaded: 0, total: 0 };
      }

      const startTime = Date.now();
      let successCount = 0;
      const results = [];
      const downloadConcurrency = this.getAdaptiveConcurrency(assets.length, 'map_assets');

      for (let i = 0; i < assets.length; i += downloadConcurrency) {
        const batch = assets.slice(i, i + downloadConcurrency);

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
              totalAssets: assets.length,
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
                  totalAssets: assets.length,
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
              total: assets.length,
              progress: results.length / assets.length,
              successCount,
              currentAsset: asset,
              category: 'map_assets',
            });
          }
          return assetResult;
        });

        await Promise.all(batchPromises);
      }

      const totalTime = Date.now() - startTime;
      this.isDownloading = wasDownloading;

      console.log(`🗺️ Map asset download completed: ${successCount}/${assets.length} in ${totalTime}ms`);

      return {
        success: successCount === assets.length,
        downloaded: successCount,
        total: assets.length,
        totalTime,
        results,
        category: 'map_assets',
        failedAssets: results.filter((r) => !r.result.success).map((r) => r.asset),
      };
    } catch (error) {
      console.error('❌ Error downloading map assets:', error);
      this.isDownloading = wasDownloading;
      throw error;
    }
  },

async areMapAssetsCached(mapLevelData, onProgress = null) {
    const assets = this.extractAllAssetsFromMapData(mapLevelData);

    if (assets.length === 0) {
      return { cached: true, total: 0, available: 0, missing: 0, missingAssets: [] };
    }

    let availableCount = 0;
    const missingAssets = [];
    const totalCount = assets.length;

    for (let i = 0; i < totalCount; i++) {
      const asset = assets[i];
      let isAvailable = false;

      //  FIX: Skip file:// URLs - they're already local
      if (asset.url.startsWith('file://') || asset.url.startsWith('/data/')) {
        isAvailable = true;
        availableCount++;
        if (onProgress) {
          onProgress({ available: availableCount, total: totalCount });
        }
        continue;
      }

      // Step 1: Check in-memory cache first (fast)
      const assetInfo = this.downloadedAssets.get(asset.url);
       
      if (assetInfo && assetInfo.localPath) {
        try {
          const validation = await this.validateCachedFile(assetInfo.localPath, asset.url, assetInfo.fileSize || 0);
          if (validation.valid) {
            isAvailable = true;
          } else {
            this.downloadedAssets.delete(asset.url);
          }
        } catch (e) {
          // File check failed, continue to disk check
        }
      }
      
      // Step 2: If not in memory, check if file exists on disk anyway
      if (!isAvailable) {
        const localPath = this.getLocalFilePath(asset.url, asset.category);
        try {
          const validation = await this.validateCachedFile(localPath, asset.url);
          if (validation.valid) {
            // Found on disk - add to memory cache
            this.downloadedAssets.set(asset.url, {
              localPath,
              category: asset.category,
              url: asset.url,
              downloadedAt: Date.now(),
              fileSize: validation.size
            });
            isAvailable = true;
          }
        } catch (e) {
          // File doesn't exist
        }
      }

      if (isAvailable) {
        availableCount++;
      } else {
        missingAssets.push(asset);
      }

      if (onProgress && (i % 5 === 0 || i === totalCount - 1)) {
        onProgress({ available: availableCount, total: totalCount });
      }
    }

    const cached = availableCount === assets.length;
    
    console.log(`🔍 Asset cache check: ${availableCount}/${assets.length} available`, {
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

extractMapThemeAssets(mapThemes) {
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

    if (!mapThemes) return assets;

    // Iterate through all map themes (HTML, CSS, JavaScript, Computer)
    Object.entries(mapThemes).forEach(([themeName, theme]) => {
      const prefix = themeName.toLowerCase();

      // --- Backgrounds ---
      if (theme.backgrounds) {
        addAsset(theme.backgrounds.topBackground, `${prefix}_top_background`, 'image', 'map_theme_assets');
        addAsset(theme.backgrounds.repeatingBackground, `${prefix}_repeating_background`, 'image', 'map_theme_assets');
        // Skip lottie backgrounds - they're loaded differently
      }

      // --- Buttons ---
      if (theme.buttons) {
        addAsset(theme.buttons.unlockedButton, `${prefix}_unlocked_button`, 'image', 'map_theme_assets');
        addAsset(theme.buttons.lockedButton, `${prefix}_locked_button`, 'image', 'map_theme_assets');
        addAsset(theme.buttons.buttonBackground, `${prefix}_button_background`, 'image', 'map_theme_assets');
      }

      // --- Stones ---
      if (theme.stones) {
        addAsset(theme.stones.stoneImage, `${prefix}_stone`, 'image', 'map_theme_assets');
      }

      // --- Floating Comments ---
      if (theme.floatingComment) {
        addAsset(theme.floatingComment.commentBackground, `${prefix}_comment_background`, 'image', 'map_theme_assets');
        addAsset(theme.floatingComment.signageBackground, `${prefix}_signage_background`, 'image', 'map_theme_assets');
      }

      // --- Icons ---
      if (theme.icons) {
        addAsset(theme.icons.enemyButton, `${prefix}_enemy_icon`, 'image', 'map_theme_assets');
        addAsset(theme.icons.micomiButton, `${prefix}_micomi_icon`, 'image', 'map_theme_assets');
        addAsset(theme.icons.shopButton, `${prefix}_shop_icon`, 'image', 'map_theme_assets');
        addAsset(theme.icons.bossButton, `${prefix}_boss_icon`, 'image', 'map_theme_assets');
      }
    });

    console.log(`📦 Extracted ${assets.length} map theme assets from static mapData`);
    return assets;
  },

async downloadMapThemeAssets(mapThemes, onProgress = null, onAssetComplete = null) {
    const wasDownloading = this.isDownloading;
    this.isDownloading = true;

    try {
      console.log('🗺️ Starting map theme assets download...');
      const assets = this.extractMapThemeAssets(mapThemes);

      if (assets.length === 0) {
        console.log('🗺️ No map theme assets to download.');
        this.isDownloading = wasDownloading;
        return { success: true, downloaded: 0, total: 0 };
      }

      const startTime = Date.now();
      let successCount = 0;
      const results = [];
      const downloadConcurrency = this.getAdaptiveConcurrency(assets.length, 'map_theme_assets');

      for (let i = 0; i < assets.length; i += downloadConcurrency) {
        const batch = assets.slice(i, i + downloadConcurrency);

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
              totalAssets: assets.length,
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
                  totalAssets: assets.length,
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
              total: assets.length,
              progress: results.length / assets.length,
              successCount,
              currentAsset: asset,
              category: 'map_theme_assets',
            });
          }
          return assetResult;
        });

        await Promise.all(batchPromises);
      }

      const totalTime = Date.now() - startTime;
      this.isDownloading = wasDownloading;

      console.log(`🗺️ Map theme assets download completed: ${successCount}/${assets.length} in ${totalTime}ms`);

      return {
        success: true,
        downloaded: successCount,
        total: assets.length,
        totalTime,
        results,
        category: 'map_theme_assets',
        failedAssets: results.filter((r) => !r.result.success).map((r) => r.asset),
      };
    } catch (error) {
      console.error('❌ Error downloading map theme assets:', error);
      this.isDownloading = wasDownloading;
      throw error;
    }
  },

async areMapThemeAssetsCached(mapThemes, onProgress = null) {
    const assets = this.extractMapThemeAssets(mapThemes);

    if (assets.length === 0) {
      return { cached: true, total: 0, available: 0, missing: 0, missingAssets: [] };
    }

    let availableCount = 0;
    const missingAssets = [];
    const totalCount = assets.length;

    for (let i = 0; i < totalCount; i++) {
      const asset = assets[i];
      let isAvailable = false;

      // Check memory cache
      const assetInfo = this.downloadedAssets.get(asset.url);
      if (assetInfo && assetInfo.localPath) {
        try {
          const validation = await this.validateCachedFile(assetInfo.localPath, asset.url, assetInfo.fileSize || 0);
          if (validation.valid) {
            isAvailable = true;
          } else {
            this.downloadedAssets.delete(asset.url);
          }
        } catch (e) {
          // File check failed
        }
      }

      // Check disk if not in memory
      if (!isAvailable) {
        const localPath = this.getLocalFilePath(asset.url, asset.category);
        try {
          const validation = await this.validateCachedFile(localPath, asset.url);
          if (validation.valid) {
            this.downloadedAssets.set(asset.url, {
              localPath,
              category: asset.category,
              url: asset.url,
              downloadedAt: Date.now(),
              fileSize: validation.size
            });
            isAvailable = true;
          }
        } catch (e) {
          // File doesn't exist
        }
      }

      if (isAvailable) {
        availableCount++;
      } else {
        missingAssets.push(asset);
      }

      if (onProgress && (i % 5 === 0 || i === totalCount - 1)) {
        onProgress({ available: availableCount, total: totalCount });
      }
    }

    const cached = availableCount === assets.length;

    console.log(`🔍 Map theme assets cache check: ${availableCount}/${assets.length} available`, {
      cached,
      missing: missingAssets.length,
    });

    return {
      cached,
      total: totalCount,
      available: availableCount,
      missing: totalCount - availableCount,
      missingAssets
    };
  },

transformMapThemesWithCache(mapThemes) {
    if (!mapThemes) return mapThemes;

    const transformedThemes = {};

    Object.entries(mapThemes).forEach(([themeName, theme]) => {
      transformedThemes[themeName] = {
        ...theme,
        backgrounds: theme.backgrounds ? {
          ...theme.backgrounds,
          topBackground: this.getCachedAssetPath(theme.backgrounds.topBackground),
          repeatingBackground: this.getCachedAssetPath(theme.backgrounds.repeatingBackground),
          // Keep lottie as-is (loaded differently)
          lottieBackground: theme.backgrounds.lottieBackground,
        } : theme.backgrounds,
        buttons: theme.buttons ? {
          ...theme.buttons,
          unlockedButton: this.getCachedAssetPath(theme.buttons.unlockedButton),
          lockedButton: this.getCachedAssetPath(theme.buttons.lockedButton),
          buttonBackground: this.getCachedAssetPath(theme.buttons.buttonBackground),
        } : theme.buttons,
        stones: theme.stones ? {
          ...theme.stones,
          stoneImage: this.getCachedAssetPath(theme.stones.stoneImage),
        } : theme.stones,
        floatingComment: theme.floatingComment ? {
          ...theme.floatingComment,
          commentBackground: this.getCachedAssetPath(theme.floatingComment.commentBackground),
          signageBackground: this.getCachedAssetPath(theme.floatingComment.signageBackground),
        } : theme.floatingComment,
        icons: theme.icons ? {
          ...theme.icons,
          enemyButton: this.getCachedAssetPath(theme.icons.enemyButton),
          micomiButton: this.getCachedAssetPath(theme.icons.micomiButton),
          shopButton: this.getCachedAssetPath(theme.icons.shopButton),
          bossButton: this.getCachedAssetPath(theme.icons.bossButton),
        } : theme.icons,
        colors: theme.colors,
      };
    });

    console.log('✅ Map themes transformed with cached paths');
    return transformedThemes;
  },

transformLevelPreviewWithCache(previewData) {
    if (!previewData) return previewData;

    const transformed = { ...previewData };

    // Transform enemy avatar
    if (transformed.enemy?.enemy_avatar) {
      const cachedPath = this.getCachedAssetPath(transformed.enemy.enemy_avatar);
      if (cachedPath !== transformed.enemy.enemy_avatar) {
        console.log(`📦 Using cached enemy avatar for preview`);
        transformed.enemy = {
          ...transformed.enemy,
          enemy_avatar: cachedPath
        };
      }
    }

    // Transform character avatar
    if (transformed.character?.character_avatar) {
      const cachedPath = this.getCachedAssetPath(transformed.character.character_avatar);
      if (cachedPath !== transformed.character.character_avatar) {
        console.log(`📦 Using cached character avatar for preview`);
        transformed.character = {
          ...transformed.character,
          character_avatar: cachedPath
        };
      }
    }

    return transformed;
  },

async areLevelPreviewAssetsCached(previewData) {
    if (!previewData) return { cached: true, total: 0, available: 0 };

    const avatarUrls = [];
    
    if (previewData.enemy?.enemy_avatar) {
      avatarUrls.push(previewData.enemy.enemy_avatar);
    }
    if (previewData.character?.character_avatar) {
      avatarUrls.push(previewData.character.character_avatar);
    }

    if (avatarUrls.length === 0) {
      return { cached: true, total: 0, available: 0 };
    }

    let availableCount = 0;
    for (const url of avatarUrls) {
      const assetInfo = this.downloadedAssets.get(url);
      if (assetInfo && assetInfo.localPath) {
        const fileInfo = await FileSystem.getInfoAsync(assetInfo.localPath);
        if (fileInfo.exists && fileInfo.size > 0) {
          availableCount++;
        }
      } else {
        // Check disk directly
        const localPath = this.getLocalFilePath(url, 'game_images');
        const fileInfo = await FileSystem.getInfoAsync(localPath);
        if (fileInfo.exists && fileInfo.size > 0) {
          // Add to memory cache
          this.downloadedAssets.set(url, {
            localPath,
            category: 'game_images',
            url,
            downloadedAt: Date.now()
          });
          availableCount++;
        }
      }
    }

    const cached = availableCount === avatarUrls.length;
    console.log(`🔍 Level preview avatars cache check: ${availableCount}/${avatarUrls.length} available`);

    return {
      cached,
      total: avatarUrls.length,
      available: availableCount,
      missing: avatarUrls.length - availableCount
    };
  }
};
