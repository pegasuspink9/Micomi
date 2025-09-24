import { useState, useEffect } from 'react';
import { gameService } from '../services/gameService';

export const useGameData = (playerId, levelId) => {
  // Unified game state that contains everything
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchGameData = async () => {
    if (!playerId || !levelId) {
      console.warn('Missing playerId or levelId');
      setError('Missing player ID or level ID');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching game data for player ${playerId}, level ${levelId}`);
      const responseData = await gameService.enterLevel(playerId, levelId);
      
      if (!responseData) {
        throw new Error('No response data received');
      }
      
      const unifiedState = gameService.extractUnifiedGameState(responseData, false);
      
      if (!unifiedState) {
        throw new Error('Failed to extract game state from response');
      }

      if (!unifiedState.currentChallenge) {
        throw new Error('No challenge data found in response');
      }
      
      if (!unifiedState.currentChallenge.options || !Array.isArray(unifiedState.currentChallenge.options)) {
        console.warn('Challenge options are missing or invalid:', unifiedState.currentChallenge.options);
        unifiedState.currentChallenge.options = [];
      }
      
      setGameState(unifiedState);
      console.log('Game data loaded successfully:', unifiedState);
    } catch (err) {
      console.error('Failed to fetch game data:', err);
      const errorMessage = err.message || 'Failed to load game data';
      setError(errorMessage);
      setGameState(null);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (selectedAnswers) => {
    if (!gameState?.currentChallenge || !playerId || !levelId) {
      console.error('Missing required data for submission');
      return { success: false, error: 'Missing required data' };
    }

    try {
      setSubmitting(true);
      setError(null);
      
      console.log(`DEBUG: Submitting answer for challenge ${gameState.currentChallenge.id}:`, selectedAnswers);
      console.log('DEBUG: Selected answers type:', typeof selectedAnswers);
      console.log('DEBUG: Selected answers is array:', Array.isArray(selectedAnswers));
      console.log('DEBUG: Selected answers length:', selectedAnswers?.length);
      
      // Use only the existing API service - no direct fetch calls
      const responseData = await gameService.submitAnswer(
        playerId, 
        levelId, 
        gameState.currentChallenge.id, 
        selectedAnswers
      );
      
      if (!responseData) {
        throw new Error('No response data received from submission');
      }

      // Extract unified game state (submission response)
      const updatedState = gameService.extractUnifiedGameState(responseData, true);
      
      if (!updatedState) {
        throw new Error('Failed to extract updated game state from submission response');
      }

      // Update the complete game state
      setGameState(updatedState);

      console.log('Answer submitted successfully:', {
        isCorrect: updatedState.submissionResult?.isCorrect,
        nextChallengeId: updatedState.currentChallenge?.id,
        nextChallengeTitle: updatedState.currentChallenge?.title,
        characterHealth: updatedState.selectedCharacter?.current_health,
        enemyHealth: updatedState.enemy?.enemy_health,
        fightStatus: updatedState.submissionResult?.fightResult?.status
      });

      return { 
        success: true, 
        updatedGameState: updatedState
      };

    } catch (err) {
      console.error('Failed to submit answer:', err);
      const errorMessage = err.message || 'Failed to submit answer';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchGameData();
  }, [playerId, levelId]);

  const refetchGameData = () => {
    fetchGameData();
  };

  // Convenience accessors for backward compatibility
  const currentChallenge = gameState?.currentChallenge || null;
  const submissionResult = gameState?.submissionResult || null;

  return { 
    // Main unified state
    gameState,
    
    // Convenience accessors (for backward compatibility)
    currentChallenge,
    submissionResult,
    
    // Status flags
    loading, 
    error, 
    submitting,
    
    // Actions
    refetchGameData,
    submitAnswer
  };
};