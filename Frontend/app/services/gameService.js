import { apiService } from './api';
import { universalAssetPreloader } from './preloader/universalAssetPreloader';

export const gameService = {
  enterLevel: async (playerId, levelId, onAnimationProgress = null, onDownloadProgress = null) => {
    try {
      console.log(`🎮 Entering level ${levelId} for player ${playerId}...`);
      
      // Load cached animations on first call
      await universalAssetPreloader.loadCachedAssets('game_animations');
      
      const response = await apiService.post(`/game/entryLevel/${playerId}/${levelId}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to enter level');
      }

      console.log(`🎮 Level ${levelId} data received, starting forced animation download...`);
      
      // ✅ Use universalAssetPreloader instead of animationPreloader
      const downloadResult = await universalAssetPreloader.downloadGameAnimationAssets(
        response.data,
        onDownloadProgress,
        onAnimationProgress
      );

      if (!downloadResult.success) {
        console.warn('⚠️ Animation download failed, but continuing with game...');
      } else {
        console.log(`✅ All animations downloaded successfully: ${downloadResult.downloaded}/${downloadResult.total}`);
      }

      // ✅ Transform game state to use cached paths
      const gameStateWithCache = universalAssetPreloader.transformGameStateWithCache(response.data);

      return {
        ...gameStateWithCache,
        downloadStats: downloadResult 
      };
    } catch (error) {
      console.error(`Failed to enter level ${levelId}:`, error);
      throw error;
    }
  },
    
  submitAnswer: async (playerId, levelId, challengeId, selectedAnswers) => {
    try {
      if (!Array.isArray(selectedAnswers) || selectedAnswers.length === 0) {
        throw new Error('selectedAnswers must be a non-empty array');
      }

      if (!playerId || !levelId || !challengeId) {
        throw new Error('Missing required parameters: playerId, levelId, or challengeId');
      }

      const payload = { answer: selectedAnswers };
      
      console.log('🔍 Submitting answer:', {
        url: `/game/submit-challenge/${playerId}/${levelId}/${challengeId}`,
        payload: selectedAnswers,
        payloadSize: JSON.stringify(payload).length
      });
      
      const startTime = Date.now();
      const response = await apiService.post(
        `/game/submit-challenge/${playerId}/${levelId}/${challengeId}`, 
        payload
      );
      
      const endTime = Date.now();
      console.log(`✅ Answer submitted in ${endTime - startTime}ms`);
      
      // ✅ Transform response data to use cached paths
      const responseWithCache = universalAssetPreloader.transformGameStateWithCache(response.success ? response.data : response);
      
      console.log('🎬 Using cached animations for submission response');
      
      return responseWithCache;
    } catch (error) {
      console.error(`❌ Failed to submit answer:`, error);
      throw error;
    }
  },

  retryLevel: async (playerId, levelId, onAnimationProgress = null, onDownloadProgress = null) => {
    try {
      console.log(`🔄 RETRYING level ${levelId} for player ${playerId} - resetting to zero...`);
      
      await universalAssetPreloader.loadCachedAssets('game_animations');
      
      const response = await apiService.post(`/game/entryLevel/${playerId}/${levelId}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to retry level');
      }

      console.log(`🎮 Level ${levelId} RETRY data received, starting forced animation download...`);
      
      const cacheStatus = await universalAssetPreloader.areGameAnimationAssetsCached(response.data);
      
      let downloadResult = { success: true, downloaded: 0, total: 0 };
      
      if (!cacheStatus.cached) {
        console.log(`📦 Need to download ${cacheStatus.missing} missing animation assets for retry`);
        downloadResult = await universalAssetPreloader.downloadGameAnimationAssets(
          response.data,
          onDownloadProgress,
          onAnimationProgress
        );

        if (!downloadResult.success) {
          console.warn('⚠️ Animation download failed on retry, but continuing with game...');
        } else {
          console.log(`✅ All animations downloaded successfully on retry: ${downloadResult.downloaded}/${downloadResult.total}`);
        }
      } else {
        console.log('✅ All animations already cached for retry');
      }

      const gameStateWithCache = universalAssetPreloader.transformGameStateWithCache(response.data);

      return {
        ...gameStateWithCache,
        downloadStats: downloadResult 
      };
    } catch (error) {
      console.error(`Failed to retry level ${levelId}:`, error);
      throw error;
    }
  },

  // Enhanced unified game state extraction
  extractUnifiedGameState: (responseData, isSubmission = false) => {
    try {
      if (!responseData) {
        console.warn('⚠️ No response data found');
        return null;
      }

      // Base game state structure
      const gameState = {
        level: {
          level_id: responseData.level?.level_id || null,
          level_number: responseData.level?.level_number || null,
          level_difficulty: responseData.level?.level_difficulty || null,
          level_title: responseData.level?.level_title || null,
          content: responseData.level?.content || null,
        },
        
        enemy: {
          enemy_id: responseData.enemy?.enemy_id || null,
          enemy_name: responseData.enemy?.enemy_name || null,
          enemy_health: responseData.enemy?.enemy_health || null,
          enemy_damage: responseData.enemy?.enemy_damage || null,
          enemy_max_health: responseData.enemy?.enemy_health,
          enemy_idle: responseData.enemy?.enemy_idle || null,
          enemy_run: responseData.enemy?.enemy_run || null,
          enemy_attack: responseData.enemy?.enemy_attack || null,
          enemy_hurt: responseData.enemy?.enemy_hurt || null,
          enemy_dies: responseData.enemy?.enemy_dies || null,
        },
        
        selectedCharacter: {
          character_id: responseData.character?.character_id || null,
          name: responseData.character?.character_name || null,
          current_health: responseData.character?.character_health || null,
          max_health: responseData.character?.character_health || null,
          damage: responseData.character?.character_damage || [],
          character_idle: responseData.character?.character_idle || null,
          character_run: responseData.character?.character_run || null,
          character_attack: responseData.character?.character_attack || [],
          character_hurt: responseData.character?.character_hurt || null,
          character_dies: responseData.character?.character_dies || null
        },
        
        energy: responseData.energy || 0,
        timeToNextEnergyRestore: responseData.timeToNextEnergyRestore || null,
        currentChallenge: null,
        submissionResult: null
      };

      // Extract challenge data
      const challengeSource = isSubmission ? responseData.nextChallenge : responseData.currentChallenge;
      if (challengeSource) {
        let options = [];
        if (Array.isArray(challengeSource.options)) {
          options = challengeSource.options.filter(option => 
            option !== null && 
            option !== undefined && 
            String(option).trim().length > 0
          );
        } else if (typeof challengeSource.options === 'string') {
          options = challengeSource.options.split(',')
            .map(option => option.trim())
            .filter(option => option.length > 0);
        }

        let correctAnswer = [];
        if (Array.isArray(challengeSource.correct_answer)) {
          correctAnswer = challengeSource.correct_answer;
        } else if (challengeSource.correct_answer) {
          correctAnswer = [challengeSource.correct_answer];
        }

        gameState.currentChallenge = {
          id: challengeSource.challenge_id,
          question: challengeSource.question,
          options: options,
          correctAnswer: correctAnswer,
          challenge_type: challengeSource.challenge_type,
          timeLimit: challengeSource.timeLimit || challengeSource.timer,
          timeRemaining: challengeSource.timeRemaining,
          timer: challengeSource.timer,
          title: challengeSource.title,
          description: challengeSource.description,
          hint: challengeSource.hint,
          pointsReward: challengeSource.points_reward,
          coinsReward: challengeSource.coins_reward,
          guide: challengeSource.guide,
          testCases: challengeSource.test_cases || [],
          expected_output: challengeSource.expected_output
        };
      }

      // Handle submission data
      if (isSubmission) {
        gameState.submissionResult = {
          isCorrect: responseData.isCorrect || false,
          attempts: responseData.attempts || 0,
          message: responseData.message,
          
          fightResult: responseData.fightResult ? {
            status: responseData.fightResult.status,
            timer: responseData.fightResult.timer,
            energy: responseData.fightResult.energy,
            timeToNextEnergyRestore: responseData.fightResult.timeToNextEnergyRestore,
            
            character: responseData.fightResult.character ? {
              character_id: responseData.fightResult.character.character_id,
              character_name: responseData.fightResult.character.character_name,
              character_idle: responseData.fightResult.character.character_idle,
              character_run: responseData.fightResult.character.character_run,
              character_attack_type: responseData.fightResult.character.character_attack_type,
              character_attack: responseData.fightResult.character.character_attack,
              character_hurt: responseData.fightResult.character.character_hurt,
              character_dies: responseData.fightResult.character.character_dies,
              character_damage: responseData.fightResult.character.character_damage,
              character_health: responseData.fightResult.character.character_health,
              character_max_health: responseData.fightResult.character.character_max_health,
            } : null,
            
            enemy: responseData.fightResult.enemy ? {
              enemy_id: responseData.fightResult.enemy.enemy_id,
              enemy_name: responseData.fightResult.enemy.enemy_name,
              enemy_idle: responseData.fightResult.enemy.enemy_idle,
              enemy_run: responseData.fightResult.enemy.enemy_run,
              enemy_attack: responseData.fightResult.enemy.enemy_attack,
              enemy_hurt: responseData.fightResult.enemy.enemy_hurt,
              enemy_dies: responseData.fightResult.enemy.enemy_dies,
              enemy_damage: responseData.fightResult.enemy.enemy_damage,
              enemy_health: responseData.fightResult.enemy.enemy_health,
              enemy_max_health: responseData.fightResult.enemy.enemy_max_health,
            } : null,
          } : null,
          
          levelStatus: responseData.levelStatus ? {
            isCompleted: responseData.levelStatus.isCompleted || false,
            battleWon: responseData.levelStatus.battleWon || false,
            battleLost: responseData.levelStatus.battleLost || false,
            canProceed: responseData.levelStatus.canProceed || false,
            showFeedback: responseData.levelStatus.showFeedback || false,
            playerHealth: responseData.levelStatus.playerHealth || 0,
            enemyHealth: responseData.levelStatus.enemyHealth || 0,
            coinsEarned: responseData.levelStatus.coinsEarned || 0
          } : null,

        completionRewards: responseData.completionRewards ? {
            feedbackMessage: responseData.completionRewards.feedbackMessage || null,
            currentTotalPoints: responseData.completionRewards.currentTotalPoints || 0,
            currentExpPoints: responseData.completionRewards.currentExpPoints || 0
          } : null,

        nextLevel: responseData.nextLevel ? {
            level_id: responseData.nextLevel.level_id,
            level_number: responseData.nextLevel.level_number,
            is_unlocked: responseData.nextLevel.is_unlocked || false
          } : null
        };


        // Merge fight result data back into main game state
        if (responseData.fightResult?.character?.character_health) {
          gameState.selectedCharacter.current_health = responseData.fightResult.character.character_health;
        }
        if (responseData.fightResult?.character?.character_max_health) {
          gameState.selectedCharacter.max_health = responseData.fightResult.character.character_max_health;
        }
        if (responseData.fightResult?.enemy?.enemy_health) {
          gameState.enemy.enemy_health = responseData.fightResult.enemy.enemy_health;
        }
        if (responseData.fightResult?.energy !== undefined) {
          gameState.energy = responseData.fightResult.energy;
        }
      }
      
  
      const gameStateWithCache = universalAssetPreloader.transformGameStateWithCache(gameState);
      
      console.log(`✅ Game state extracted and cached (${isSubmission ? 'submission' : 'entry'}):`, {
        hasLevel: !!gameStateWithCache.level.level_id,
        hasEnemy: !!gameStateWithCache.enemy.enemy_id,
        hasCharacter: !!gameStateWithCache.selectedCharacter.character_id,
        hasChallenge: !!gameStateWithCache.currentChallenge?.id,
        hasSubmission: !!gameStateWithCache.submissionResult,
        hasCompletionRewards: !!(isSubmission && gameStateWithCache.submissionResult?.completionRewards),
        hasNextLevel: !!(isSubmission && gameStateWithCache.submissionResult?.nextLevel)
      });
      
      return gameStateWithCache;
      
    } catch (error) {
      console.error('❌ Error extracting game state:', error);
      return null;
    }
  },

   getPlayerPotions: async (playerId) => {
    try {
      console.log(`🧪 Fetching potions for player ${playerId}...`);
      
      const response = await apiService.get(`/game/potion/${playerId}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch potions');
      }

      // Transform API response to match component structure
      const transformedPotions = response.data.map(potion => ({
        id: potion.player_potion_id,
        name: gameService.getPotionDisplayName(potion.potion_type),
        count: potion.quantity,
        image: potion.potion_url,
        type: potion.potion_type,
        description: potion.potion_description,
        price: potion.potion_price,
        player_potion_id: potion.player_potion_id,
        potion_shop_id: potion.potion_shop_id
      }));

      console.log(`🧪 Found ${transformedPotions.length} potions for player ${playerId}`);
      return { success: true, data: transformedPotions };
    } catch (error) {
      console.error(`Failed to fetch potions for player ${playerId}:`, error);
      throw error;
    }
  },

    usePotion: async (playerId, levelId, playerPotionId) => {
    try {
      console.log(`🧪 Using potion ${playerPotionId} for player ${playerId} in level ${levelId}...`);
      
      const response = await apiService.post(`/game/potion/${playerId}/${levelId}/${playerPotionId}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to use potion');
      }

      console.log(`🧪 Potion used successfully:`, response.data);
      return response;
    } catch (error) {
      console.error(`Failed to use potion ${playerPotionId}:`, error);
      throw error;
    }
  },

    getPotionDisplayName: (potionType) => {
    const typeMap = {
      'health': 'Health',
      'hint': 'Hint',
      'strength': 'Strong',
      'mana': 'Mana',
      'freeze': 'Freeze',
      'speed': 'Speed',
      'immune': 'Immune'
    };
    return typeMap[potionType] || potionType.charAt(0).toUpperCase() + potionType.slice(1);
  },
  

   getAnimationStats: () => {
    return universalAssetPreloader.getDownloadStats();
  },

  clearAnimationCache: () => {
    universalAssetPreloader.clearCategoryCache('game_animations');
  }
};