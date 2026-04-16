import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const gameplayMethods = {
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

       if (source.selectedCharacter?.special_skill?.special_skill_image) {
        assets.push({ url: source.selectedCharacter.special_skill.special_skill_image, name: 'character_special_skill', type: 'image', category: 'game_images' });
      }


        if (Array.isArray(source.selectedCharacter?.cards)) {
        source.selectedCharacter.cards.forEach((card, i) => {
          if (card.character_attack_card) {
            assets.push({ url: card.character_attack_card, name: `character_card_${i}`, type: 'image', category: 'game_visuals' });
          }
        });
      }

      if (source.enemy?.special_skill?.special_skill_image) {
        assets.push({ url: source.enemy.special_skill.special_skill_image, name: 'enemy_special_skill', type: 'image', category: 'game_images' });
      }

       if (source.enemy?.special_skill?.special_skill_image) {
        assets.push({ url: source.enemy.special_skill.special_skill_image, name: 'enemy_special_skill', type: 'image', category: 'game_images' });
      }

          if (source.enemy?.enemy_attack_overlay) {
        assets.push({ url: source.enemy.enemy_attack_overlay, name: 'enemy_attack_overlay', type: 'image', category: 'game_visuals' });
      }


      if (source.use_potion_effect && this.isImageFile(source.use_potion_effect)) {
        assets.push({ url: source.use_potion_effect, name: 'use_potion_effect', type: 'image', category: 'game_visuals' });
      }

    });

    

    // Remove duplicates to avoid unnecessary downloads
    const uniqueAssets = assets.filter((asset, index, self) =>
      index === self.findIndex(a => a.url === asset.url)
    );

    console.log(`🖼️ Extracted ${uniqueAssets.length} game visual assets`);
    return uniqueAssets;
  },

extractGameImageAssets(levelData) {
    const assets = [];
    const lessonsData = levelData.lessons;
    
    // 1. Preload Cover Page if exists
    if (lessonsData?.cover_page) {
      assets.push({
        url: lessonsData.cover_page,
        category: 'game_images',
        name: 'lesson_cover_page'
      });
    }

    // 2. Preload Lesson Pages
    const lessons = lessonsData?.lessons || [];
    if (Array.isArray(lessons)) {
      lessons.forEach((lesson, index) => {
        if (lesson.page_url) {
          assets.push({
            url: lesson.page_url,
            category: 'game_images',
            name: `lesson_page_${index}`
          });
        }
      });
    }

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
  },

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

    if (levelData && levelData.use_potion_audio && typeof levelData.use_potion_audio === 'string' && this.isAudioFile(levelData.use_potion_audio)) {
      assets.push({
        url: levelData.use_potion_audio,
        name: 'use_potion_audio',
        type: 'audio',
        category: 'game_audio'
      });
    }

    if (levelData && levelData.character_attack_audio && typeof levelData.character_attack_audio === 'string' && this.isAudioFile(levelData.character_attack_audio)) {
      assets.push({ url: levelData.character_attack_audio, name: 'character_attack_audio', type: 'audio', category: 'game_audio' });
    }
    if (levelData && levelData.enemy_attack_audio && typeof levelData.enemy_attack_audio === 'string' && this.isAudioFile(levelData.enemy_attack_audio)) {
      assets.push({ url: levelData.enemy_attack_audio, name: 'enemy_attack_audio', type: 'audio', category: 'game_audio' });
    }
    if (levelData && levelData.character_idle_audio && typeof levelData.character_idle_audio === 'string' && this.isAudioFile(levelData.character_idle_audio)) {
      assets.push({ url: levelData.character_idle_audio, name: 'character_idle_audio', type: 'audio', category: 'game_audio' });
    }
    if (levelData && levelData.enemy_idle_audio && typeof levelData.enemy_idle_audio === 'string' && this.isAudioFile(levelData.enemy_idle_audio)) {
      assets.push({ url: levelData.enemy_idle_audio, name: 'enemy_idle_audio', type: 'audio', category: 'game_audio' });
    }

    if (levelData && levelData.character_hurt_audio && typeof levelData.character_hurt_audio === 'string' && this.isAudioFile(levelData.character_hurt_audio)) {
      assets.push({ url: levelData.character_hurt_audio, name: 'character_hurt_audio', type: 'audio', category: 'game_audio' });
    }
    if (levelData && levelData.enemy_hurt_audio && typeof levelData.enemy_hurt_audio === 'string' && this.isAudioFile(levelData.enemy_hurt_audio)) {
      assets.push({ url: levelData.enemy_hurt_audio, name: 'enemy_hurt_audio', type: 'audio', category: 'game_audio' });
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
  },

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
  },

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
  },

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
  },

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
  },

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
  },

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
  },

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

      if (character.special_skill?.special_skill_image) {
        character.special_skill.special_skill_image = this.getCachedAssetPath(character.special_skill.special_skill_image);
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

      if (enemy.special_skill?.special_skill_image) {
        enemy.special_skill.special_skill_image = this.getCachedAssetPath(enemy.special_skill.special_skill_image);
      }
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
    if (transformedGameState.character_idle_audio) {
      transformedGameState.character_idle_audio = this.getCachedAssetPath(transformedGameState.character_idle_audio);
    }
    if (transformedGameState.enemy_idle_audio) {
      transformedGameState.enemy_idle_audio = this.getCachedAssetPath(transformedGameState.enemy_idle_audio);
    }

     if (transformedGameState.gameplay_audio) {
      transformedGameState.gameplay_audio = this.getCachedAssetPath(transformedGameState.gameplay_audio);
    }

    if (transformedGameState.character_hurt_audio) {
      transformedGameState.character_hurt_audio = this.getCachedAssetPath(transformedGameState.character_hurt_audio);
    }
    if (transformedGameState.enemy_hurt_audio) {
      transformedGameState.enemy_hurt_audio = this.getCachedAssetPath(transformedGameState.enemy_hurt_audio);
    }


    if (transformedGameState.use_potion_effect) {
      transformedGameState.use_potion_effect = this.getCachedAssetPath(transformedGameState.use_potion_effect);
    }
    
    if (transformedGameState.use_potion_audio) {
      transformedGameState.use_potion_audio = this.getCachedAssetPath(transformedGameState.use_potion_audio);
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


      if (sub.use_potion_effect) {
        sub.use_potion_effect = this.getCachedAssetPath(sub.use_potion_effect);
      }
      if (sub.use_potion_audio) {
        sub.use_potion_audio = this.getCachedAssetPath(sub.use_potion_audio);
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
      if (sub.character_idle_audio) {
        sub.character_idle_audio = this.getCachedAssetPath(sub.character_idle_audio);
      }
      if (sub.enemy_idle_audio) {
        sub.enemy_idle_audio = this.getCachedAssetPath(sub.enemy_idle_audio);
      }

      if (sub.characterAttackAudio) {
        sub.characterAttackAudio = this.getCachedAssetPath(sub.characterAttackAudio);
      }
      if (sub.enemyAttackAudio) {
        sub.enemyAttackAudio = this.getCachedAssetPath(sub.enemyAttackAudio);
      }
      if (sub.characterIdleAudio) {
        sub.characterIdleAudio = this.getCachedAssetPath(sub.characterIdleAudio);
      }
      if (sub.enemyIdleAudio) {
        sub.enemyIdleAudio = this.getCachedAssetPath(sub.enemyIdleAudio);
      }

      if (sub.character_hurt_audio) {
        sub.character_hurt_audio = this.getCachedAssetPath(sub.character_hurt_audio);
      }
      if (sub.enemy_hurt_audio) {
        sub.enemy_hurt_audio = this.getCachedAssetPath(sub.enemy_hurt_audio);
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

          if (fightChar.special_skill?.special_skill_image) {
            fightChar.special_skill.special_skill_image = this.getCachedAssetPath(fightChar.special_skill.special_skill_image);
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

          if (fightEnemy.special_skill?.special_skill_image) {
            fightEnemy.special_skill.special_skill_image = this.getCachedAssetPath(fightEnemy.special_skill.special_skill_image);
          }
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

     if (gameState.lessons) {
      // Cache cover page
      if (gameState.lessons.cover_page) {
        gameState.lessons.cover_page = this.getCachedAssetPathSync(gameState.lessons.cover_page);
      }
      
      // Cache lesson array
      if (Array.isArray(gameState.lessons.lessons)) {
        gameState.lessons.lessons = gameState.lessons.lessons.map(lesson => ({
          ...lesson,
          page_url: this.getCachedAssetPathSync(lesson.page_url)
        }));
      }
    }


    return transformedGameState;
  }
};
