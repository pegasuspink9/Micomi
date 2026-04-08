import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const soundMethods = {
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

  addAsset('https://micomi-assets.me/Sounds/Final/Navigation.mp3', 'navigation_bgm', 'audio', 'static_sounds');

  addAsset('https://micomi-assets.me/Sounds/Final/Shop.ogg', 'shop_bgm', 'audio', 'static_sounds');

  addAsset('https://micomi-assets.me/Sounds/Final/Character%20Select%20Screen.mp3', 'character_shop_bgm', 'audio', 'static_sounds');

  addAsset('https://micomi-assets.me/Sounds/Final/page%20flip.mp3', 'page_flip_sound', 'audio', 'static_sounds');
  

  console.log(`🔊 Static sound assets: ${assets.length}`);
  return assets;
  },

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
  },

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
};
