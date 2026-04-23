import * as FileSystem from 'expo-file-system/legacy';

import { coreMethods } from './universalAssetPreloader/coreMethods';
import { soundMethods } from './universalAssetPreloader/soundMethods';
import { characterSelectMethods } from './universalAssetPreloader/characterSelectMethods';
import { mapMethods } from './universalAssetPreloader/mapMethods';
import { gameplayMethods } from './universalAssetPreloader/gameplayMethods';
import { profileMethods } from './universalAssetPreloader/profileMethods';
import { shopMethods } from './universalAssetPreloader/shopMethods';
import { characterMethods } from './universalAssetPreloader/characterMethods';
import { videoMethods } from './universalAssetPreloader/videoMethods';
import { pvpMethods } from './universalAssetPreloader/pvpMethods';

class UniversalAssetPreloader {
  constructor() {
    this.downloadedAssets = new Map();
    this.preloadedAssets = new Map();
    this.downloadQueue = new Map();
    this.isDownloading = false;
    this.cacheDirectory = FileSystem.documentDirectory + 'gameAssets/';
    // Higher concurrency for faster preload while keeping existing flow intact.
    this.maxConcurrentDownloads = 8;
  }
}

Object.assign(
  UniversalAssetPreloader.prototype,
  coreMethods,
  soundMethods,
  characterSelectMethods,
  mapMethods,
  gameplayMethods,
  profileMethods,
  shopMethods,
  characterMethods,
  videoMethods,
  pvpMethods
);

export const universalAssetPreloader = new UniversalAssetPreloader();
