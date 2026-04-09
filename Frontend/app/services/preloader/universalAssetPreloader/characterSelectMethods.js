import * as FileSystem from 'expo-file-system/legacy';

export const characterSelectMethods = {
extractAllCharacterSelectAssets(charactersData) {
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

    // --- Static UI Assets from CharacterData.js ---
    const staticUIAssets = [
      { url: 'https://github.com/user-attachments/assets/a913b8b6-2df5-4f08-b746-eb5a277f955a', name: 'bottom_bar', type: 'image' },
      { url: 'https://github.com/user-attachments/assets/cdbba724-147a-41fa-89c5-26e7252c66cd', name: 'coin_icon', type: 'image' },
      { url: 'https://github.com/user-attachments/assets/82a87b3d-bc5c-4bb8-8d3e-46017ffcf1f4', name: 'health_icon', type: 'image' },
      { url: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1760064111/Untitled_design_3_ghewno.png', name: 'hero_box_border', type: 'image' },
    ];

    staticUIAssets.forEach(asset => {
      addAsset(asset.url, asset.name, asset.type, 'character_select_ui');
    });

    // --- Static Role Icons from characterService.js ---
    const roleIcons = [
      { url: 'https://micomi-assets.me/Icons%20Shop/473984818-d95f6009-ac83-4c34-a486-96b332bf39e4.png', name: 'assassin_role_icon' },
      { url: 'https://micomi-assets.me/Icons%20Shop/473993721-36859900-5dc8-45b3-91e6-fb3820f215e1.png', name: 'tank_role_icon' },
      { url: 'https://micomi-assets.me/Icons%20Shop/473975865-927e2303-ecb2-4009-b64e-1160758f3c1b.png', name: 'mage_role_icon' },
      { url: 'https://micomi-assets.me/Icons%20Shop/473999709-38e408df-acdc-4d46-abcc-29bb6f28ab59.png', name: 'marksman_role_icon' },
    ];

    roleIcons.forEach(icon => {
      addAsset(icon.url, icon.name, 'image', 'character_select_ui');
    });

    // --- Static Damage Icons from characterService.js ---
    const damageIcons = [
      { url: 'https://micomi-assets.me/Icons%20Shop/fighterIcon.png', name: 'fighter_damage_icon' },
      { url: 'https://micomi-assets.me/Icons%20Shop/tankIcon.png', name: 'tank_damage_icon' },
      { url: 'https://micomi-assets.me/Icons%20Shop/mageIcon.png', name: 'mage_damage_icon' },
      { url: 'https://micomi-assets.me/Icons%20Shop/marksmanIcon.png', name: 'marksman_damage_icon' },
    ];

    damageIcons.forEach(icon => {
      addAsset(icon.url, icon.name, 'image', 'character_select_ui');
    });

    // --- Video Asset ---
    addAsset(
      'https://micomi-assets.me/Hero%20Selection%20Components/Background.mp4',
      'character_select_background_video',
      'video',
      'ui_videos'
    );

    // --- Lottie Asset ---
    addAsset(
      'https://lottie.host/b3ebb5e0-3eda-4aad-82a3-a7428cbe0aa5/mvEeQ5rDi1.lottie',
      'character_background_lottie',
      'animation',
      'character_select_ui'
    );

    // --- Character-specific assets from API data ---
    if (charactersData) {
      Object.values(charactersData).forEach(character => {
        const charName = character.character_name || 'unknown';
        
        // Character display images
        addAsset(character.character_image_display, `${charName}_display`, 'image', 'characters');
        addAsset(character.character_image_select, `${charName}_select`, 'image', 'characters');
        addAsset(character.character_avatar, `${charName}_avatar`, 'image', 'game_images');
        addAsset(character.avatar_image, `${charName}_avatar_image`, 'image', 'game_images');
        
        // Character lottie
        addAsset(character.character_hero_lottie || character.hero_lottie, `${charName}_lottie`, 'animation', 'characters');
        
        // Animation assets (these are shared with gameplay, should already be cached from Map API)
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

        if (Array.isArray(character.cards)) {
          character.cards.forEach((card, i) => {
            if (card.character_attack_card) {
              addAsset(card.character_attack_card, `${charName}_card_${i}`, 'image', 'game_visuals');
            }
          });
        }

        // Role and damage icons (already added above as static, but character-specific ones)
        addAsset(character.roleIcon, `${charName}_role_icon`, 'image', 'character_select_ui');
        addAsset(character.damageIcon, `${charName}_damage_icon`, 'image', 'character_select_ui');

        if (character.special_skill?.special_skill_image) {
          addAsset(character.special_skill.special_skill_image, `${charName}_special_skill`, 'image', 'game_images');
        }
      });
    }

    console.log(`📦 Extracted ${assets.length} total character select assets (static + API)`);
    return assets;
  },

getStaticCharacterSelectAssets() {
    const assets = [];
    const addedUrls = new Set();

    const addAsset = (url, name, type, category) => {
      if (url && typeof url === 'string' && !addedUrls.has(url)) {
        addedUrls.add(url);
        assets.push({ url, name, type, category });
      }
    };

    // Static UI Assets
    addAsset('https://github.com/user-attachments/assets/a913b8b6-2df5-4f08-b746-eb5a277f955a', 'bottom_bar', 'image', 'character_select_ui');
    addAsset('https://github.com/user-attachments/assets/cdbba724-147a-41fa-89c5-26e7252c66cd', 'coin_icon', 'image', 'character_select_ui');
    addAsset('https://github.com/user-attachments/assets/82a87b3d-bc5c-4bb8-8d3e-46017ffcf1f4', 'health_icon', 'image', 'character_select_ui');
    addAsset('https://res.cloudinary.com/dm8i9u1pk/image/upload/v1760064111/Untitled_design_3_ghewno.png', 'hero_box_border', 'image', 'character_select_ui');

    // Role Icons
    addAsset('https://micomi-assets.me/Icons%20Shop/473984818-d95f6009-ac83-4c34-a486-96b332bf39e4.png', 'assassin_role_icon', 'image', 'character_select_ui');
    addAsset('https://micomi-assets.me/Icons%20Shop/473993721-36859900-5dc8-45b3-91e6-fb3820f215e1.png', 'tank_role_icon', 'image', 'character_select_ui');
    addAsset('https://micomi-assets.me/Icons%20Shop/473975865-927e2303-ecb2-4009-b64e-1160758f3c1b.png', 'mage_role_icon', 'image', 'character_select_ui');
    addAsset('https://micomi-assets.me/Icons%20Shop/473999709-38e408df-acdc-4d46-abcc-29bb6f28ab59.png', 'marksman_role_icon', 'image', 'character_select_ui');

    // Damage Icons
    addAsset('https://micomi-assets.me/Icons%20Shop/fighterIcon.png', 'fighter_damage_icon', 'image', 'character_select_ui');
    addAsset('https://micomi-assets.me/Icons%20Shop/tankIcon.png', 'tank_damage_icon', 'image', 'character_select_ui');
    addAsset('https://micomi-assets.me/Icons%20Shop/mageIcon.png', 'mage_damage_icon', 'image', 'character_select_ui');
    addAsset('https://micomi-assets.me/Icons%20Shop/marksmanIcon.png', 'marksman_damage_icon', 'image', 'character_select_ui');

    // Video
    addAsset('https://micomi-assets.me/Hero%20Selection%20Components/Background.mp4', 'character_select_background_video', 'video', 'ui_videos');

    // Lottie
    addAsset('https://lottie.host/b3ebb5e0-3eda-4aad-82a3-a7428cbe0aa5/mvEeQ5rDi1.lottie', 'character_background_lottie', 'animation', 'character_select_ui');

    console.log(`📦 Static character select assets: ${assets.length}`);
    return assets;
  },

async downloadStaticCharacterSelectAssets(onProgress = null, onAssetComplete = null) {
    const wasDownloading = this.isDownloading;
    this.isDownloading = true;

    try {
      console.log('🎨 Starting static character select assets download...');
      const assets = this.getStaticCharacterSelectAssets();

      if (assets.length === 0) {
        console.log('✅ No static character select assets to download');
        return { success: true, downloaded: 0, total: 0 };
      }

      // Separate video assets from other assets
      const videoAssets = assets.filter(a => a.type === 'video');
      const otherAssets = assets.filter(a => a.type !== 'video');

      const startTime = Date.now();
      let successCount = 0;
      const results = [];
      const downloadConcurrency = this.getAdaptiveConcurrency(otherAssets.length, 'character_select_ui');

      // Download non-video assets first
      for (let i = 0; i < otherAssets.length; i += downloadConcurrency) {
        const batch = otherAssets.slice(i, i + downloadConcurrency);

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

          const result = await this.downloadSingleAsset(asset.url, asset.category);

          if (result.success) {
            successCount++;
          }

          results.push({ asset, result });

          if (onProgress) {
            onProgress({
              loaded: results.length,
              total: assets.length,
              progress: results.length / assets.length,
              successCount,
              currentAsset: asset,
            });
          }

          return { asset, result };
        });

        await Promise.all(batchPromises);
      }

      // Download video assets
      for (const videoAsset of videoAssets) {
        if (onAssetComplete) {
          onAssetComplete({
            url: videoAsset.url,
            name: videoAsset.name,
            type: 'video',
            category: videoAsset.category,
            progress: 0,
            currentIndex: results.length,
            totalAssets: assets.length,
          });
        }

        const result = await this.downloadSingleAsset(videoAsset.url, videoAsset.category);

        if (result.success) {
          successCount++;
        }

        results.push({ asset: videoAsset, result });

        if (onProgress) {
          onProgress({
            loaded: results.length,
            total: assets.length,
            progress: results.length / assets.length,
            successCount,
            currentAsset: videoAsset,
          });
        }
      }

      const totalTime = Date.now() - startTime;
      this.isDownloading = wasDownloading;

      console.log(`🎨 Static character select assets download completed: ${successCount}/${assets.length} in ${totalTime}ms`);

      return {
        success: successCount === assets.length,
        downloaded: successCount,
        total: assets.length,
        totalTime,
        results,
        failedAssets: results.filter(r => !r.result.success).map(r => r.asset),
      };
    } catch (error) {
      console.error('❌ Error downloading static character select assets:', error);
      this.isDownloading = wasDownloading;
      throw error;
    }
  },

async areStaticCharacterSelectAssetsCached(onProgress = null) {
    const assets = this.getStaticCharacterSelectAssets();

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
          // File not found
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

    console.log(`🔍 Static character select assets cache check: ${availableCount}/${assets.length} available`, {
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
  }
};
