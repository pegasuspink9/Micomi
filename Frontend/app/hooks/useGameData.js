import { useState, useEffect, useCallback, useRef } from 'react';
import { gameService } from '../services/gameService';

export const useGameData = (playerId, levelId) => {
  // Unified game state that contains everything
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [waitingForAnimation, setWaitingForAnimation] = useState(false);

  // Refs for managing submission queue
  const pendingSubmissionRef = useRef(null);
  const animationTimeoutRef = useRef(null);

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

  // Handle animation completion and proceed with next challenge
  const handleAnimationComplete = useCallback(() => {
    console.log('Animation sequence completed, processing next challenge...');
    
    setWaitingForAnimation(false);
    
    // Clear any existing timeout
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
    
    // Process any pending submission data
    if (pendingSubmissionRef.current) {
      console.log('Processing pending submission result');
      const pendingData = pendingSubmissionRef.current;
      pendingSubmissionRef.current = null;
      
      // Update game state with the pending submission result
      setGameState(pendingData);
      
      console.log('Game state updated with submission result:', {
        challengeId: pendingData.currentChallenge?.id,
        challengeTitle: pendingData.currentChallenge?.title,
        playerHealth: pendingData.selectedCharacter?.current_health,
        enemyHealth: pendingData.enemy?.enemy_health,
      });
    }
  }, []);

  const submitAnswer = async (selectedAnswers) => {
    if (!gameState?.currentChallenge || !playerId || !levelId) {
      console.error('Missing required data for submission');
      return { success: false, error: 'Missing required data' };
    }

    // If we're already waiting for an animation, queue this submission
    if (waitingForAnimation) {
      console.log('Already waiting for animation, queueing submission...');
      return { success: false, error: 'Animation in progress' };
    }

    try {
      setSubmitting(true);
      setError(null);
      
      console.log(`Submitting answer for challenge ${gameState.currentChallenge.id}:`, selectedAnswers);
      console.log('Selected answers type:', typeof selectedAnswers);
      console.log('Selected answers is array:', Array.isArray(selectedAnswers));
      console.log('Selected answers length:', selectedAnswers?.length);
      
      // Use only the existing API service
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

      console.log('Submission processed, starting animation sequence...');

      // Store the pending data and set animation wait flag
      pendingSubmissionRef.current = updatedState;
      setWaitingForAnimation(true);

      // Update game state with submission result to trigger animations
      setGameState(prevState => ({
        ...prevState,
        submissionResult: updatedState.submissionResult,
        currentChallenge: prevState.currentChallenge,
      }));

      // Fallback timeout in case animation callback doesn't fire
      animationTimeoutRef.current = setTimeout(() => {
        console.warn('Animation timeout reached, proceeding anyway...');
        handleAnimationComplete();
      }, 5000); // 5 second fallback

      console.log('Animation sequence started:', {
        isCorrect: updatedState.submissionResult?.isCorrect,
        playerHealth: updatedState.selectedCharacter?.current_health,
        enemyHealth: updatedState.enemy?.enemy_health,
      });

      return { 
        success: true, 
        updatedGameState: updatedState,
        waitingForAnimation: true,
      };

    } catch (err) {
      console.error('Failed to submit answer:', err);
      const errorMessage = err.message || 'Failed to submit answer';
      setError(errorMessage);
      
      // Clear any pending data on error
      pendingSubmissionRef.current = null;
      setWaitingForAnimation(false);
      
      return { success: false, error: errorMessage };
    } finally {
      setSubmitting(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    fetchGameData();
  }, [playerId, levelId]);

  const refetchGameData = () => {
    // Clear any pending data
    pendingSubmissionRef.current = null;
    setWaitingForAnimation(false);
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
    
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
    waitingForAnimation,
    
    // Actions
    refetchGameData,
    submitAnswer,
    onAnimationComplete: handleAnimationComplete, // Pass this to ScreenPlay
  };
};