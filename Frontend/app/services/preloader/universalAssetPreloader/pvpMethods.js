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
      'https://micomi-assets.me/Pvp%20Assets/Landing%20Image/FinalBackground%20(1).mp4',
      'pvp_background_video',
      'video',
      'ui_videos'
    );

    addAsset(
      'https://micomi-assets.me/Pvp%20Assets/Landing%20Image/PvP%20Logo.png',
      'pvp_logo_image',
      'image',
      'ui_images'
    );

    addAsset(
      'https://micomi-assets.me/Pvp%20Assets/Languages/HTML.png',
      'pvp_topic_html',
      'image',
      'ui_images'
    );

    addAsset(
      'https://micomi-assets.me/Pvp%20Assets/Languages/CSSS.png',
      'pvp_topic_css',
      'image',
      'ui_images'
    );

    addAsset(
      'https://micomi-assets.me/Pvp%20Assets/Languages/Computer.png',
      'pvp_topic_javascript',
      'image',
      'ui_images'
    );

    addAsset(
      'https://micomi-assets.me/Pvp%20Assets/Languages/JavaScript.png',
      'pvp_topic_computer',
      'image',
      'ui_images'
    );

    console.log(`📦 Extracted ${assets.length} static PVP assets`);
    return assets;
  },
};
