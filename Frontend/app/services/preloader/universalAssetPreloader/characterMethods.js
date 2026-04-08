import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const characterMethods = {
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
        { url: character.avatar_image, name: 'avatar_image', type: 'image' },
        { url: character.special_skill?.special_skill_image, name: 'special_skill_icon', type: 'image' }
      ];

      if (Array.isArray(character.cards)) {
        character.cards.forEach((card, index) => {
          if (card.character_attack_card) {
            charAssets.push({
              url: card.character_attack_card,
              name: `card_${index}`,
              type: 'image'
            });
          }
        });
      }

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
  },

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
  },

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
  },

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
};
