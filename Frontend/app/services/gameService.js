import { apiService } from './api';
import { animationPreloader } from './animationPreloader';

export const gameService = {
   enterLevel: async (playerId, levelId, onAnimationProgress = null, onDownloadProgress = null) => {
    try {
      console.log(`🎮 Entering level ${levelId} for player ${playerId}...`);
      
      // Load cached animations on first call
      await animationPreloader.loadCachedAnimations();
      
      const response = await apiService.post(`/game/entryLevel/${playerId}/${levelId}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to enter level');
      }

      console.log(`🎮 Level ${levelId} data received, starting forced animation download...`);
      
      // ✅ FORCE download all animations before proceeding
      const downloadResult = await animationPreloader.downloadAllAnimations(
        response.data,
        onDownloadProgress,
        onAnimationProgress
      );

      if (!downloadResult.success) {
        console.warn('⚠️ Animation download failed, but continuing with game...');
      } else {
        console.log(`✅ All animations downloaded successfully: ${downloadResult.downloaded}/${downloadResult.total}`);
      }

      return {
        ...response.data,
        downloadStats: downloadResult // Include download info in response
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
      
      // ✅ Don't preload animations on submission - they should already be loaded from entry
      console.log('🎬 Skipping animation preload on submission - using cached animations');
      
      return response.success ? response.data : response;
    } catch (error) {
      console.error(`❌ Failed to submit answer:`, error);
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
          
          nextLevel: responseData.nextLevel || null
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
      
      console.log(`✅ Game state extracted (${isSubmission ? 'submission' : 'entry'}):`, {
        hasLevel: !!gameState.level.level_id,
        hasEnemy: !!gameState.enemy.enemy_id,
        hasCharacter: !!gameState.selectedCharacter.character_id,
        hasChallenge: !!gameState.currentChallenge?.id,
        hasSubmission: !!gameState.submissionResult
      });
      
      return gameState;
      
    } catch (error) {
      console.error('❌ Error extracting game state:', error);
      return null;
    }
  },

  // Get animation preload statistics
  getAnimationStats: () => {
    return animationPreloader.getPreloadStats();
  },

  // Clear animation cache
  clearAnimationCache: () => {
    animationPreloader.clearCache();
  }
};