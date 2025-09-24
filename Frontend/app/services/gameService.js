import { apiService } from './api';

export const gameService = {
  enterLevel: async (playerId, levelId) => {
    try {
      const response = await apiService.post(`/game/entryLevel/${playerId}/${levelId}`);
      console.log(`🎮 Entered level ${levelId} for player ${playerId}:`, response);
      return response.success ? response.data : response;
    } catch (error) {
      console.error(`Failed to enter level ${levelId}:`, error);
      throw error;
    }
  },
    
  
  submitAnswer: async (playerId, levelId, challengeId, selectedAnswers) => {
    try {
      const payload = {
        answer: selectedAnswers,
      };
      
      const response = await apiService.post(`/game/submit-challenge/${playerId}/${levelId}/${challengeId}`, 
        payload
      );
      
      console.log(`🎮 Submitted answer for challenge ${challengeId} in level ${levelId} for player ${playerId}:`, response);
      return response.success ? response.data : response;
    } catch (error) {
      console.error(`Failed to submit answer for challenge ${challengeId}:`, error);
      throw error;
    }
  },

 extractChallengeFromResponse: (responseData) => {
    try {
      const challenge = responseData.nextChallenge || responseData.currentChallenge;
      
      if (!challenge) {
        console.warn('⚠️ No challenge found in response data');
        return null;
      }
      
      console.log(`📋 Extracting challenge: ${challenge.title || 'Unnamed Challenge'}`);
      
      // Ensure options is always an array
      let options = [];
      if (Array.isArray(challenge.options)) {
        options = challenge.options.filter(option => 
          option !== null && 
          option !== undefined && 
          String(option).trim().length > 0
        );
      } else if (typeof challenge.options === 'string') {
        options = challenge.options.split(',')
          .map(option => option.trim())
          .filter(option => option.length > 0);
      }
      
      console.log('📋 Processed options:', options);
      
      let correctAnswer = [];
      if (Array.isArray(challenge.correct_answer)) {
        correctAnswer = challenge.correct_answer;
      } else if (challenge.correct_answer) {
        correctAnswer = [challenge.correct_answer];
      }
      
      const transformedChallenge = {
        id: challenge.challenge_id,
        question: challenge.question,
        options: options,
        correctAnswer: correctAnswer,
        challenge_type: challenge.challenge_type,
        timeLimit: challenge.timeLimit,
        timeRemaining: challenge.timeRemaining,
        timer: challenge.timer,
        title: challenge.title,
        description: challenge.description,
        hint: challenge.hint,
        pointsReward: challenge.points_reward,
        coinsReward: challenge.coins_reward,
        guide: challenge.guide,
        testCases: challenge.test_cases || []
      };
      
      console.log('✅ Challenge transformed:', transformedChallenge);
      return transformedChallenge;
      
    } catch (error) {
      console.error('❌ Error extracting challenge from response:', error);
      return null;
    }
  },

  extractSubmissionResult: (responseData) => {
    try {
      if (!responseData) {
        console.warn('⚠️ No response data found');
        return null;
      }

      const result = {
        isCorrect: responseData.isCorrect || false,
        attempts: responseData.attempts || 0,

        fightResult: 
        {
          status: responseData.fightResult?.status,
          charHealth: responseData.fightResult?.charHealth,
          enemyHealth: responseData.fightResult?.enemyHealth,
          enemyMaxHealth: responseData.fightResult?.enemyMaxHealth,
          attackType: responseData.fightResult?.attackType,
          damage: responseData.fightResult?.damage,
          attackUrl: responseData.fightResult?.attackUrl,
          enemyAttackUrl: responseData.fightResult?.enemyAttackUrl,
          enemyHurtUrl: responseData.fightResult?.enemyHurtUrl,
          characterHurtUrl: responseData.fightResult?.characterHurtUrl,
          characterDiesUrl: responseData.fightResult?.characterDiesUrl,
          enemyDiesUrl: responseData.fightResult?.enemyDiesUrl,
          characterIdle: responseData.fightResult?.character_idle,
          enemyIdle: responseData.fightResult?.enemy_idle,
          timer: responseData.fightResult?.timer,
          energy: responseData.fightResult?.energy,
          timeToNextEnergyRestore: responseData.fightResult?.timeToNextEnergyRestore
        },
        message: responseData.message,
        levelStatus: {
          isCompleted: responseData.levelStatus?.isCompleted || false,
          battleWon: responseData.levelStatus?.battleWon || false,
          battleLost: responseData.levelStatus?.battleLost || false,
          canProceed: responseData.levelStatus?.canProceed || false,
          showFeedback: responseData.levelStatus?.showFeedback || false,
          playerHealth: responseData.levelStatus?.playerHealth || 0,
          enemyHealth: responseData.levelStatus?.enemyHealth || 0,
          enemyMaxHealth: responseData.levelStatus?.enemyMaxHealth || 0,
          playerMaxHealth: responseData.levelStatus?.playerMaxHealth || 0
        },
        nextLevel: responseData.nextLevel || null,
        energy: responseData.energy || 0,
        timeToNextEnergyRestore: responseData.timeToNextEnergyRestore || null
      };


      
      console.log('✅ Submission result extracted:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Error extracting submission result:', error);
      return null;
    }
  },

  // Extract game state from API response - UPDATED to include all attributes
  extractGameState: (responseData) => {
    try {
      if (!responseData) {
        console.warn('⚠️ No response data found');
        return null;
      }

      const gameState = {
        // Level information
        level: {
          level_id: responseData.level?.level_id || null,
          level_number: responseData.level?.level_number || null,
          level_difficulty: responseData.level?.level_difficulty || null,
          level_title: responseData.level?.level_title || null,
          content: responseData.level?.content || null,
        },
        
        // Enemy information
        enemy: {
          enemy_id: responseData.enemy?.enemy_id || null,
          enemy_health: responseData.enemy?.enemy_health || null,
          enemy_idle: responseData.enemy?.enemy_idle || null,
        },
        
        // Selected character information
        selectedCharacter: {
          character_id: responseData.selectedCharacter?.character_id || null,
          name: responseData.selectedCharacter?.name || null,
          current_health: responseData.selectedCharacter?.current_health || null,
          max_health: responseData.selectedCharacter?.max_health || null,
          damage: responseData.selectedCharacter?.damage || [],
          character_idle: responseData.selectedCharacter?.character_idle || null,
        },
        
        // Energy and timing
        energy: responseData.energy || 0,
        timeToNextEnergyRestore: responseData.timeToNextEnergyRestore || null,
        
        // Fight result data if available
        fightResult: responseData.fightResult || null,
        levelStatus: responseData.levelStatus || null
      };
      
      console.log('✅ Game state extracted with all attributes:', gameState);
      return gameState;
      
    } catch (error) {
      console.error('❌ Error extracting game state:', error);
      return null;
    }
  }
};