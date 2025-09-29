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
      if (!Array.isArray(selectedAnswers) || selectedAnswers.length === 0) {
        throw new Error('selectedAnswers must be a non-empty array');
      }

      if (!playerId || !levelId || !challengeId) {
        throw new Error('Missing required parameters: playerId, levelId, or challengeId');
      }

      const payload = {
        answer: selectedAnswers,
      };
      
      // ENHANCED DIAGNOSTIC LOGGING
      console.log('🔍 DETAILED SUBMIT ANSWER DIAGNOSTIC:');
      console.log('==========================================');
      console.log('  URL:', `/game/submit-challenge/${playerId}/${levelId}/${challengeId}`);
      console.log('  Full URL would be:', `http://your-server/game/submit-challenge/${playerId}/${levelId}/${challengeId}`);
      console.log('  Method: POST');
      console.log('  Headers: Content-Type: application/json');
      
      console.log('  Raw Payload Object:', payload);
      console.log('  Payload JSON String:', JSON.stringify(payload));
      console.log('  Payload JSON String Length:', JSON.stringify(payload).length);
      console.log('  Payload JSON Pretty:', JSON.stringify(payload, null, 2));
      
      console.log('  Selected Answers Analysis:');
      console.log('    - Value:', selectedAnswers);
      console.log('    - Type:', typeof selectedAnswers);
      console.log('    - Is Array:', Array.isArray(selectedAnswers));
      console.log('    - Length:', selectedAnswers?.length);
      console.log('    - Each item:');
      selectedAnswers.forEach((item, index) => {
        console.log(`      [${index}]: "${item}" (type: ${typeof item}, length: ${item?.length || 'N/A'})`);
      });
      
      console.log('  Parameters Analysis:');
      console.log('    - playerId:', playerId, '(type:', typeof playerId, ')');
      console.log('    - levelId:', levelId, '(type:', typeof levelId, ')');
      console.log('    - challengeId:', challengeId, '(type:', typeof challengeId, ')');
      
      // Create exact copy of what will be sent
      const exactPayload = JSON.parse(JSON.stringify({ answer: selectedAnswers }));
      console.log('  Exact payload that will be sent:', exactPayload);
      console.log('  Serialized exactly as sent:', JSON.stringify(exactPayload));
      
      // Show byte analysis
      const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
      console.log('  Payload byte length:', payloadBytes.length);
      console.log('  Payload first 50 bytes:', Array.from(payloadBytes.slice(0, 50)).map(b => b.toString(16)).join(' '));
      
      console.log('==========================================');
      
      // Make the API call
      console.log('🚀 Making API call...');
      const startTime = Date.now();
      
      const response = await apiService.post(`/game/submit-challenge/${playerId}/${levelId}/${challengeId}`, 
        payload
      );
      
      const endTime = Date.now();
      console.log(`✅ API call completed in ${endTime - startTime}ms`);
      console.log(`🎮 Submitted answer for challenge ${challengeId}:`, response);
      
      return response.success ? response.data : response;
    } catch (error) {
      console.error(`❌ Failed to submit answer for challenge ${challengeId}:`, error);
      
      // ENHANCED ERROR ANALYSIS
      console.log('🔍 ERROR ANALYSIS:');
      console.log('==========================================');
      console.log('  Error type:', error.constructor.name);
      console.log('  Error message:', error.message);
      
      if (error.response) {
        console.log('  Response Status:', error.response.status);
        console.log('  Response Status Text:', error.response.statusText);
        console.log('  Response Headers:', JSON.stringify(error.response.headers, null, 2));
        console.log('  Response Data:', error.response.data);
        
        // Try to get more details about the 400 error
        if (error.response.status === 400) {
          console.log('  🚨 HTTP 400 BAD REQUEST DETAILS:');
          console.log('    This means the server rejected the request format');
          console.log('    Common causes:');
          console.log('    - Invalid JSON syntax');
          console.log('    - Missing required fields');
          console.log('    - Wrong data types');
          console.log('    - Invalid parameter values');
          console.log('    - Server-side validation rules');
          
          if (error.response.data) {
            console.log('  Server error response:', error.response.data);
          }
        }
      } else if (error.request) {
        console.log('  Request Object:', error.request);
        console.log('  No response received from server');
      } else {
        console.log('  Request setup error:', error.message);
      }
      console.log('==========================================');
      
      throw error;
    }
  },

  // Test method to compare working vs failing requests
  testAnswerFormats: async (playerId, levelId, challengeId, correctAnswers, incorrectAnswers) => {
    console.log('🧪 TESTING DIFFERENT ANSWER FORMATS:');
    console.log('==========================================');
    
    const testCases = [
      { name: 'Correct answers (failing)', answers: correctAnswers },
      { name: 'Incorrect answers (working)', answers: incorrectAnswers },
      // Test variations
      { name: 'Correct as single string', answers: correctAnswers.join(',') },
      { name: 'Correct first item only', answers: [correctAnswers[0]] },
      { name: 'Incorrect first item only', answers: [incorrectAnswers[0]] },
    ];
    
    for (const testCase of testCases) {
      console.log(`\n🧪 Testing: ${testCase.name}`);
      try {
        const payload = { answer: testCase.answers };
        console.log('   Payload:', JSON.stringify(payload));
        
        // Don't actually send, just log what would be sent
        console.log('   Would send to:', `/game/submit-challenge/${playerId}/${levelId}/${challengeId}`);
        console.log('   Payload size:', JSON.stringify(payload).length, 'characters');
        
      } catch (error) {
        console.log('   Error creating payload:', error.message);
      }
    }
    console.log('==========================================');
  },

  // NEW: Unified game state extraction that handles both entry and submission responses
  extractUnifiedGameState: (responseData, isSubmission = false) => {
    try {
      if (!responseData) {
        console.warn('⚠️ No response data found');
        return null;
      }

      // Base game state structure with updated attribute names
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
          enemy_idle: responseData.enemy?.enemy_idle || null,
          enemy_max_health: responseData.enemy?.enemy_health,
        },
        
        selectedCharacter: {
          character_id: responseData.character?.character_id || null,
          name: responseData.character?.character_name || null,
          current_health: responseData.character?.character_health || null,
          max_health: responseData.character?.character_health || null,
          damage: responseData.character?.character_damage || [],
          character_idle: responseData.character?.character_idle || null,
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

      // If this is a submission response, extract submission-specific data
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
            
            // Character data from fightResult
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
            
            // Enemy data from fightResult
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

        // Merge fight result data into main character state
        if (responseData.fightResult?.character?.character_health) {
          gameState.selectedCharacter.current_health = responseData.fightResult.character.character_health;
        }

        if (responseData.fightResult?.character?.character_max_health) {
          gameState.selectedCharacter.max_health = responseData.fightResult.character.character_max_health;
        }

        if (responseData.fightResult?.character?.character_idle) {
          gameState.selectedCharacter.character_idle = responseData.fightResult.character.character_idle;
        }

        if (responseData.fightResult?.character?.character_name) {
          gameState.selectedCharacter.name = responseData.fightResult.character.character_name;
        }

        if (responseData.fightResult?.character?.character_damage) {
          gameState.selectedCharacter.damage = responseData.fightResult.character.character_damage;
        }

        // Merge fight result data into main enemy state
        if (responseData.fightResult?.enemy?.enemy_health) {
          gameState.enemy.enemy_health = responseData.fightResult.enemy.enemy_health;
        }

        if (responseData.fightResult?.enemy?.enemy_max_health) {
          gameState.enemy.enemy_max_health = responseData.fightResult.enemy.enemy_max_health;
        }

        if (responseData.fightResult?.enemy?.enemy_idle) {
          gameState.enemy.enemy_idle = responseData.fightResult.enemy.enemy_idle;
        }

        if (responseData.fightResult?.enemy?.enemy_name) {
          gameState.enemy.enemy_name = responseData.fightResult.enemy.enemy_name;
        }

        if (responseData.fightResult?.enemy?.enemy_damage) {
          gameState.enemy.enemy_damage = responseData.fightResult.enemy.enemy_damage;
        }


        // Update energy and timer from fight result if available
        if (responseData.fightResult?.energy !== undefined) {
          gameState.energy = responseData.fightResult.energy;
        }

        if (responseData.fightResult?.timeToNextEnergyRestore !== undefined) {
          gameState.timeToNextEnergyRestore = responseData.fightResult.timeToNextEnergyRestore;
        }
      }
      
      console.log(`✅ Unified game state extracted (${isSubmission ? 'submission' : 'entry'}):`, gameState);
      return gameState;
      
    } catch (error) {
      console.error('❌ Error extracting unified game state:', error);
      return null;
    }
  },

  // Legacy methods for backward compatibility
  extractChallengeFromResponse: (responseData) => {
    const gameState = gameService.extractUnifiedGameState(responseData, false);
    return gameState?.currentChallenge || null;
  },

  extractSubmissionResult: (responseData) => {
    const gameState = gameService.extractUnifiedGameState(responseData, true);
    return gameState?.submissionResult || null;
  },

  extractGameState: (responseData) => {
    return gameService.extractUnifiedGameState(responseData, false);
  }
};