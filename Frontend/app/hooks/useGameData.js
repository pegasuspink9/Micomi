import { useState, useEffect, useCallback, useRef } from 'react';
import { gameService } from '../services/gameService';

export const useGameData = (playerId, levelId) => {
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [waitingForAnimation, setWaitingForAnimation] = useState(false);
  const [canProceed, setCanProceed] = useState(false);

  //potions states
  const [potions, setPotions] = useState([]);
  const [selectedPotion, setSelectedPotion] = useState(null);
  const [loadingPotions, setLoadingPotions] = useState(false);
  const [usingPotion, setUsingPotion] = useState(false);


  
  const [animationsLoading, setAnimationsLoading] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState({ loaded: 0, total: 0, progress: 0, currentUrl: '' });
  const [individualAnimationProgress, setIndividualAnimationProgress] = useState({ url: '', progress: 0 });


  const pendingSubmissionRef = useRef(null);
  const animationTimeoutRef = useRef(null);

   const handleDownloadProgress = useCallback((progress) => {
    setDownloadProgress({
      ...progress,
      currentUrl: progress.currentAsset?.name || progress.currentUrl?.slice(-30) || ''
    });
    console.log(`📥 Download progress: ${progress.loaded}/${progress.total} (${Math.round(progress.progress * 100)}%)`);
  }, []);

  const handleAnimationProgress = useCallback((animationProgress) => {
    setIndividualAnimationProgress({
      url: animationProgress.name || animationProgress.url?.slice(-30) || '',
      progress: animationProgress.progress || 0,
      currentIndex: animationProgress.currentIndex,
      totalAnimations: animationProgress.totalAssets || animationProgress.totalAnimations
    });
  }, []);

  const fetchGameData = async () => {
    if (!playerId || !levelId) {
      console.warn('Missing playerId or levelId');
      setError('Missing player ID or level ID');
      setLoading(false);
      setAnimationsLoading(false);
      return;
    }

    try {
      setLoading(true);
      setAnimationsLoading(true);
      setError(null);
      setDownloadProgress({ loaded: 0, total: 0, progress: 0, currentUrl: '' });
      setIndividualAnimationProgress({ url: '', progress: 0 });
      
      console.log(`🎮 Fetching game data and downloading animations for player ${playerId}, level ${levelId}`);
      
      const responseData = await gameService.enterLevel(
        playerId, 
        levelId, 
        handleAnimationProgress, // Individual animation progress
        handleDownloadProgress  // Overall download progress
      );
      
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
      console.log('🎮 Game data loaded successfully');
      
      //  Check download results
      if (responseData.downloadStats) {
        const { downloaded, total, failedUrls } = responseData.downloadStats;
        console.log(`📥 Animation download completed: ${downloaded}/${total}`);
        
        if (failedUrls && failedUrls.length > 0) {
          console.warn('⚠️ Some animations failed to download:', failedUrls);
        }
      }
      
      setAnimationsLoading(false);
      console.log('📥 All animations ready for gameplay');
      
    } catch (err) {
      console.error('Failed to fetch game data:', err);
      const errorMessage = err.message || 'Failed to load game data';
      setError(errorMessage);
      setGameState(null);
      setAnimationsLoading(false);
    } finally {
      setLoading(false);
    }
  };


const submitAnswer = async (selectedAnswers) => {
    if (!gameState?.currentChallenge || !playerId || !levelId) {
      console.error('Missing required data for submission');
      return { success: false, error: 'Missing required data' };
    }

    if (waitingForAnimation) {
      console.log('Already waiting for animation, queueing submission...');
      return { success: false, error: 'Animation in progress' };
    }

    try {
      setSubmitting(true);
      setError(null);
      setCanProceed(false); // Reset proceed state
      
      console.log(`Submitting answer for challenge ${gameState.currentChallenge.id}:`, selectedAnswers);
      
      const responseData = await gameService.submitAnswer(
        playerId, 
        levelId, 
        gameState.currentChallenge.id, 
        selectedAnswers
      );
      
      if (!responseData) {
        throw new Error('No response data received from submission');
      }

      const updatedState = gameService.extractUnifiedGameState(responseData, true);
      
      if (!updatedState) {
        throw new Error('Failed to extract updated game state from submission response');
      }

      console.log('Submission processed, starting animation sequence...');

      const challengeChanged = updatedState.currentChallenge?.id !== gameState.currentChallenge.id;
      
      console.log('🔍 Challenge check:', {
        previousId: gameState.currentChallenge.id,
        newId: updatedState.currentChallenge?.id,
        hasChanged: challengeChanged
      });

      pendingSubmissionRef.current = updatedState;
      setWaitingForAnimation(true);

      setGameState(prevState => ({
        ...prevState,
        submissionResult: updatedState.submissionResult,
        selectedCharacter: updatedState.selectedCharacter || prevState.selectedCharacter,
        enemy: updatedState.enemy || prevState.enemy,
      }));

      animationTimeoutRef.current = setTimeout(() => {
        console.warn('Animation timeout reached, proceeding anyway...');
        handleAnimationComplete();
      }, 5000);

      return { 
        success: true, 
        updatedGameState: updatedState,
        waitingForAnimation: true,
      };

    } catch (err) {
      console.error('Failed to submit answer:', err);
      const errorMessage = err.message || 'Failed to submit answer';
      setError(errorMessage);
      
      pendingSubmissionRef.current = null;
      setWaitingForAnimation(false);
      
      return { success: false, error: errorMessage };
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnimationComplete = useCallback(() => {
  console.log('Animation sequence completed, processing next challenge...');
   
  setWaitingForAnimation(false);
  
  if (animationTimeoutRef.current) {
    clearTimeout(animationTimeoutRef.current);
    animationTimeoutRef.current = null;
  }
  
  if (pendingSubmissionRef.current) {
    console.log('Processing pending submission result');
    const pendingData = pendingSubmissionRef.current;
    pendingSubmissionRef.current = null;
    
    // NEW: Check if level is completed (won)
    const levelWon = pendingData.submissionResult?.fightResult?.status === 'won' &&
                     pendingData.submissionResult?.fightResult?.enemy?.enemy_health === 0;
    
    // Check if answer was correct
    const isCorrect = pendingData.submissionResult?.isCorrect === true;
    
    console.log('🔍 Answer correctness check:', {
      isCorrect: isCorrect,
      levelWon: levelWon, // NEW: Log level won status
      submissionResult: pendingData.submissionResult
    });
    
    // Get the NEXT challenge from response
    const nextChallenge = pendingData.currentChallenge;
    // Card is at ROOT level of response, not nested in challenge
    const nextChallengeCard = pendingData.card;
    
    console.log('📸 Card info from submission response:', {
      challengeId: nextChallenge?.id,
      card: nextChallengeCard,
      isCorrect: isCorrect,
      levelWon: levelWon, // NEW: Log level won status
    });
    
    // NEW: If level is won, DON'T show proceed button
    if (levelWon) {
      console.log('🎉 Level completed! Showing completion buttons instead of proceed');
      setCanProceed(false);
      
      setGameState(prevState => ({
        ...prevState,
        submissionResult: pendingData.submissionResult,
        selectedCharacter: pendingData.selectedCharacter || prevState.selectedCharacter,
        enemy: pendingData.enemy || prevState.enemy,
        fightResult: pendingData.fightResult || prevState.fightResult,
      }));
      
      return; // Exit early - don't show proceed button
    }
    
    if (isCorrect) {
      // CORRECT: Show Proceed button (only if not level won)
      setCanProceed(true);
      
      // Update game state BUT keep current challenge - don't load next one yet
      setGameState(prevState => ({
        ...prevState,
        submissionResult: pendingData.submissionResult,
        selectedCharacter: pendingData.selectedCharacter || prevState.selectedCharacter,
        enemy: pendingData.enemy || prevState.enemy,
        fightResult: pendingData.fightResult || prevState.fightResult,
        // Store COMPLETE next challenge data with card from response
        nextChallengeData: {
          ...nextChallenge,
          card: nextChallengeCard,
          enemy: pendingData.enemy || prevState.enemy, // Preserve enemy
        },
        // DON'T SET CARD TO NULL - keep current card visible
        card: prevState.card, // Keep the current card displayed
      }));
      
      console.log('Game state updated with submission result (card stays visible)', { 
        canProceedNow: true,
        nextChallengeId: nextChallenge?.id,
        nextCard: nextChallengeCard,
      });
    } else {
      // WRONG: Automatically proceed to next challenge
      console.log('❌ Answer wrong - automatically proceeding to next challenge');
      
      setGameState(prevState => ({
        ...prevState,
        currentChallenge: nextChallenge,
        card: nextChallengeCard, // Update to new card for next challenge
        enemy: pendingData.enemy || prevState.enemy, // Preserve enemy with correct health
        selectedCharacter: pendingData.selectedCharacter || prevState.selectedCharacter,
        fightResult: pendingData.fightResult || prevState.fightResult,
        submissionResult: null,
        nextChallengeData: null,
      }));
      
      setCanProceed(false);
    }
  }
  }, []);


 const handleProceed = useCallback(async () => {
  if (!canProceed) {
    console.log('Cannot proceed - answer was not correct');
    return;
  }

  try {
    setCanProceed(false);
    setGameState(prevState => {
      const nextChallenge = prevState.nextChallengeData;
      
      if (nextChallenge) {
        console.log('User proceeding to next challenge:', {
          challengeId: nextChallenge.id,
          card: nextChallenge.card,
          enemy: nextChallenge.enemy,
        });
        
        // First clear submissionResult to trigger card display
        return {
          ...prevState,
          submissionResult: null,
          currentChallenge: nextChallenge,
          card: nextChallenge.card, // Load the card that belongs to THIS challenge
          enemy: nextChallenge.enemy || prevState.enemy,
          selectedCharacter: nextChallenge.selectedCharacter || prevState.selectedCharacter,
          fightResult: nextChallenge.fightResult || prevState.fightResult,
          nextChallengeData: null, // Clear stored next challenge data
        };
      }
      
      return prevState;
    });
    
    pendingSubmissionRef.current = null;
  } catch (err) {
    console.error('Error proceeding:', err);
    setCanProceed(true);
  }
}, [canProceed]);

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

    useEffect(() => {
    const submissionResult = gameState?.submissionResult;
    const fightResult = submissionResult?.fightResult;
    
    console.log('🎉 Level Completion Check:', {
      status: fightResult?.status, 
      enemyHealth: fightResult?.enemy?.enemy_health,
      hasCompletionRewards: !!submissionResult?.completionRewards,
      hasNextLevel: !!submissionResult?.nextLevel,
    });

    // Show completion buttons when enemy is defeated
    if (fightResult?.status === 'won' &&
        fightResult?.enemy?.enemy_health === 0) {
      
      console.log('🎉 Level completed - hiding proceed button, showing completion buttons');
      setCanProceed(false); // NEW: Explicitly set to false
      // isLevelComplete will be handled in GamePlay component
    }
  }, [gameState?.submissionResult?.fightResult]);


  const retryLevel = useCallback(async () => {
    try {
      console.log(`🔄 Starting level retry for player ${playerId}, level ${levelId}...`);
      
      setLoading(true);
      setError(null);
      setAnimationsLoading(true);
      setDownloadProgress({ loaded: 0, total: 0, progress: 0, currentUrl: null });
      setIndividualAnimationProgress({ url: null, loaded: 0, total: 0, progress: 0 });

      //  Use retryLevel instead of enterLevel for clearer logging
      const data = await gameService.retryLevel(
        playerId, 
        levelId,
        (progress) => {
          setIndividualAnimationProgress(progress);
        },
        (progress) => {
          setDownloadProgress(progress);
        }
      );
      
      if (data) {
        const extractedGameState = gameService.extractUnifiedGameState(data, false);
        if (extractedGameState) {
          setGameState(extractedGameState);
          console.log(' Level retried successfully with fresh data');
        } else {
          throw new Error('Failed to extract game state from retry response');
        }
      } else {
        throw new Error('No data received from retry level API');
      }
      
    } catch (err) {
      console.error('❌ Retry level failed:', err);
      setError(err.message || 'Failed to retry level');
    } finally {
      setLoading(false);
      setAnimationsLoading(false);
      setDownloadProgress({ loaded: 0, total: 0, progress: 0, currentUrl: null });
      setIndividualAnimationProgress({ url: null, loaded: 0, total: 0, progress: 0 });
    }
  }, [playerId, levelId]);

  const enterNextLevel = useCallback(async (playerId, nextLevelId) => {
    try {
      console.log(`🚀 Entering next level ${nextLevelId} for player ${playerId}...`);
      
      setLoading(true);
      setError(null);
      setAnimationsLoading(true);
      setDownloadProgress({ loaded: 0, total: 0, progress: 0, currentUrl: '' });
      setIndividualAnimationProgress({ url: '', progress: 0 });

      //  Use enterLevel API for next level
      const data = await gameService.enterLevel(
        playerId, 
        nextLevelId,
        handleAnimationProgress,
        handleDownloadProgress
      );
      
      if (data) {
        const extractedGameState = gameService.extractUnifiedGameState(data, false);
        if (extractedGameState) {
          setGameState(extractedGameState);
          console.log(' Next level loaded successfully');
        } else {
          throw new Error('Failed to extract game state from next level response');
        }
      } else {
        throw new Error('No data received from next level API');
      }
      
    } catch (err) {
      console.error('❌ Enter next level failed:', err);
      setError(err.message || 'Failed to load next level');
    } finally {
      setLoading(false);
      setAnimationsLoading(false);
      setDownloadProgress({ loaded: 0, total: 0, progress: 0, currentUrl: '' });
      setIndividualAnimationProgress({ url: '', progress: 0 });
    }
  }, [handleAnimationProgress, handleDownloadProgress]);

  

 const fetchPotions = useCallback(async () => {
    if (!playerId) return;
    
    try {
      setLoadingPotions(true);
      const result = await gameService.getPlayerPotions(playerId);
      setPotions(result.data || []);
      console.log('🧪 Potions loaded successfully');
    } catch (error) {
      console.error('Failed to fetch potions:', error);
      setPotions([]);
    } finally {
      setLoadingPotions(false);
    }
  }, [playerId]);

const usePotion = useCallback(async (playerPotionId) => {
  if (!playerId || !levelId || !gameState?.currentChallenge || usingPotion || waitingForAnimation) return;
  
  try {
    setUsingPotion(true);
    console.log(`🧪 Using potion ${playerPotionId}...`);
    
    const responseData = await gameService.usePotion(
      playerId, 
      levelId, 
      gameState.currentChallenge.id, 
      playerPotionId
    );
    
    if (!responseData) {
      throw new Error('No response data received from potion usage');
    }

    const updatedState = responseData;
    
    if (!updatedState) {
      throw new Error('Failed to extract updated game state from potion response');
    }

    console.log('Potion used, updating game state directly...');

     setGameState(prevState => ({
      ...updatedState,
      submissionResult: {
        ...updatedState.submissionResult,
        isCorrect: true,
        isPotionUsage: true,
      },
  }));

    setPotions(prev => prev.map(potion => 
      potion.player_potion_id === playerPotionId 
        ? { ...potion, count: Math.max(0, potion.count - 1) }
        : potion
    ));
    
    setSelectedPotion(null);
    console.log(`🧪 Potion used: ${playerPotionId}`);
    return { success: true, data: updatedState };
  } catch (error) {
    console.error('Failed to use potion:', error);
    return { success: false, error: error.message };
  } finally {
    setUsingPotion(false);
  }
}, [playerId, levelId, gameState?.currentChallenge, usingPotion, waitingForAnimation, gameService]);



  const selectPotion = useCallback((potion) => {
    setSelectedPotion(potion);
    console.log('🧪 Potion selected:', potion.name);
  }, []);

  const clearSelectedPotion = useCallback(() => {
    setSelectedPotion(null);
  }, []);

   useEffect(() => {
    fetchPotions();
  }, [fetchPotions]);






    const refetchGameData = () => {
    pendingSubmissionRef.current = null;
    setWaitingForAnimation(false);
    setAnimationsLoading(true);
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
    
    fetchGameData();
  };

  return { 
    gameState,
    currentChallenge: gameState?.currentChallenge || null,
    submissionResult: gameState?.submissionResult || null,
    
    loading, 
    error, 
    submitting,
    waitingForAnimation,
    canProceed,
    
    animationsLoading,
    downloadProgress,       
    individualAnimationProgress, 
    retryLevel,
    enterNextLevel,
    
    refetchGameData: fetchGameData,
    submitAnswer,
    onAnimationComplete: handleAnimationComplete,
    handleProceed,

    //potions
    potions,
    selectedPotion,
    loadingPotions,
    usingPotion,
    usePotion,
    selectPotion,
    clearSelectedPotion,
    fetchPotions,
  };
};