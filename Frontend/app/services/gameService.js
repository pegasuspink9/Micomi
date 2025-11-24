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

      if (!response.data.enemy || !response.data.enemy.enemy_id || !response.data.enemy.enemy_name) {
        const level = response.data.level;
        if (level && level.enemy_id) {
          console.log(`🦹 Enemy data missing/invalid, fetching enemy ${level.enemy_id} for level ${levelId}`);
          try {
            const enemyResponse = await apiService.get(`/enemy/${level.enemy_id}`);
            if (enemyResponse.success && enemyResponse.data) {
              response.data.enemy = enemyResponse.data;
              console.log(`🦹 Enemy ${level.enemy_id} fetched successfully`);
            } else {
              console.warn(`⚠️ Failed to fetch enemy ${level.enemy_id}, using default`);
            }
          } catch (enemyError) {
            console.warn(`⚠️ Error fetching enemy ${level.enemy_id}:`, enemyError);
          }
        }
      }

      console.log(`🎮 Level ${levelId} data received, starting forced animation download...`);
      
      const downloadResult = await universalAssetPreloader.downloadGameAnimationAssets(
        response.data,
        onDownloadProgress,
        onAnimationProgress
      );

      if (!downloadResult.success) {
        console.warn('⚠️ Animation download failed, but continuing with game...');
      } else {
        console.log(` All animations downloaded successfully: ${downloadResult.downloaded}/${downloadResult.total}`);
      }

      //  Transform game state to use cached paths
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
      console.log(` Answer submitted in ${endTime - startTime}ms`);
      
      //  Transform response data to use cached paths
      const responseWithCache = universalAssetPreloader.transformGameStateWithCache(response.success ? response.data : response);
      
      console.log('🎬 Using cached animations for submission response');
      
      return responseWithCache;
    } catch (error) {
      console.error(`❌ Failed to submit answer:`, error);
      throw error;
    }
  },

  retryLevel: async (playerId, levelId, onAnimationProgress = null, onDownloadProgress = null) => {
    return gameService.enterLevel(playerId, levelId, onAnimationProgress, onDownloadProgress);
  },

  
    // Enhanced unified game state extraction
// Enhanced unified game state extraction
extractUnifiedGameState: (responseData, isSubmission = false) => {
  try {
    if (!responseData) {
      console.warn('⚠️ No response data found');
      return null;
    }

    //  Handle both direct and nested data structures
    const data = responseData.data || responseData;

    console.log('🖼️ Extracting card from response:', {
      rootCard: data.card,
      isSubmission: isSubmission,
      cardExists: !!data.card,
    });

    // Base game state structure
    const gameState = {
      level: {
        level_id: data.level?.level_id || responseData.level?.level_id || null,
        level_number: data.level?.level_number || responseData.level?.level_number || null,
        level_difficulty: data.level?.level_difficulty || responseData.level?.level_difficulty || null,
        level_title: data.level?.level_title || responseData.level?.level_title || null,
        content: data.level?.content || responseData.level?.content || null,
      },
      
      enemy: {
        enemy_id: data.enemy?.enemy_id || responseData.enemy?.enemy_id || null,
        enemy_name: data.enemy?.enemy_name || responseData.enemy?.enemy_name || null,
        enemy_health: data.enemy?.enemy_health || responseData.enemy?.enemy_health || null,
        enemy_damage: data.enemy?.enemy_damage || responseData.enemy?.enemy_damage || null,
        enemy_max_health: data.enemy?.enemy_health || responseData.enemy?.enemy_health,
        enemy_idle: data.enemy?.enemy_idle || responseData.enemy?.enemy_idle || null,
        enemy_run: data.enemy?.enemy_run || responseData.enemy?.enemy_run || null,
        enemy_attack: data.enemy?.enemy_attack || responseData.enemy?.enemy_attack || null,
        enemy_hurt: data.enemy?.enemy_hurt || responseData.enemy?.enemy_hurt || null,
        enemy_dies: data.enemy?.enemy_dies || responseData.enemy?.enemy_dies || null,
        enemy_avatar: data.enemy?.enemy_avatar || responseData.enemy?.enemy_avatar || null, 
      },

      avatar: {
        player: data.character?.character_avatar || responseData.character?.character_avatar || null,
        enemy: data.enemy?.enemy_avatar || responseData.enemy?.enemy_avatar || null
      },
      
      selectedCharacter: {
        character_id: data.character?.character_id || responseData.character?.character_id || null,
        character_name: data.character?.character_name || responseData.character?.character_name || null,
        current_health: data.character?.character_health || responseData.character?.character_health || null,
        max_health: data.character?.character_health || responseData.character?.character_health || null,
        character_damage: data.character?.character_damage || responseData.character?.character_damage || [],
        character_idle: data.character?.character_idle || responseData.character?.character_idle || null,
        character_run: data.character?.character_run || responseData.character?.character_run || null,
        character_attack: data.character?.character_attack || responseData.character?.character_attack || [],
        character_hurt: data.character?.character_hurt || responseData.character?.character_hurt || null,
        character_dies: data.character?.character_dies || responseData.character?.character_dies || null,
        character_avatar: data.character?.character_avatar || responseData.character?.character_avatar || null,
      },
      
      energy: data.energy || responseData.energy || 0,
      timeToNextEnergyRestore: data.timeToNextEnergyRestore || responseData.timeToNextEnergyRestore || null,
      currentChallenge: null,
      submissionResult: null,
      combat_background: data.combat_background || responseData.combat_background || null,
      // Extract card from ROOT level - it's alongside challenge data, not inside it
      card: data.card || responseData.card || {
        card_type: null,
        character_attack_card: null
      },
      versus_background: data.versus_background || responseData.versus_background || null,
    };

    // Extract challenge data
    const challengeSource = isSubmission ? responseData.nextChallenge || data.nextChallenge : responseData.currentChallenge || data.currentChallenge;
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
        question_type: data.question_type || responseData.question_type || null,
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
        expected_output: challengeSource.expected_output,
         computer_file: challengeSource.computer_file,
        computer_file_name: challengeSource.computer_file_name,
        css_file: challengeSource.css_file,
        css_file_name: challengeSource.css_file_name,
        html_file: challengeSource.html_file,
        html_file_name: challengeSource.html_file_name,
        javascript_file: challengeSource.javascript_file,
        javascript_file_name: challengeSource.javascript_file_name,
      };
    }

    // Handle submission data
    if (isSubmission) {
      const fightResult = responseData.fightResult || data.fightResult;
      const levelStatus = responseData.levelStatus || data.levelStatus;

      gameState.submissionResult = {
        isCorrect: data.isCorrect,
        message: data.message,
        fightResult: fightResult,
        levelStatus: levelStatus,
        nextLevel: responseData.nextLevel || data.nextLevel || null,
        completionRewards: responseData.completionRewards || data.completionRewards || null,
        isBonusRound: data.is_bonus_round || responseData.is_bonus_round || false,
        audio: data.audio || responseData.audio || [],
        
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
            character_avatar: responseData.fightResult.character.character_avatar
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
            enemy_avatar: responseData.fightResult?.enemy.enemy_avatar || null, 
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
          coinsEarned: responseData.completionRewards.coinsEarned || responseData.levelStatus?.coinsEarned || 0,
          currentTotalPoints: responseData.completionRewards.totalPointsEarned || 
                            responseData.levelStatus?.totalPointsEarned || 0,
          currentExpPoints: responseData.completionRewards.totalExpPointsEarned || 
                          responseData.levelStatus?.totalExpPointsEarned || 0,
        } : (responseData.levelStatus && responseData.levelStatus.isCompleted ? {
          feedbackMessage: "Level completed successfully!",
          coinsEarned: responseData.levelStatus.coinsEarned || 0,
          currentTotalPoints: responseData.levelStatus.totalPointsEarned || 0,
          currentExpPoints: responseData.levelStatus.totalExpPointsEarned || 0,
        } : null),

        nextLevel: responseData.nextLevel ? {
          level_id: responseData.nextLevel.level_id,
          level_number: responseData.nextLevel.level_number,
          is_unlocked: responseData.nextLevel.is_unlocked || false
        } : null
      };
      
      // Merge fight result data back into main game state
      if (responseData.fightResult?.character?.character_health !== undefined) {
        gameState.selectedCharacter.current_health = responseData.fightResult.character.character_health;
      }
      if (responseData.fightResult?.character?.character_max_health) {
        gameState.selectedCharacter.max_health = responseData.fightResult.character.character_max_health;
      }
      if (responseData.fightResult?.enemy?.enemy_health !== undefined) {
        gameState.enemy.enemy_health = responseData.fightResult.enemy.enemy_health;
      }
      if (responseData.fightResult?.enemy?.enemy_max_health) {
        gameState.enemy.enemy_max_health = responseData.fightResult.enemy.enemy_max_health;
      }

      if (responseData.fightResult?.energy !== undefined) {
        gameState.energy = responseData.fightResult.energy;
      }

      if (responseData.fightResult?.character?.character_avatar) {
        gameState.avatar.player = responseData.fightResult.character.character_avatar;
      }

      if (responseData.fightResult?.enemy?.enemy_avatar) {
        gameState.avatar.enemy = responseData.fightResult.enemy.enemy_avatar;
      }

      if (responseData.fightResult?.combat_background) {
        gameState.combat_background = responseData.fightResult.combat_background;
      }
    }
    
    const gameStateWithCache = universalAssetPreloader.transformGameStateWithCache(gameState);
    
    console.log(` Game state extracted (${isSubmission ? 'submission' : 'entry'}):`, {
      hasLevel: !!gameStateWithCache.level.level_id,
      hasEnemy: !!gameStateWithCache.enemy.enemy_id,
      enemyHealth: gameStateWithCache.enemy.enemy_health,
      hasCharacter: !!gameStateWithCache.selectedCharacter.character_id,
      hasChallenge: !!gameStateWithCache.currentChallenge?.id,
      card: gameStateWithCache.card,
      cardType: gameStateWithCache.card?.card_type,
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

  usePotion: async (playerId, levelId, challengeId, playerPotionId) => {
  try {
    console.log(`🧪 Using potion ${playerPotionId} for player ${playerId}, level ${levelId}, challenge ${challengeId}...`);
    
    const payload = { playerPotionId };
    
    const response = await apiService.post(
      `/game/submit-challenge/${playerId}/${levelId}/${challengeId}/use-potion`,
      payload
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to use potion');
    }
    
    const responseWithCache = universalAssetPreloader.transformGameStateWithCache(response.data);
    const extractedState = gameService.extractUnifiedGameState(responseWithCache, true);
    
    console.log(`🧪 Potion used successfully for challenge ${challengeId}`);
    return extractedState;
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
      'immune': 'Immune',
      'example': 'Example',
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