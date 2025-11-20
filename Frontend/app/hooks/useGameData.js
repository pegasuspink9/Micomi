import { useState, useEffect, useCallback, useRef } from 'react';
import { gameService } from '../services/gameService';

export const useGameData = (playerId, initialLevelId) => {
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
  const lastProcessedSubmissionRef = useRef(null);

  const [currentLevelId, setCurrentLevelId] = useState(initialLevelId);
  const skipNextFetchRef = useRef(false); 


  useEffect(() => {
    if (initialLevelId) setCurrentLevelId(initialLevelId);
  }, [initialLevelId]);



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

    const targetLevelId = currentLevelId || initialLevelId;
    
    if (!playerId || !targetLevelId) {
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
      
     console.log(`🎮 Fetching game data and downloading animations for player ${playerId}, level ${targetLevelId}`);
      
      const responseData = await gameService.enterLevel(
        playerId, 
        targetLevelId, 
        handleAnimationProgress,
        handleDownloadProgress
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
     if (!gameState?.currentChallenge || !playerId || !currentLevelId) {
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
      setCanProceed(false);
      
      console.log(`Submitting answer for challenge ${gameState.currentChallenge.id}:`, selectedAnswers);
      
      const responseData = await gameService.submitAnswer(
        playerId, 
        currentLevelId, 
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
  
  if (!pendingSubmissionRef.current) {
    console.log('⚠️ No pending submission - skipping animation complete handling');
    return;
  }

  console.log('Processing pending submission result');
  const pendingData = pendingSubmissionRef.current;

  //  FIX: Use challenge ID + timestamp for unique submission IDs
  const submissionId = `${pendingData.currentChallenge?.id || 'unknown'}-${Date.now()}-${pendingData.submissionResult?.fightResult?.character?.character_health}-${pendingData.submissionResult?.fightResult?.enemy?.enemy_health}`;

  if (lastProcessedSubmissionRef.current === submissionId) {
    console.log('⚠️ Submission already processed - skipping duplicate handling');
    pendingSubmissionRef.current = null;
    return;
  }

  const levelWon = pendingData.submissionResult?.fightResult?.status === 'won' && 
                   pendingData.submissionResult?.fightResult?.enemy?.enemy_health === 0;

  const levelLost = pendingData.submissionResult?.fightResult?.status === 'lost' && 
                    pendingData.submissionResult?.fightResult?.character?.character_health === 0;
  
  const isCorrect = pendingData.submissionResult?.isCorrect === true;
  
  console.log('🔍 Answer correctness check:', {
    isCorrect: isCorrect,
    levelLost: levelLost,
    levelWon: levelWon,
    hasNextChallenge: !!pendingData.currentChallenge?.id,
    nextChallengeId: pendingData.currentChallenge?.id,
    submissionId: submissionId,
  });

  const nextChallenge = pendingData.currentChallenge;
  const nextChallengeCard = pendingData.card;

  console.log('📸 Card info from submission response:', {
    challengeId: nextChallenge?.id,
    card: nextChallengeCard,
    isCorrect: isCorrect,
    levelWon: levelWon,
  });

  // CRITICAL: Handle level lost FIRST
  if (levelLost) {
    console.log('💀 Level lost! Clearing pending ref and exiting');
    lastProcessedSubmissionRef.current = submissionId;
    setCanProceed(false);
    
    setGameState(prevState => ({
      ...prevState,
      submissionResult: pendingData.submissionResult,
      selectedCharacter: pendingData.selectedCharacter || prevState.selectedCharacter,
      enemy: pendingData.enemy || prevState.enemy,
      fightResult: pendingData.fightResult || prevState.fightResult,
    }));
    
    pendingSubmissionRef.current = null;
    console.log('💀 Level lost handling complete - exiting handler');
    return;
  }

  // CRITICAL: Handle level won SECOND
  if (levelWon) {
    console.log('🎉 Level won! Clearing pending ref and exiting');
    lastProcessedSubmissionRef.current = submissionId;
    setCanProceed(false);
    
    setGameState(prevState => ({
      ...prevState,
      submissionResult: pendingData.submissionResult,
      selectedCharacter: pendingData.selectedCharacter || prevState.selectedCharacter,
      enemy: pendingData.enemy || prevState.enemy,
      fightResult: pendingData.fightResult || prevState.fightResult,
    }));
    
    pendingSubmissionRef.current = null;
    console.log('🎉 Level won handling complete - exiting handler');
    return;
  }

  // Handle correct answer
  if (isCorrect) {
    //  Check if this is the LAST challenge (no next challenge)
    if (!nextChallenge || !nextChallenge.id) {
      console.log(' No next challenge available - this was the final challenge');
      console.log('🎉 All challenges completed! Setting canProceed for level completion');
      
      lastProcessedSubmissionRef.current = submissionId;
      setCanProceed(true);  //  Allow proceeding to level completion screen
      
      //  CLEAR ANIMATIONS - No next challenge, so null the current challenge to stop animations
      setGameState(prevState => ({
        ...prevState,
        submissionResult: pendingData.submissionResult,
        selectedCharacter: pendingData.selectedCharacter || prevState.selectedCharacter,
        enemy: pendingData.enemy || prevState.enemy,
        fightResult: pendingData.fightResult || prevState.fightResult,
        currentChallenge: null, //  Clear current challenge to prevent animation redisplay
        nextChallengeData: null, //  Ensure no next challenge data
      }));
      
      pendingSubmissionRef.current = null;
      return;
    }
    
    lastProcessedSubmissionRef.current = submissionId;
    console.log(' Proceeding to next challenge after correct answer');
    setCanProceed(true);
    
    setGameState(prevState => ({
      ...prevState,
      submissionResult: pendingData.submissionResult,
      selectedCharacter: pendingData.selectedCharacter || prevState.selectedCharacter,
      enemy: pendingData.enemy || prevState.enemy,
      fightResult: pendingData.fightResult || prevState.fightResult,
      nextChallengeData: {
        ...nextChallenge,
        card: nextChallengeCard,
        enemy: pendingData.enemy || prevState.enemy,
      },
      card: prevState.card,
    }));
  } else {
    // Wrong answer - proceed to next challenge
    if (!nextChallenge || !nextChallenge.id) {
      console.log('⚠️ No next challenge available after wrong answer - clearing animations');
      
      //  CLEAR ANIMATIONS - No next challenge available
      setGameState(prevState => ({
        ...prevState,
        currentChallenge: null, //  Clear current challenge
        nextChallengeData: null, //  Clear next challenge data
      }));
      
      pendingSubmissionRef.current = null;
      return;
    }

    lastProcessedSubmissionRef.current = submissionId; 
    console.log('❌ Wrong answer - proceeding to next challenge');
    setGameState(prevState => ({
      ...prevState,
      currentChallenge: nextChallenge,
      card: nextChallengeCard, 
      enemy: pendingData.enemy || prevState.enemy,
      selectedCharacter: pendingData.selectedCharacter || prevState.selectedCharacter,
      fightResult: pendingData.fightResult || prevState.fightResult,
      submissionResult: null,
      nextChallengeData: null,
    }));
    
    setCanProceed(false);
  }
  
  pendingSubmissionRef.current = null;
}, []);

  const handleProceed = useCallback(async () => {
    if (!canProceed) {
      console.log('Cannot proceed yet');
      return;
    }

    const nextChallengeData = gameState?.nextChallengeData;

    if (!nextChallengeData) {
      console.log(' All challenges completed! Level finished');
      return;
    }

    console.log('Proceeding to next challenge:', nextChallengeData.id);
    
    setCanProceed(false);
    setGameState(prevState => ({
      ...prevState,
      currentChallenge: nextChallengeData,
      card: nextChallengeData.card,
      submissionResult: null,
      nextChallengeData: null,
    }));
  }, [canProceed, gameState?.nextChallengeData]);

  const retryLevel = useCallback(async () => {
    try {
      console.log(`🔄 Starting level retry for player ${playerId}, level ${currentLevelId}...`); 

      setLoading(true);
      pendingSubmissionRef.current = null;
      setWaitingForAnimation(false);
      lastProcessedSubmissionRef.current = null;
      
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
      
      await fetchGameData();
    } catch (err) {
      console.error('❌ Retry failed:', err);
      setError(err.message || 'Failed to retry level');
    } finally {
      setLoading(false);
    }
  }, [playerId, currentLevelId]);

  const enterNextLevel = useCallback(async (nextLevelId) => {
    try {
      console.log(`🚀 Entering next level ${nextLevelId} for player ${playerId}...`);
      
      setLoading(true);
      setError(null);
      setAnimationsLoading(true);
      setDownloadProgress({ loaded: 0, total: 0, progress: 0, currentUrl: '' });
      setIndividualAnimationProgress({ url: '', progress: 0 });

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


          skipNextFetchRef.current = true; 
          setCurrentLevelId(nextLevelId);

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
  }, [playerId, handleAnimationProgress, handleDownloadProgress]);

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
     if (!playerId || !currentLevelId || !gameState?.currentChallenge || usingPotion || waitingForAnimation) return;
    
    try {
      setUsingPotion(true);
      console.log(`🧪 Using potion ${playerPotionId}...`);
      
      const responseData = await gameService.usePotion(
        playerId, 
        currentLevelId, 
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
  }, [playerId, currentLevelId, gameState?.currentChallenge, usingPotion, waitingForAnimation]);

  const selectPotion = useCallback((potion) => {
    setSelectedPotion(potion);
    console.log('🧪 Potion selected:', potion.name);
  }, []);

    useEffect(() => {
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }
    fetchGameData();
  }, [playerId, currentLevelId]);


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
    
    refetchGameData,
    submitAnswer,
    onAnimationComplete: handleAnimationComplete,
    handleProceed,

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