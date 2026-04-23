import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const pvpMethods = {
  getStaticPvpAssets() {
    const assets = [];
    const addedUrls = new Set();

    const addAsset = (url, name, type, category) => {
      if (url && typeof url === 'string' && !addedUrls.has(url)) {
        addedUrls.add(url);
        assets.push({ url, name, type, category });
      }
    };

    // PVP background video
    addAsset(
      'https://micomi-assets.me/Pvp%20Assets/Landing%20Image/FinalBackground.mp4',
      'pvp_background_video',
      'video',
      'ui_videos'
    );

    console.log(`📦 Extracted ${assets.length} static PVP assets`);
    return assets;
  },
};
