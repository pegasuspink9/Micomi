import { Image as RNImage } from 'react-native';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AnimationPreloader {
  constructor() {
    this.preloadedAnimations = new Map();
    this.downloadedAnimations = new Map();
    this.preloadQueue = new Set();
    this.isPreloading = false;
    this.cacheDirectory = FileSystem.documentDirectory + 'animations/';
  }

  // ✅ Create cache directory if it doesn't exist
  async ensureCacheDirectory() {
    const dirInfo = await FileSystem.getInfoAsync(this.cacheDirectory);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(this.cacheDirectory, { intermediates: true });
      console.log('📁 Created animations cache directory');
    }
  }

  // ✅ Generate local file path for animation
  getLocalFilePath(url) {
    const fileName = url.split('/').pop().split('?')[0] || `animation_${Date.now()}`;
    return this.cacheDirectory + fileName;
  }

  // ✅ Download and cache animation to local storage
  async downloadAnimation(url, onProgress = null) {
    try {
      await this.ensureCacheDirectory();
      
      const localPath = this.getLocalFilePath(url);
      
      // Check if already downloaded
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (fileInfo.exists) {
        console.log(`📥 Animation already cached: ${url.slice(-50)}`);
        this.downloadedAnimations.set(url, localPath);
        return { success: true, localPath, cached: true };
      }

      console.log(`📥 Downloading animation: ${url.slice(-50)}`);
      const startTime = Date.now();
      
      // Download with progress tracking
      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        localPath,
        {},
        onProgress ? (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          onProgress({ progress, url, downloadProgress });
        } : undefined
      );

      const result = await downloadResumable.downloadAsync();
      const downloadTime = Date.now() - startTime;

      if (result && result.uri) {
        this.downloadedAnimations.set(url, result.uri);
        
        // Also preload to memory cache
        await RNImage.prefetch(`file://${result.uri}`);
        this.preloadedAnimations.set(url, {
          loadedAt: Date.now(),
          loadTime: downloadTime,
          url,
          localPath: result.uri
        });

        console.log(`✅ Animation downloaded and cached in ${downloadTime}ms: ${url.slice(-50)}`);
        return { success: true, localPath: result.uri, downloadTime };
      } else {
        throw new Error('Download failed - no result URI');
      }
    } catch (error) {
      console.error(`❌ Failed to download animation: ${url}`, error);
      return { success: false, error: error.message };
    }
  }

  // ✅ Get cached animation path (local file or original URL)
  getCachedAnimationPath(url) {
    const localPath = this.downloadedAnimations.get(url);
    if (localPath) {
      return `file://${localPath}`;
    }
    return url; // Fallback to original URL
  }

  // ✅ Extract all animation URLs from game state
  extractAnimationUrls(gameState) {
    const urls = new Set();
    
    // Character animations
    if (gameState.character || gameState.selectedCharacter) {
      const char = gameState.character || gameState.selectedCharacter;
      if (char.character_idle) urls.add(char.character_idle);
      if (char.character_run) urls.add(char.character_run);
      if (char.character_hurt) urls.add(char.character_hurt);
      if (char.character_dies) urls.add(char.character_dies);
      
      // Handle character_attack array
      if (Array.isArray(char.character_attack)) {
        char.character_attack.forEach(url => {
          if (url) urls.add(url);
        });
      } else if (char.character_attack) {
        urls.add(char.character_attack);
      }
    }

    // Enemy animations
    if (gameState.enemy) {
      const enemy = gameState.enemy;
      if (enemy.enemy_idle) urls.add(enemy.enemy_idle);
      if (enemy.enemy_run) urls.add(enemy.enemy_run);
      if (enemy.enemy_attack) urls.add(enemy.enemy_attack);
      if (enemy.enemy_hurt) urls.add(enemy.enemy_hurt);
      if (enemy.enemy_dies) urls.add(enemy.enemy_dies);
    }

    // Fight result animations (from submission data)
    if (gameState.submissionResult?.fightResult) {
      const fightChar = gameState.submissionResult.fightResult.character;
      const fightEnemy = gameState.submissionResult.fightResult.enemy;
      
      if (fightChar) {
        if (fightChar.character_idle) urls.add(fightChar.character_idle);
        if (fightChar.character_run) urls.add(fightChar.character_run);
        if (fightChar.character_hurt) urls.add(fightChar.character_hurt);
        if (fightChar.character_dies) urls.add(fightChar.character_dies);
        if (Array.isArray(fightChar.character_attack)) {
          fightChar.character_attack.forEach(url => {
            if (url) urls.add(url);
          });
        } else if (fightChar.character_attack) {
          urls.add(fightChar.character_attack);
        }
      }
      
      if (fightEnemy) {
        if (fightEnemy.enemy_idle) urls.add(fightEnemy.enemy_idle);
        if (fightEnemy.enemy_run) urls.add(fightEnemy.enemy_run);
        if (fightEnemy.enemy_attack) urls.add(fightEnemy.enemy_attack);
        if (fightEnemy.enemy_hurt) urls.add(fightEnemy.enemy_hurt);
        if (fightEnemy.enemy_dies) urls.add(fightEnemy.enemy_dies);
      }
    }

    return Array.from(urls).filter(url => 
      url && 
      typeof url === 'string' && 
      (url.startsWith('http://') || url.startsWith('https://'))
    );
  }

  // ✅ Download all animations with detailed progress tracking
  async downloadAllAnimations(gameState, onProgress = null, onAnimationComplete = null) {
    if (this.isPreloading) {
      console.warn('⚠️ Animation downloading already in progress');
      return { success: false, reason: 'already_downloading' };
    }

    this.isPreloading = true;
    const urls = this.extractAnimationUrls(gameState);
    
    if (urls.length === 0) {
      console.warn('⚠️ No animation URLs found to download');
      this.isPreloading = false;
      return { success: true, downloaded: 0, total: 0 };
    }

    console.log(`📥 Starting download of ${urls.length} animations...`);
    const startTime = Date.now();
    const results = [];
    let successCount = 0;

    // Download animations one by one to avoid overwhelming the device
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      
      const result = await this.downloadAnimation(url, (downloadProgress) => {
        // Individual animation progress
        if (onAnimationComplete) {
          onAnimationComplete({
            url,
            progress: downloadProgress.progress,
            currentIndex: i,
            totalAnimations: urls.length
          });
        }
      });
      
      if (result.success) {
        successCount++;
      }
      
      results.push({ url, result });
      
      // Overall progress
      if (onProgress) {
        onProgress({
          loaded: i + 1,
          total: urls.length,
          progress: (i + 1) / urls.length,
          successCount,
          currentUrl: url
        });
      }
    }

    const totalTime = Date.now() - startTime;
    this.isPreloading = false;

    // Save download cache info to AsyncStorage
    try {
      const cacheInfo = {
        downloadedAt: Date.now(),
        animations: Array.from(this.downloadedAnimations.entries()),
        totalAnimations: successCount
      };
      await AsyncStorage.setItem('animationCache', JSON.stringify(cacheInfo));
    } catch (error) {
      console.warn('⚠️ Failed to save cache info to AsyncStorage:', error);
    }

    console.log(`📥 Download completed: ${successCount}/${urls.length} in ${totalTime}ms`);
    
    return {
      success: true,
      downloaded: successCount,
      total: urls.length,
      totalTime,
      results,
      failedUrls: results
        .filter(r => !r.result.success)
        .map(r => r.url)
    };
  }

  // ✅ Load cached animations from storage on app start
  async loadCachedAnimations() {
    try {
      await this.ensureCacheDirectory();
      
      const cacheInfoString = await AsyncStorage.getItem('animationCache');
      if (cacheInfoString) {
        const cacheInfo = JSON.parse(cacheInfoString);
        
        // Verify cached files still exist
        for (const [url, localPath] of cacheInfo.animations) {
          const fileInfo = await FileSystem.getInfoAsync(localPath);
          if (fileInfo.exists) {
            this.downloadedAnimations.set(url, localPath);
            this.preloadedAnimations.set(url, {
              loadedAt: cacheInfo.downloadedAt,
              url,
              localPath,
              fromCache: true
            });
          }
        }
        
        console.log(`📂 Loaded ${this.downloadedAnimations.size} cached animations from storage`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load cached animations:', error);
    }
  }

  // ✅ Check if animation is downloaded and cached
  isAnimationCached(url) {
    return this.downloadedAnimations.has(url);
  }

  // ✅ Check if animation is preloaded in memory
  isAnimationPreloaded(url) {
    return this.preloadedAnimations.has(url) || this.downloadedAnimations.has(url);
  }

  // ✅ Get download statistics
  getDownloadStats() {
    return {
      downloadedCount: this.downloadedAnimations.size,
      preloadedCount: this.preloadedAnimations.size,
      isDownloading: this.isPreloading,
      downloadedUrls: Array.from(this.downloadedAnimations.keys()),
      cacheDirectory: this.cacheDirectory
    };
  }

  // ✅ Clear all caches (for troubleshooting)
  async clearAllCaches() {
    try {
      // Clear memory caches
      this.preloadedAnimations.clear();
      this.downloadedAnimations.clear();
      this.preloadQueue.clear();
      this.isPreloading = false;
      
      // Clear AsyncStorage
      await AsyncStorage.removeItem('animationCache');
      
      // Delete cached files
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDirectory);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(this.cacheDirectory, { idempotent: true });
      }
      
      console.log('🗑️ All animation caches cleared');
    } catch (error) {
      console.error('❌ Failed to clear caches:', error);
    }
  }
}

// Export singleton instance
export const animationPreloader = new AnimationPreloader();