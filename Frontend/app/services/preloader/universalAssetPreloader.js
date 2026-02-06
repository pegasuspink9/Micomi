import { Image as RNImage } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
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

  //  Create cache directory structure
  async ensureCacheDirectory(category = '') {
    const targetDir = category ? `${this.cacheDirectory}${category}/` : this.cacheDirectory;
    const dirInfo = await FileSystem.getInfoAsync(targetDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true });
      console.log(`📁 Created cache directory: ${category || 'root'}`);
    }
    return targetDir;
  }

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
  }

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
  }



  //  Generate local file path for asset
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
  }

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
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (fileInfo.exists && fileInfo.size > 0) {
        console.log(`📦 Asset already cached: ${url.slice(-50)}`);
        this.downloadedAssets.set(url, {
          localPath,
          category,
          url,
          downloadedAt: Date.now(),
          fileSize: fileInfo.size
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
        this.downloadedAssets.set(url, {
          localPath: result.uri.replace('file://', ''),
          category,
          url,
          downloadedAt: Date.now(),
          downloadTime,
          fileSize: result.headers?.['content-length'] || 0
        });
        
        console.log(` Asset downloaded in ${downloadTime}ms: ${url.slice(-50)}`);
        return { success: true, localPath: result.uri.replace('file://', ''), downloadTime, url, category };
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
        await new Promise(resolve => setTimeout(resolve, 1000));
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
}

  //  Check if URL is an image file
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
  }

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
      { url: 'https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Icons%20Shop/fighterIcon.png', name: 'fighter_damage_icon' },
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

        // Role and damage icons (already added above as static, but character-specific ones)
        addAsset(character.roleIcon, `${charName}_role_icon`, 'image', 'character_select_ui');
        addAsset(character.damageIcon, `${charName}_damage_icon`, 'image', 'character_select_ui');
      });
    }

    console.log(`📦 Extracted ${assets.length} total character select assets (static + API)`);
    return assets;
  }

  getStaticSoundAssets() {
  const assets = [];
  const addedUrls = new Set();

  const addAsset = (url, name, type, category) => {
    if (url && typeof url === 'string' && !addedUrls.has(url)) {
      addedUrls.add(url);
      assets.push({ url, name, type, category });
    }
  };

  // Static UI Sounds
  addAsset('https://micomi-assets.me/Sounds/Final/Tap.wav', 'button_tap', 'audio', 'static_sounds');
  addAsset('https://micomi-assets.me/Sounds/Final/Tap2.wav', 'blank_tap', 'audio', 'static_sounds');
  addAsset('https://micomi-assets.me/Sounds/Final/Tap3.wav', 'game_button_tap', 'audio', 'static_sounds');
  addAsset('https://micomi-assets.me/Sounds/Final/Card_Flip_2.wav', 'card_flip', 'audio', 'static_sounds');
  addAsset('https://micomi-assets.me/Sounds/Final/micomi_door.wav', 'loading_door', 'audio', 'static_sounds');
  

  console.log(`🔊 Static sound assets: ${assets.length}`);
  return assets;
  }

  async areStaticSoundAssetsCached() {
  const assets = this.getStaticSoundAssets();
  let available = 0;
  let missing = 0;

  for (const asset of assets) {
    const localPath = this.getLocalFilePath(asset.url, asset.category);
    const fileInfo = await FileSystem.getInfoAsync(localPath);
    if (fileInfo.exists) {
      available++;
    } else {
      missing++;
    }
  }

  return {
    total: assets.length,
    available,
    missing,
    allCached: missing === 0
  };
  }

  async downloadStaticSoundAssets(onProgress = null) {
  const wasDownloading = this.isDownloading;
  this.isDownloading = true;

  try {
    console.log('🔊 Starting static sound assets download...');
    const assets = this.getStaticSoundAssets();

    if (assets.length === 0) {
      console.log('✅ No static sound assets to download');
      return { success: true, downloaded: 0, total: 0 };
    }

    const startTime = Date.now();
    let successCount = 0;
    const results = [];

    for (let i = 0; i < assets.length; i += this.maxConcurrentDownloads) {
      const batch = assets.slice(i, i + this.maxConcurrentDownloads);

      const batchPromises = batch.map(async (asset, batchIndex) => {
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

    const cacheKey = 'static_soundsAssets';
    const assetsToSave = [];
    
    for (const [url, assetInfo] of this.downloadedAssets.entries()) {
      if (assetInfo.category === 'static_sounds') {
        assetsToSave.push([url, assetInfo]);
      }
    }
    
    if (assetsToSave.length > 0) {
      const cacheInfo = {
        assets: assetsToSave,
        savedAt: Date.now(),
        version: '1.0'
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheInfo));
      console.log(`💾 Saved ${assetsToSave.length} static sound assets to AsyncStorage`);
    }

    const totalTime = Date.now() - startTime;
    this.isDownloading = wasDownloading;

    console.log(`🔊 Static sound assets download completed: ${successCount}/${assets.length} in ${totalTime}ms`);

    return {
      success: successCount === assets.length,
      downloaded: successCount,
      total: assets.length,
      totalTime,
      results,
    };
  } catch (error) {
    this.isDownloading = wasDownloading;
    console.error('❌ Error downloading static sound assets:', error);
    throw error;
  }
}



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
    addAsset('https://pub-7f09eed735844833be66a15dd02a52a4.r2.dev/Icons%20Shop/fighterIcon.png', 'fighter_damage_icon', 'image', 'character_select_ui');
    addAsset('https://micomi-assets.me/Icons%20Shop/tankIcon.png', 'tank_damage_icon', 'image', 'character_select_ui');
    addAsset('https://micomi-assets.me/Icons%20Shop/mageIcon.png', 'mage_damage_icon', 'image', 'character_select_ui');
    addAsset('https://micomi-assets.me/Icons%20Shop/marksmanIcon.png', 'marksman_damage_icon', 'image', 'character_select_ui');

    // Video
    addAsset('https://micomi-assets.me/Hero%20Selection%20Components/Background.mp4', 'character_select_background_video', 'video', 'ui_videos');

    // Lottie
    addAsset('https://lottie.host/b3ebb5e0-3eda-4aad-82a3-a7428cbe0aa5/mvEeQ5rDi1.lottie', 'character_background_lottie', 'animation', 'character_select_ui');

    console.log(`📦 Static character select assets: ${assets.length}`);
    return assets;
  }

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

      // Download non-video assets first
      for (let i = 0; i < otherAssets.length; i += this.maxConcurrentDownloads) {
        const batch = otherAssets.slice(i, i + this.maxConcurrentDownloads);

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
  }


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

    


    console.log(`📦 Extracted ${assets.length} total assets from map data.`);
    return assets;
  }

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
  }

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

      for (let i = 0; i < assets.length; i += this.maxConcurrentDownloads) {
        const batch = assets.slice(i, i + this.maxConcurrentDownloads);

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
        success: true,
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
  }

  async areMapAssetsCached(mapLevelData) {
    const assets = this.extractAllAssetsFromMapData(mapLevelData);

    if (assets.length === 0) {
      return { cached: true, total: 0, available: 0, missing: 0, missingAssets: [] };
    }

    let availableCount = 0;
    const missingAssets = [];

    for (const asset of assets) {
      let isAvailable = false;

      //  FIX: Skip file:// URLs - they're already local
      if (asset.url.startsWith('file://') || asset.url.startsWith('/data/')) {
        isAvailable = true;
        availableCount++;
        continue;
      }

      // Step 1: Check in-memory cache first (fast)
      const assetInfo = this.downloadedAssets.get(asset.url);
       
      if (assetInfo && assetInfo.localPath) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(assetInfo.localPath);
          if (fileInfo.exists && fileInfo.size > 0) {
            isAvailable = true;
          }
        } catch (e) {
          // File check failed, continue to disk check
        }
      }
      
      // Step 2: If not in memory, check if file exists on disk anyway
      if (!isAvailable) {
        const localPath = this.getLocalFilePath(asset.url, asset.category);
        try {
          const fileInfo = await FileSystem.getInfoAsync(localPath);
          if (fileInfo.exists && fileInfo.size > 0) {
            // Found on disk - add to memory cache
            this.downloadedAssets.set(asset.url, {
              localPath,
              category: asset.category,
              url: asset.url,
              downloadedAt: Date.now(),
              fileSize: fileInfo.size
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
  }

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
  }



   extractGameVisualAssets(gameState) {
    const assets = [];
    // Check both the root of the state and the submissionResult for assets
    const sources = [gameState, gameState?.submissionResult];

    sources.forEach(source => {
      if (!source) return;

      // Combat Background (can be an array of URLs)
      if (Array.isArray(source.combat_background)) {
        source.combat_background.forEach(url => {
          if (url && this.isImageFile(url)) {
            assets.push({ url, name: 'combat_background', type: 'image', category: 'game_visuals' });
          }
        });
      }

      // Versus Background (single URL)
      if (source.versus_background && this.isImageFile(source.versus_background)) {
        assets.push({ url: source.versus_background, name: 'versus_background', type: 'image', category: 'game_visuals' });
      }

      // Card Image (single URL)
      if (source.card?.character_attack_card && this.isImageFile(source.card.character_attack_card)) {
        assets.push({ url: source.card.character_attack_card, name: 'character_attack_card', type: 'image', category: 'game_visuals' });
      }
    });

    // Remove duplicates to avoid unnecessary downloads
    const uniqueAssets = assets.filter((asset, index, self) =>
      index === self.findIndex(a => a.url === asset.url)
    );

    console.log(`🖼️ Extracted ${uniqueAssets.length} game visual assets`);
    return uniqueAssets;
  }


  extractGameImageAssets(levelData) {
    const assets = [];
    if (levelData && Array.isArray(levelData.imagesUrls)) {
      levelData.imagesUrls.forEach(url => {
        if (url && typeof url === 'string' && this.isImageFile(url)) {
          assets.push({
            url,
            name: url.split('/').pop().split('?')[0],
            type: 'image',
            category: 'game_images'
          });
        }
      });
    }
    console.log(`🖼️ Extracted ${assets.length} general game images (cards, potions)`);
    return assets;
  }

  extractAudioAssets(levelData) {
    const assets = [];

     if (levelData && levelData.gameplay_audio && typeof levelData.gameplay_audio === 'string' && this.isAudioFile(levelData.gameplay_audio)) {
      assets.push({
        url: levelData.gameplay_audio,
        name: 'gameplay_background_music',
        type: 'audio',
        category: 'game_audio'
      });
    }

     if (levelData && levelData.versus_audio && typeof levelData.versus_audio === 'string' && this.isAudioFile(levelData.versus_audio)) {
      assets.push({
        url: levelData.versus_audio,
        name: 'versus_audio',
        type: 'audio',
        category: 'game_audio'
      });
    }

     if (levelData && levelData.is_victory_audio && typeof levelData.is_victory_audio === 'string' && this.isAudioFile(levelData.is_victory_audio)) {
      assets.push({
        url: levelData.is_victory_audio,
        name: 'is_victory_audio',
        type: 'audio',
        category: 'game_audio'
      });
    }


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

  //  Extract character assets from character data
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
  }

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

      for (let i = 0; i < assets.length; i += this.maxConcurrentDownloads) {
        const batch = assets.slice(i, i + this.maxConcurrentDownloads);

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
  }

  async areStaticCharacterSelectAssetsCached() {
    const assets = this.getStaticCharacterSelectAssets();

    if (assets.length === 0) {
      return { cached: true, total: 0, available: 0, missing: 0, missingAssets: [] };
    }

    let availableCount = 0;
    const missingAssets = [];

    for (const asset of assets) {
      let isAvailable = false;

      // Check memory cache
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

      // Check disk if not in memory
      if (!isAvailable) {
        const localPath = this.getLocalFilePath(asset.url, asset.category);
        try {
          const fileInfo = await FileSystem.getInfoAsync(localPath);
          if (fileInfo.exists && fileInfo.size > 0) {
            this.downloadedAssets.set(asset.url, {
              localPath,
              category: asset.category,
              url: asset.url,
              downloadedAt: Date.now(),
              fileSize: fileInfo.size
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
    }

    const cached = availableCount === assets.length;

    console.log(`🔍 Static character select assets cache check: ${availableCount}/${assets.length} available`, {
      cached,
      missing: missingAssets.length,
    });

    return {
      cached,
      total: assets.length,
      available: availableCount,
      missing: assets.length - availableCount,
      missingAssets
    };
  }


  async areMapThemeAssetsCached(mapThemes) {
    const assets = this.extractMapThemeAssets(mapThemes);

    if (assets.length === 0) {
      return { cached: true, total: 0, available: 0, missing: 0, missingAssets: [] };
    }

    let availableCount = 0;
    const missingAssets = [];

    for (const asset of assets) {
      let isAvailable = false;

      // Check memory cache
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

      // Check disk if not in memory
      if (!isAvailable) {
        const localPath = this.getLocalFilePath(asset.url, asset.category);
        try {
          const fileInfo = await FileSystem.getInfoAsync(localPath);
          if (fileInfo.exists && fileInfo.size > 0) {
            this.downloadedAssets.set(asset.url, {
              localPath,
              category: asset.category,
              url: asset.url,
              downloadedAt: Date.now(),
              fileSize: fileInfo.size
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
    }

    const cached = availableCount === assets.length;

    console.log(`🔍 Map theme assets cache check: ${availableCount}/${assets.length} available`, {
      cached,
      missing: missingAssets.length,
    });

    return {
      cached,
      total: assets.length,
      available: availableCount,
      missing: assets.length - availableCount,
      missingAssets
    };
  }

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
  }



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
  }

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
  }

  extractGameAnimationAssets(gameState) {
    const assets = [];
    
    if (!gameState) return assets;

    //  Helper to validate URL before adding
    const isValidRemoteUrl = (url) => {
      return url && 
             typeof url === 'string' && 
             !url.startsWith('file://') && 
             !url.startsWith('/data/') &&
             (url.startsWith('http://') || url.startsWith('https://'));
    };

    // Character animations
    if (gameState.character || gameState.selectedCharacter) {
      const char = gameState.character || gameState.selectedCharacter;
      
      const charAnimations = [
        { url: char.character_idle, name: 'character_idle', type: 'animation' },
        { url: char.character_run, name: 'character_run', type: 'animation' },
        { url: char.character_hurt, name: 'character_hurt', type: 'animation' },
        { url: char.character_dies, name: 'character_dies', type: 'animation' },
        { url: char.character_range_attack, name: 'character_range_attack', type: 'animation' }
      ];

      // Handle character_attack array
      if (Array.isArray(char.character_attack)) {
        char.character_attack.forEach((attackUrl, index) => {
          if (isValidRemoteUrl(attackUrl)) {
            charAnimations.push({
              url: attackUrl,
              name: `character_attack_${index}`,
              type: 'animation'
            });
          }
        });
      } else if (isValidRemoteUrl(char.character_attack)) {
        charAnimations.push({
          url: char.character_attack,
          name: 'character_attack',
          type: 'animation'
        });
      }

      // Filter out invalid URLs and add character context
      charAnimations
        .filter(asset => isValidRemoteUrl(asset.url))
        .forEach(asset => {
          assets.push({
            ...asset,
            category: 'game_animations',
            characterName: char.character_name
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

      // Filter out invalid URLs and add enemy context
      enemyAnimations
        .filter(asset => isValidRemoteUrl(asset.url))
        .forEach(asset => {
          assets.push({
            ...asset,
            category: 'game_animations',
            enemyName: enemy.enemy_name
          });
        });
    }

    // Remove duplicates based on URL
    const uniqueAssets = assets.filter((asset, index, self) => 
      index === self.findIndex(a => a.url === asset.url)
    );

    console.log(`📦 Extracted ${uniqueAssets.length} game animation assets (remote URLs only)`);
    return uniqueAssets;
  }

  extractPotionShopAssets(levelPreviewData) {
  const assets = [];

    addAsset(
      'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1759901895/labBackground_otqad4.jpg',
      'shop_background',
      'image',
      'potion_shop_ui'
    );
    addAsset(
      'https://micomi-assets.me/Hero%20Selection%20Components/Shi-Shi%20Shop.mp4',
      'shishi_shopkeeper_video',
      'video',
      'potion_shop_ui'
    );

  
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
  }

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
  }


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
  }

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
  }



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
  }




  async downloadGameVisualAssets(gameState, onProgress = null) {
    try {
      console.log('🖼️ Starting game visual asset download...');
      const assets = this.extractGameVisualAssets(gameState);

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
              category: 'game_visuals'
            });
          }
        });
        await Promise.all(batchPromises);
      }
      const totalTime = Date.now() - startTime;
      console.log(`🖼️ Visual asset download completed: ${successCount}/${assets.length} in ${totalTime}ms`);
      return { success: true, downloaded: successCount, total: assets.length, results };
    } catch (error) {
      console.error('❌ Error downloading visual assets:', error);
      return { success: false, error };
    }
  }

   async downloadGameImageAssets(levelData, onProgress = null) {
    try {
      console.log('🖼️ Starting general game image asset download...');
      const assets = this.extractGameImageAssets(levelData);

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
              category: 'game_images'
            });
          }
        });
        await Promise.all(batchPromises);
      }
      const totalTime = Date.now() - startTime;
      
      try {
        const cacheKey = 'game_imagesAssets';
        const cacheInfo = {
          downloadedAt: Date.now(),
          category: 'game_images',
          assets: Array.from(this.downloadedAssets.entries()).filter(([, info]) => 
            info.category === 'game_images'
          ),
          totalAssets: successCount
        };
        await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheInfo));
        console.log(`💾 Saved game images asset cache info to storage`);
      } catch (error) {
        console.warn('⚠️ Failed to save game_images cache info to AsyncStorage:', error);
      }
      
      console.log(`🖼️ General image asset download completed: ${successCount}/${assets.length} in ${totalTime}ms`);
      return { success: true, downloaded: successCount, total: assets.length, results };
    } catch (error) {
      console.error('❌ Error downloading general game images:', error);
      return { success: false, error };
    }
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

  isAssetCached(url) {
    if (!url) return false;
    
    // Check if it's already a local file path
    if (url.startsWith('file://')) return true;
    
    // Check memory cache
    const assetInfo = this.downloadedAssets.get(url);
    return !!(assetInfo && assetInfo.localPath);
  }

  //  NEW: Get cached path or return original (sync version)
  getCachedAssetPathSync(url) {
    if (!url) return url;
    if (url.startsWith('file://')) return url;
    
    const assetInfo = this.downloadedAssets.get(url);
    if (assetInfo && assetInfo.localPath) {
      return `file://${assetInfo.localPath}`;
    }
    return url;
  }

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
      };
    });

    console.log('✅ Character shop data transformed with Map API cached paths');
    return transformedData;
  }

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
  }

  
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
        'character_dies',
        'character_range_attack' 
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


    if (transformedGameState.is_victory_image) {
      transformedGameState.is_victory_image = this.getCachedAssetPath(transformedGameState.is_victory_image);
    }

    if (Array.isArray(transformedGameState.combat_background)) {
      transformedGameState.combat_background = transformedGameState.combat_background.map(url => this.getCachedAssetPath(url));
    }
    if (transformedGameState.versus_background) {
      transformedGameState.versus_background = this.getCachedAssetPath(transformedGameState.versus_background);
    }
    if (transformedGameState.card?.character_attack_card) {
      transformedGameState.card.character_attack_card = this.getCachedAssetPath(transformedGameState.card.character_attack_card);
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

     if (transformedGameState.gameplay_audio) {
      transformedGameState.gameplay_audio = this.getCachedAssetPath(transformedGameState.gameplay_audio);
    }

     if (transformedGameState.dialogue) {
      const dialogue = transformedGameState.dialogue;
      if (dialogue.micomi_image) {
        dialogue.micomi_image = this.getCachedAssetPath(dialogue.micomi_image);
      }
      if (dialogue.enemy_image) {
        dialogue.enemy_image = this.getCachedAssetPath(dialogue.enemy_image);
      }
    }



    // Transform fight result animations
    if (transformedGameState.submissionResult) {
      const sub = transformedGameState.submissionResult;

      if (sub.is_victory_image) {
        sub.is_victory_image = this.getCachedAssetPath(sub.is_victory_image);
      }


      if (Array.isArray(sub.combat_background)) {
        sub.combat_background = sub.combat_background.map(url => this.getCachedAssetPath(url));
      }
      if (sub.versus_background) {
        sub.versus_background = this.getCachedAssetPath(sub.versus_background);
      }
      if (sub.card?.character_attack_card) {
        sub.card.character_attack_card = this.getCachedAssetPath(sub.card.character_attack_card);
      }

      if (Array.isArray(sub.audio)) {
        sub.audio = sub.audio.map(url => url ? this.getCachedAssetPath(url) : url);
      }
      if (sub.is_correct_audio) {
        sub.is_correct_audio = this.getCachedAssetPath(sub.is_correct_audio);
      }
      if (sub.enemy_attack_audio) {
        sub.enemy_attack_audio = this.getCachedAssetPath(sub.enemy_attack_audio);
      }
      if (sub.character_attack_audio) {
        sub.character_attack_audio = this.getCachedAssetPath(sub.character_attack_audio);
      }

      if (sub.is_victory_audio) {
        sub.is_victory_audio = this.getCachedAssetPath(sub.is_victory_audio);
      }

      if (sub.gameplay_audio) {
        sub.gameplay_audio = this.getCachedAssetPath(sub.gameplay_audio);
      }


      if (sub.fightResult) {
        const fightResult = sub.fightResult;
        
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
    }

      if (transformedGameState.submissionResult?.fightResult?.character) {
        const fightChar = transformedGameState.submissionResult.fightResult.character;
        if (fightChar.character_range_attack) {
            fightChar.character_range_attack = this.getCachedAssetPath(fightChar.character_range_attack);
        }
    }

     if (transformedGameState.lessons) {
      const lessonArray = Array.isArray(transformedGameState.lessons) 
        ? transformedGameState.lessons 
        : (transformedGameState.lessons.lessons || []);
        
      lessonArray.forEach(lesson => {
        if (lesson && lesson.page_url) {
          lesson.page_url = this.getCachedAssetPath(lesson.page_url);
        }
      });
    }

    if (transformedGameState.currentLesson && transformedGameState.currentLesson.page_url) {
      transformedGameState.currentLesson.page_url = this.getCachedAssetPath(transformedGameState.currentLesson.page_url);
    }

    return transformedGameState;
  }

  //  Download all character assets
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
  }

  //  Get cached asset path (local file or original URL)
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

  //  Clear cache for specific category
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

//  Download character select background video specifically
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






  //  Clear all caches
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