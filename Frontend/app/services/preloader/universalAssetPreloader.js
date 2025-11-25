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
    this.maxConcurrentDownloads = 3; 
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
  
  // ✅ Use more of the URL path to ensure uniqueness
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
  }

async downloadSingleAsset(url, category = 'general', onProgress = null, retries = 2) {
  try {
    console.log(`📥 Starting download: ${url}`);
    
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
    
    // ✅ NEW: Add request headers for R2
    const downloadResumable = FileSystem.createDownloadResumable(
      url,
      localPath,
      {
        // ✅ Add headers for R2 and other CDNs
        headers: {
          'User-Agent': 'MicomoGame/1.0',
          'Accept': 'image/*'
        }
      },
      onProgress ? (downloadProgress) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        console.log(`📊 ${category} download progress: ${(progress * 100).toFixed(1)}%`);
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
      
      // ✅ Only preload images to memory cache (not videos)
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

      const assetType = this.isVideoFile(url) ? 'video' : (this.isAudioFile(url) ? 'audio' : 'image');
       console.log(`✅ ${category} ${assetType} downloaded in ${downloadTime}ms (${downloadedFileInfo.size} bytes): ${url.slice(-50)}`);
      return { 
        success: true, 
        localPath: result.uri, 
        downloadTime, 
        url, 
        category,
        fileSize: downloadedFileInfo.size,
        assetType
      };
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
      console.log(`🔄 Retrying download (${retries} retries left): ${url.slice(-50)}`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
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
}

isAudioFile(url) {
  if (!url || typeof url !== 'string') return false;
  const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a'];
  const lowerUrl = url.toLowerCase().split('?')[0];
  return audioExtensions.some(ext => lowerUrl.endsWith(ext));
}


async testR2Download(testUrl) {
  console.log(`🧪 Testing R2 URL: ${testUrl}`);
  
  try {
    const response = await fetch(testUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'MicomoGame/1.0'
      }
    });
    
    console.log(`✅ R2 URL test successful:`, {
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
}

  // ✅ Check if URL is an image file
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
    'cdn.jsdelivr.net'
    ];
    
    // Check if it's from image hosting services
      if (imageHosts.some(host => lowerUrl.includes(host))) {
    console.log(`✅ Image detected by host: ${imageHosts.find(h => lowerUrl.includes(h))}`);
    return true;
  }
  
  console.log(`❌ Not recognized as image`);
  return false;
  }

  extractAudioAssets(levelData) {
    const assets = [];
    if (levelData && Array.isArray(levelData.audioLinks)) {
      levelData.audioLinks.forEach(url => {
        if (url && typeof url === 'string' && this.isAudioFile(url)) {
          assets.push({
            url,
            name: url.split('/').pop().split('?')[0],
            type: 'audio',
            category: 'game_audio'
          });
        }
      });
    }
    console.log(`🎵 Extracted ${assets.length} game audio assets`);
    return assets;
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

  extractGameAnimationAssets(gameState) {
    const assets = [];
    
    if (!gameState) return assets;

    // Character animations
    if (gameState.character || gameState.selectedCharacter) {
      const char = gameState.character || gameState.selectedCharacter;
      
      const charAnimations = [
        { url: char.character_idle, name: 'character_idle', type: 'animation' },
        { url: char.character_run, name: 'character_run', type: 'animation' },
        { url: char.character_hurt, name: 'character_hurt', type: 'animation' },
        { url: char.character_dies, name: 'character_dies', type: 'animation' }
      ];

      // Handle character_attack array
      if (Array.isArray(char.character_attack)) {
        char.character_attack.forEach((attackUrl, index) => {
          if (attackUrl) {
            charAnimations.push({
              url: attackUrl,
              name: `character_attack_${index}`,
              type: 'animation'
            });
          }
        });
      } else if (char.character_attack) {
        charAnimations.push({
          url: char.character_attack,
          name: 'character_attack',
          type: 'animation'
        });
      }

      // Filter out null/undefined URLs and add character context
      charAnimations
        .filter(asset => asset.url && typeof asset.url === 'string')
        .forEach(asset => {
          assets.push({
            ...asset,
            characterName: char.character_name || char.name,
            characterId: char.character_id,
            category: 'game_animations'
          });
        });
    }

    // Enemy animations
    if (gameState.enemy) {
      const enemy = gameState.enemy;
      
      const enemyAnimations = [
        { url: enemy.enemy_idle, name: 'enemy_idle', type: 'animation' },
        { url: enemy.enemy_run, name: 'enemy_run', type: 'animation' },
        { url: enemy.enemy_attack, name: 'enemy_attack', type: 'animation' },
        { url: enemy.enemy_hurt, name: 'enemy_hurt', type: 'animation' },
        { url: enemy.enemy_dies, name: 'enemy_dies', type: 'animation' }
      ];

      // Filter out null/undefined URLs and add enemy context
      enemyAnimations
        .filter(asset => asset.url && typeof asset.url === 'string')
        .forEach(asset => {
          assets.push({
            ...asset,
            enemyName: enemy.enemy_name,
            enemyId: enemy.enemy_id,
            category: 'game_animations'
          });
        });
    }

    // Fight result animations (from submission data)
    if (gameState.submissionResult?.fightResult) {
      const fightChar = gameState.submissionResult.fightResult.character;
      const fightEnemy = gameState.submissionResult.fightResult.enemy;
      
      if (fightChar) {
        const fightCharAnimations = [
          { url: fightChar.character_idle, name: 'fight_character_idle', type: 'animation' },
          { url: fightChar.character_run, name: 'fight_character_run', type: 'animation' },
          { url: fightChar.character_hurt, name: 'fight_character_hurt', type: 'animation' },
          { url: fightChar.character_dies, name: 'fight_character_dies', type: 'animation' }
        ];

        if (Array.isArray(fightChar.character_attack)) {
          fightChar.character_attack.forEach((url, index) => {
            if (url) {
              fightCharAnimations.push({
                url: url,
                name: `fight_character_attack_${index}`,
                type: 'animation'
              });
            }
          });
        } else if (fightChar.character_attack) {
          fightCharAnimations.push({
            url: fightChar.character_attack,
            name: 'fight_character_attack',
            type: 'animation'
          });
        }

        fightCharAnimations
          .filter(asset => asset.url && typeof asset.url === 'string')
          .forEach(asset => {
            assets.push({
              ...asset,
              characterName: fightChar.character_name,
              characterId: fightChar.character_id,
              category: 'game_animations'
            });
          });
      }
      
      if (fightEnemy) {
        const fightEnemyAnimations = [
          { url: fightEnemy.enemy_idle, name: 'fight_enemy_idle', type: 'animation' },
          { url: fightEnemy.enemy_run, name: 'fight_enemy_run', type: 'animation' },
          { url: fightEnemy.enemy_attack, name: 'fight_enemy_attack', type: 'animation' },
          { url: fightEnemy.enemy_hurt, name: 'fight_enemy_hurt', type: 'animation' },
          { url: fightEnemy.enemy_dies, name: 'fight_enemy_dies', type: 'animation' }
        ];

        fightEnemyAnimations
          .filter(asset => asset.url && typeof asset.url === 'string')
          .forEach(asset => {
            assets.push({
              ...asset,
              enemyName: fightEnemy.enemy_name,
              enemyId: fightEnemy.enemy_id,
              category: 'game_animations'
            });
          });
      }
    }

    // Remove duplicates based on URL
    const uniqueAssets = assets.filter((asset, index, self) => 
      index === self.findIndex(a => a.url === asset.url)
    );

    console.log(`📦 Extracted ${uniqueAssets.length} game animation assets`);
    return uniqueAssets;
  }

  extractPotionShopAssets(levelPreviewData) {
  const assets = [];
  
  if (!levelPreviewData || !levelPreviewData.potionShop) return assets;

  levelPreviewData.potionShop.forEach((potion, index) => {
    if (potion.potion_url && typeof potion.potion_url === 'string') {
      assets.push({
        url: potion.potion_url,
        name: `potion_${potion.potion_type}`,
        type: 'image',
        category: 'potion_shop',
        potionId: potion.potion_id,
        potionType: potion.potion_type,
        potionPrice: potion.potion_price,
        description: potion.description
      });
    }
  });

  console.log(`📦 Extracted ${assets.length} potion shop assets`);
  return assets;
  }

  async downloadAudioAssets(levelData, onProgress = null) {
    try {
      console.log('🎵 Starting game audio asset download...');
      const assets = this.extractAudioAssets(levelData);

      if (assets.length === 0) {
        return { success: true, downloaded: 0, total: 0 };
      }
      const startTime = Date.now();
      let successCount = 0;
      const results = [];
      for (let i = 0; i < assets.length; i += this.maxConcurrentDownloads) {
        const batch = assets.slice(i, i + this.maxConcurrentDownloads);
        const batchPromises = batch.map(async (asset) => {
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
              category: 'game_audio'
            });
          }
        });
        await Promise.all(batchPromises);
      }
      const totalTime = Date.now() - startTime;
      console.log(`🎵 Audio asset download completed: ${successCount}/${assets.length} in ${totalTime}ms`);
      return { success: true, downloaded: successCount, total: assets.length, results };
    } catch (error) {
      console.error('❌ Error downloading audio assets:', error);
      return { success: false, error };
    }
  }


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
}

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
}

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







  async downloadGameAnimationAssets(gameState, onProgress = null, onAssetComplete = null) {
    if (this.isDownloading) {
      console.warn('⚠️ Asset downloading already in progress');
      return { success: false, reason: 'already_downloading' };
    }

    this.isDownloading = true;
    
    try {
      console.log('📦 Starting game animation asset download...');
      
      const assets = this.extractGameAnimationAssets(gameState);
      console.log(`📦 Found ${assets.length} game animation assets to download`);

      if (assets.length === 0) {
        console.log('📦 No game animation assets to download');
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
              characterName: asset.characterName,
              enemyName: asset.enemyName,
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
                  characterName: asset.characterName,
                  enemyName: asset.enemyName,
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
              category: 'game_animations'
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
        const cacheKey = 'gameAnimationAssets';
        const cacheInfo = {
          downloadedAt: Date.now(),
          category: 'game_animations',
          assets: Array.from(this.downloadedAssets.entries()).filter(([url, info]) => 
            info.category === 'game_animations'
          ),
          totalAssets: successCount
        };
        await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheInfo));
        console.log(`💾 Saved game animation asset cache info to storage`);
      } catch (error) {
        console.warn('⚠️ Failed to save cache info to AsyncStorage:', error);
      }

      console.log(`📦 Game animation asset download completed: ${successCount}/${assets.length} in ${totalTime}ms`);
      
      return {
        success: true,
        downloaded: successCount,
        total: assets.length,
        totalTime,
        results,
        category: 'game_animations',
        failedAssets: results
          .filter(r => !r.result.success)
          .map(r => r.asset)
      };

    } catch (error) {
      console.error('❌ Error downloading game animation assets:', error);
      this.isDownloading = false;
      throw error;
    }
  }

    async areGameAnimationAssetsCached(gameState) {
    const assets = this.extractGameAnimationAssets(gameState);
    
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
    console.log(`🔍 Game animation assets cache check: ${availableCount}/${assets.length} available`);
    
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

  transformGameStateWithCache(gameState) {
    if (!gameState) return gameState;

    const transformedGameState = { ...gameState };
    
    // Transform character animations
    if (transformedGameState.selectedCharacter) {
      const character = transformedGameState.selectedCharacter;
      
      const animationFields = [
        'character_idle',
        'character_run',
        'character_hurt',
        'character_dies'
      ];
      
      animationFields.forEach(field => {
        if (character[field]) {
          character[field] = this.getCachedAssetPath(character[field]);
        }
      });
      
      // Handle character_attack array
      if (Array.isArray(character.character_attack)) {
        character.character_attack = character.character_attack.map(url => 
          url ? this.getCachedAssetPath(url) : url
        );
      } else if (character.character_attack) {
        character.character_attack = this.getCachedAssetPath(character.character_attack);
      }
    }

    // Transform enemy animations
    if (transformedGameState.enemy) {
      const enemy = transformedGameState.enemy;
      
      const enemyAnimationFields = [
        'enemy_idle',
        'enemy_run',
        'enemy_attack',
        'enemy_hurt',
        'enemy_dies'
      ];
      
      enemyAnimationFields.forEach(field => {
        if (enemy[field]) {
          enemy[field] = this.getCachedAssetPath(enemy[field]);
        }
      });
    }

     if (Array.isArray(transformedGameState.audio)) {
      transformedGameState.audio = transformedGameState.audio.map(url =>
        url ? this.getCachedAssetPath(url) : url
      );
    }
    if (transformedGameState.is_correct_audio) {
      transformedGameState.is_correct_audio = this.getCachedAssetPath(transformedGameState.is_correct_audio);
    }
    if (transformedGameState.enemy_attack_audio) {
      transformedGameState.enemy_attack_audio = this.getCachedAssetPath(transformedGameState.enemy_attack_audio);
    }
    if (transformedGameState.character_attack_audio) {
      transformedGameState.character_attack_audio = this.getCachedAssetPath(transformedGameState.character_attack_audio);
    }

    // Transform fight result animations
    if (transformedGameState.submissionResult?.fightResult) {
      const fightResult = transformedGameState.submissionResult.fightResult;
      
      if (fightResult.character) {
        const fightChar = fightResult.character;
        
        const charFields = [
          'character_idle',
          'character_run',
          'character_hurt',
          'character_dies'
        ];
        
        charFields.forEach(field => {
          if (fightChar[field]) {
            fightChar[field] = this.getCachedAssetPath(fightChar[field]);
          }
        });
        
        // Handle character_attack array
        if (Array.isArray(fightChar.character_attack)) {
          fightChar.character_attack = fightChar.character_attack.map(url => 
            url ? this.getCachedAssetPath(url) : url
          );
        } else if (fightChar.character_attack) {
          fightChar.character_attack = this.getCachedAssetPath(fightChar.character_attack);
        }
      }
      
      if (fightResult.enemy) {
        const fightEnemy = fightResult.enemy;
        
        const enemyFields = [
          'enemy_idle',
          'enemy_run',
          'enemy_attack',
          'enemy_hurt',
          'enemy_dies'
        ];
        
        enemyFields.forEach(field => {
          if (fightEnemy[field]) {
            fightEnemy[field] = this.getCachedAssetPath(fightEnemy[field]);
          }
        });
      }
    }

    return transformedGameState;
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
  }

  //video

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
  }
  
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
}

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
}

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
}

// ✅ Download character select background video specifically
async downloadCharacterSelectVideo(backgroundVideoUrl, onProgress = null, onAssetComplete = null) {
  const videoAsset = {
    url: backgroundVideoUrl,
    name: 'character_select_background',
    type: 'video',
    category: 'ui_videos',
    priority: 'high'
  };

  return await this.downloadVideoAssets([videoAsset], onProgress, onAssetComplete);
}

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
}

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