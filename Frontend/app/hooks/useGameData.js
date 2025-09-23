import { useState, useEffect } from 'react';
import { gameService } from '../services/gameService';

export const useGameData = (playerId, levelId) => {
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  const fetchGameData = async () => {
    if (!playerId || !levelId) {
      console.warn('⚠️ Missing playerId or levelId');
      setError('Missing player ID or level ID');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log(`🎮 Fetching game data for player ${playerId}, level ${levelId}`);
      const responseData = await gameService.enterLevel(playerId, levelId);
      
      // Validate response data
      if (!responseData) {
        throw new Error('No response data received');
      }
      
      // Extract challenge and game state
      const challenge = gameService.extractChallengeFromResponse(responseData);
      const state = gameService.extractGameState(responseData);
      
      // Validate extracted data
      if (!challenge) {
        throw new Error('No challenge data found in response');
      }
      
      if (!challenge.options || !Array.isArray(challenge.options)) {
        console.warn('⚠️ Challenge options are missing or invalid:', challenge.options);
        challenge.options = [];
      }
      
      setCurrentChallenge(challenge);
      setGameState(state);
      
      console.log('✅ Game data loaded successfully:', { challenge, state });
    } catch (err) {
      console.error('❌ Failed to fetch game data:', err);
      const errorMessage = err.message || 'Failed to load game data';
      setError(errorMessage);
      setCurrentChallenge(null);
      setGameState(null);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (selectedAnswers) => {
    if (!currentChallenge || !playerId || !levelId) {
      console.error('❌ Missing required data for submission');
      return { success: false, error: 'Missing required data' };
    }

    try {
      setSubmitting(true);
      setError(null);
      
      console.log(`🎯 Submitting answer for challenge ${currentChallenge.id}:`, selectedAnswers);
      
      const responseData = await gameService.submitAnswer(
        playerId, 
        levelId, 
        currentChallenge.id, 
        selectedAnswers
      );
      
      if (!responseData) {
        throw new Error('No response data received from submission');
      }

      // Extract submission result
      const result = gameService.extractSubmissionResult(responseData);
      setSubmissionResult(result);

      // Extract next challenge and update current challenge
      const nextChallenge = gameService.extractChallengeFromResponse(responseData);
      if (nextChallenge) {
        console.log(`🔄 Moving to next challenge: ${nextChallenge.title} (ID: ${nextChallenge.id})`);
        setCurrentChallenge(nextChallenge);
      }

      // Update game state with new data
      const updatedGameState = gameService.extractGameState(responseData);
      if (updatedGameState) {
        setGameState(updatedGameState);
      }

      console.log('✅ Answer submitted successfully:', {
        isCorrect: result?.isCorrect,
        nextChallengeId: nextChallenge?.id,
        nextChallengeTitle: nextChallenge?.title
      });

      return { 
        success: true, 
        result, 
        nextChallenge,
        updatedGameState 
      };

    } catch (err) {
      console.error('❌ Failed to submit answer:', err);
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

  return { 
    currentChallenge, 
    gameState, 
    loading, 
    error, 
    submitting,
    submissionResult,
    refetchGameData,
    submitAnswer 
  };
};