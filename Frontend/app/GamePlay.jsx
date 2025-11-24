import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, Dimensions, ImageBackground, Text, ActivityIndicator, TouchableOpacity, ScrollView, Animated } from "react-native";
import { StatusBar } from 'expo-status-bar';
import ScreenPlay from '../app/Components/Actual Game/Screen Play/ScreenPlay';
import GameQuestions from '../app/Components/Actual Game/GameQuestions/GameQuestions';
import ThirdGrid from '../app/Components/Actual Game/Third Grid/thirdGrid';
import Card from '../app/Components/Actual Game/Card/Card';
import { useGameData } from './hooks/useGameData';
import { useLocalSearchParams, useRouter } from 'expo-router';
import CombatVSModal from './Components/Actual Game/Game Display Entrance/GameDisplayEntrance';
import GameOverModal from './Components/GameOver And Win/GameOver';
import LevelCompletionModal from './Components/GameOver And Win/LevelCompletionModal';
import {soundManager} from './Components/Actual Game/Sounds/SoundManager';
import { combatSoundManager } from './Components/Actual Game/Sounds/CombatSoundManager';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function GamePlay() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Parse parameters from Expo Router
  const playerId = parseInt(params.playerId) || 11;
  const levelId = parseInt(params.levelId);
  const levelData = params.levelData ? JSON.parse(params.levelData) : null;

  
  const [thirdGridHeight, setThirdGridHeight] = useState(SCREEN_HEIGHT * 0.10);

  //  Simplified card state - only track current image URL
  const [showAttackCard, setShowAttackCard] = useState(false);
  const [previousImageUrl, setPreviousImageUrl] = useState(null);

  console.log('🎮 GamePlay component mounted with:', { 
    playerId, 
    levelId, 
    levelData: levelData ? 'Loaded' : 'None',
    rawParams: params
  });

  // Game state
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [borderColor, setBorderColor] = useState('white');
  const [activeGameTab, setActiveGameTab] = useState('code');
  const [selectedBlankIndex, setSelectedBlankIndex] = useState(0); 
  const [showVSModal, setShowVSModal] = useState(false);
  const [showGameplay, setShowGameplay] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [showLevelCompletion, setShowLevelCompletion] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isLoadingNextLevel, setIsLoadingNextLevel] = useState(false); 
  const [cardDisplaySequence, setCardDisplaySequence] = useState('modal');
  const [completionRewards, setCompletionRewards] = useState(null);
  
  const [runButtonClicked, setRunButtonClicked] = useState(false);
  const [showRunButton, setShowRunButton] = useState(true);

  const [showLevelCompletionModal, setShowLevelCompletionModal] = useState(false);
  const [isMessageVisible, setIsMessageVisible] = useState(false); 
  const [messageText, setMessageText] = useState('');
  const gameOverTimeoutRef = useRef(null);
  const hasTriggeredGameOver = useRef(false);
  const hasTriggeredLevelCompletion = useRef(false);
  const hasShownVSModalRef = useRef(false);
  const lastSubmissionKey = useRef(null); 
  const lastPlayedAudioKey = useRef(null);

  const levelCompletionTimeoutRef = useRef(null);

  const { 
    gameState,   
    loading, 
    error, 
    submitting,
    refetchGameData,
    retryLevel,
    enterNextLevel, 
    submitAnswer,
    waitingForAnimation, 
    onAnimationComplete,
    animationsLoading, 
    animationProgress,
    downloadProgress,
    individualAnimationProgress,
    canProceed,
    handleProceed,

    potions,
    selectedPotion,
    loadingPotions,
    usingPotion,
    usePotion,
    selectPotion,
    clearSelectedPotion,
  } = useGameData(playerId, levelId);

  const currentChallenge = gameState?.currentChallenge;
  const submissionResult = gameState?.submissionResult;
  const [characterRunState, setCharacterRunState] = useState(false);
  
  //  Get character attack card from gameState
  const characterAttackCard = gameState?.card?.character_attack_card;
  const cardType = gameState?.card?.card_type;

  const [isInRunMode, setIsInRunMode] = useState(false);
  const fadeOutAnimRef = useRef(new Animated.Value(1)).current;
  const fadeOutAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isInRunMode) {
      Animated.timing(fadeOutAnim, {
        toValue: 0,
        duration: 2000, 
        useNativeDriver: true,
      }).start(() => {
        fadeOutAnim.setValue(1);
        setIsInRunMode(false);
      });
    }
  }, [isInRunMode, fadeOutAnim]);

  //  SINGLE effect to handle card display on image change
  useEffect(() => {
    console.log('📸 Checking card display:', {
      currentCard: characterAttackCard,
      previousCard: previousImageUrl,
      currentChallengeId: currentChallenge?.id,
      showGameplay: showGameplay,
    });

    // Card should display when we have a valid card image that's different from previous
    if (
      characterAttackCard && 
      showGameplay && 
      !showVSModal &&
      characterAttackCard !== previousImageUrl
    ) {
      console.log('📸 NEW CARD DETECTED - Showing card');
      setCardDisplaySequence('modal');
      setShowAttackCard(true);
      setPreviousImageUrl(characterAttackCard);
    }
  }, [characterAttackCard, showGameplay, showVSModal]);

  useEffect(() => {
    const submission = gameState?.submissionResult;

    // If there's no submission or message, ensure the message is hidden.
    if (!submission || !submission.message) {
      setIsMessageVisible(false);
      return;
    }

    // Create a unique key for the submission event to prevent re-triggering on re-renders.
    const submissionKey = `${submission?.message}-${submission?.fightResult?.timer}-${submission?.audio?.[0]}`

    // If we've already processed this exact submission, do nothing.
    if (lastSubmissionKey.current === submissionKey) {
      return;
    }
    lastSubmissionKey.current = submissionKey;

     if (!submission?.message) {
      setIsMessageVisible(false);
      return;
    }

    // This function will be called to trigger the message animation.
     const showMessage = () => {
      console.log('🎬 Sync: Setting message text and triggering visibility');
      setMessageText(submission.message); 
      setIsMessageVisible(true);
    }; 

    const audioUrl = submission.audio?.[0];

    // Hide any previous message before starting the new sequence.
    setIsMessageVisible(false);
    
    // Use a short timeout to allow the UI to register the "hide" before we "show" again.
    setTimeout(() => {
      if (audioUrl) {
        console.log('🔊 Sync: Playing sound, message will show on playback start.');
        soundManager.playSequentialSounds([audioUrl], showMessage);
      } else {
        console.log('💬 Sync: No sound, showing message immediately.');
        showMessage(); // If no sound, trigger the message directly.
      }
    }, 50);

  }, [gameState?.submissionResult]);



  const handleCharacterRun = useCallback(() => {
    console.log('🏃 Character run triggered');
  
    setRunButtonClicked(true);
    setIsInRunMode(true);
    setShowRunButton(false);
    
    // Trigger the character run animation
    setCharacterRunState(true);
    
    // Set a single timer that ends the run animation and immediately shows the modal.
    levelCompletionTimeoutRef.current = setTimeout(() => {
      console.log('🏃 Character run animation completed, now showing modal.');
      setCharacterRunState(false);
      setIsInRunMode(false);
      setShowLevelCompletionModal(true);
    }, 1000); 
  }, []);
  


  useEffect(() => {
  if (isRetrying || isLoadingNextLevel) {

    if (levelCompletionTimeoutRef.current) {
      clearTimeout(levelCompletionTimeoutRef.current);
      levelCompletionTimeoutRef.current = null;
    }

    setIsInRunMode(false);
    setShowLevelCompletion(false);
    setShowLevelCompletionModal(false);
    setRunButtonClicked(false);
    setShowRunButton(false);
  }
  }, [isRetrying, isLoadingNextLevel]);

  const handleCloseAttackCard = useCallback(() => {
    console.log('📸 Closing modal card - transitioning to grid display');
    setShowAttackCard(false);
    setCardDisplaySequence('grid'); 
  }, []);

  useEffect(() => {
  if (isRetrying || isLoadingNextLevel) {
    console.log('📸 Resetting card display sequence');
    setPreviousImageUrl(null);
    setShowAttackCard(false);
    setCardDisplaySequence('none');
  }
}, [isRetrying, isLoadingNextLevel]);
  
  const allowEnemyCompletionRef = useRef(null);
  const setCorrectAnswerRef = useRef(null);
  const maxAnswers = currentChallenge ? (currentChallenge.question?.match(/_/g) || []).length : 0;

  useEffect(() => {
    if (currentChallenge) {
      setSelectedAnswers(new Array(maxAnswers).fill(null));
      setBorderColor('white');
      setActiveGameTab('code');
      setSelectedBlankIndex(0);
    }
  }, [currentChallenge?.id, maxAnswers]);

  useEffect(() => {
    if (currentChallenge && !loading && !animationsLoading && !hasShownVSModalRef.current) {
      console.log(' Challenge loaded, showing VS modal (first time only)');
      setShowVSModal(true);
      setShowGameplay(false); 
      setShowAttackCard(false);
      hasShownVSModalRef.current = true;
    }
  }, [currentChallenge?.id, loading, animationsLoading]);

  // useEffect(() => {
  //   if (currentChallenge && !loading && !animationsLoading && (isRetrying || isLoadingNextLevel)) {
  //     console.log(' Level data loaded successfully');
  //     setIsRetrying(false);
  //     setIsLoadingNextLevel(false);
  //     setShowGameOver(false);
  //     setShowLevelCompletion(false);
  //     hasTriggeredGameOver.current = false;
  //     hasTriggeredLevelCompletion.current = false;
  //     hasShownVSModalRef.current = false;
      
  //     if (gameOverTimeoutRef.current) {
  //       clearTimeout(gameOverTimeoutRef.current);
  //       gameOverTimeoutRef.current = null;
  //     }
  //   }
  // }, [currentChallenge?.id, loading, animationsLoading, isRetrying, isLoadingNextLevel]);

    useEffect(() => {
    if (currentChallenge && !loading && !animationsLoading) {
       if (hasTriggeredGameOver.current && !showGameOver) hasTriggeredGameOver.current = false;
    }
  }, [currentChallenge?.id, loading, animationsLoading, showGameOver]);



  const handlePotionPress = useCallback((potion) => {
    if (selectedPotion && selectedPotion.id === potion.id) {
      clearSelectedPotion();
      setBorderColor('white');
      console.log('🧪 Potion deselected:', potion.name);
    } else {
      selectPotion(potion);
      console.log('🧪 Potion selected:', potion.name);
    }
  }, [selectedPotion, clearSelectedPotion, selectPotion]);

  const handleVSComplete = useCallback(() => {
    console.log('handleVSComplete called, setting showVSModal to false');
    setShowVSModal(false);
    setShowGameplay(true);
  }, []);

  const handleGameTabChange = useCallback((tabName) => {
    setActiveGameTab(tabName);
    if (selectedPotion) {
      clearSelectedPotion();
    }
  }, [selectedPotion, clearSelectedPotion]);

  
    const handleBlankSelect = useCallback((blankIndex) => {
    console.log('🎯 Blank selected in GamePlay:', blankIndex);
    
    // ✅ ADDED: Toggle logic for the blank itself
    // If clicking the blank that is ALREADY selected, clear its answer
    if (selectedBlankIndex === blankIndex) {
      setSelectedAnswers(prev => {
        // Only clear if it actually has a value
        if (prev && prev[blankIndex] !== null) {
          const newArr = [...prev];
          newArr[blankIndex] = null;
          return newArr;
        }
        return prev;
      });
    }

    setSelectedBlankIndex(blankIndex);
  }, [selectedBlankIndex]);

   const interactiveTabs = ['code']; 
  const interactiveChallengeTypes = ['fill in the blank', 'code with guide', 'multiple choice'];

  const isInteractiveTabActive = interactiveTabs.includes(activeGameTab);
  const isInteractiveChallenge = currentChallenge && interactiveChallengeTypes.includes(currentChallenge.challenge_type);
  
  const shouldHideThirdGrid = !isInteractiveTabActive || !isInteractiveChallenge;


  
  const handleEnemyComplete = useCallback(() => {
    // ✅ CHANGED: Reset to array of nulls so slots exist
    setSelectedAnswers(new Array(maxAnswers).fill(null));
    setBorderColor('white'); 
    setActiveGameTab('code');
    setSelectedBlankIndex(0);
  }, [maxAnswers]);


  useEffect(() => {
    const submissionResult = gameState?.submissionResult;
    const fightResult = submissionResult?.fightResult;
    
    console.log('💀 Game Over Check:', {
      status: fightResult?.status, 
      characterHealth: fightResult?.character?.character_health,
      showGameOver: showGameOver,
      hasTriggered: hasTriggeredGameOver.current,
      isRetrying: isRetrying,
      waitingForAnimation: waitingForAnimation,
      canProceed: canProceed,
      runButtonClicked: runButtonClicked
    });
    
    if (fightResult?.status === 'lost' &&
        fightResult?.character?.character_health === 0 &&
        !hasTriggeredGameOver.current && 
        !showGameOverModal && 
        !isRetrying &&
        !waitingForAnimation) { 
      
      console.log('💀 Character died - all animations complete, showing GameOver modal');
      hasTriggeredGameOver.current = true;

      const characterName = fightResult?.character?.character_name || 'Character';
      const enemyName = fightResult?.enemy?.enemy_name || 'Enemy';

      setCompletionRewards({
        feedbackMessage: submissionResult?.completionRewards?.feedbackMessage || `${characterName} was defeated!`,
        coinsEarned: submissionResult?.completionRewards?.coinsEarned || 0,
        currentTotalPoints: submissionResult?.completionRewards?.totalPointsEarned || 0,
        currentExpPoints: submissionResult?.completionRewards?.totalExpPointsEarned || 0,
      });


      setShowGameOver(true);
      
       gameOverTimeoutRef.current = setTimeout(() => {
        console.log('💀 Showing GameOver modal after delay');
        setShowGameOverModal(true);
      }, 500);
    }
  }, [gameState?.submissionResult?.fightResult, showGameOver, isRetrying, waitingForAnimation]);

  useEffect(() => {
    if (isRetrying) {
      if (gameOverTimeoutRef.current) {
        clearTimeout(gameOverTimeoutRef.current);
        gameOverTimeoutRef.current = null;
      }
      setShowGameOver(false);
      setShowGameOverModal(false);
    }
  }, [isRetrying]);

  useEffect(() => {
    const submissionResult = gameState?.submissionResult;
    const fightResult = submissionResult?.fightResult;
    
    console.log('🎉 Level Completion Check:', {
      status: fightResult?.status, 
      enemyHealth: fightResult?.enemy?.enemy_health,
      canProceed: canProceed,
      showLevelCompletion: showLevelCompletion,
      isLoadingNextLevel: isLoadingNextLevel,
      waitingForAnimation: waitingForAnimation,
      runButtonClicked: runButtonClicked,
      showRunButton: showRunButton,
      isRetrying: isRetrying
    });

    // Show completion buttons when enemy is defeated
    if (fightResult?.status === 'won' &&
        fightResult?.enemy?.enemy_health === 0 &&
        !hasTriggeredLevelCompletion.current && 
        !showLevelCompletion && 
        !isLoadingNextLevel &&
        !waitingForAnimation &&
        !canProceed &&
        !isRetrying
      ) {
      
      console.log('🎉 Level completed - showing completion buttons');
      hasTriggeredLevelCompletion.current = true;

      setCompletionRewards({
        feedbackMessage: submissionResult?.completionRewards?.feedbackMessage || 'Congratulations!',
        coinsEarned: submissionResult?.completionRewards?.coinsEarned || 0,
        currentTotalPoints: submissionResult?.completionRewards?.totalPointsEarned || 0,
        currentExpPoints: submissionResult?.completionRewards?.totalExpPointsEarned || 0,
      });

      setShowLevelCompletion(true);
      setShowRunButton(true);
      setRunButtonClicked(false);
    
    }
  }, [gameState?.submissionResult?.fightResult, showLevelCompletion, isLoadingNextLevel, waitingForAnimation, canProceed, isRetrying]);

   useEffect(() => {
    if (runButtonClicked && !showRunButton && showLevelCompletion) {
      console.log('🎉 Modal should show now');
    }
  }, [runButtonClicked, showRunButton, showLevelCompletion]);

  const handleAnimationComplete = useCallback(() => {
    console.log('🎬 All animation sequences completed');
    onAnimationComplete?.();
  }, [onAnimationComplete]);

  const handleRetry = useCallback(async () => {
    console.log('🔄 Retrying level - calling entryLevel API to reset data...');
    
       
    if (gameOverTimeoutRef.current) {
      clearTimeout(gameOverTimeoutRef.current);
      gameOverTimeoutRef.current = null;
    }
    
    setShowGameOver(false);
    setShowGameOverModal(false);
    setShowVSModal(false);
    setShowGameplay(false);
    setShowLevelCompletion(false);
    setShowLevelCompletionModal(false);
    
    setIsRetrying(true);

    setRunButtonClicked(false);
    setShowRunButton(false); 
    

    hasTriggeredGameOver.current = false;
    hasTriggeredLevelCompletion.current = false;
    hasShownVSModalRef.current = false;

    setSelectedAnswers([]); 
    setBorderColor('white');
    setActiveGameTab('code');
    setSelectedBlankIndex(0);
    setCardDisplaySequence('modal');
    

    try{
      await retryLevel();
    } catch (error) {
      console.error('❌ Failed to retry level:', error);
    } finally {
      setIsRetrying(false);
    }
  }, [retryLevel]);

  const handleNextLevel = useCallback(async () => {
    const nextLevelId = gameState?.submissionResult?.nextLevel?.level_id;
    
    if (!nextLevelId) {
      console.error('❌ No next level ID available');
      return;
    }

    console.log(`🚀 Loading next level: ${nextLevelId}`);
    
    if (gameOverTimeoutRef.current) {
      clearTimeout(gameOverTimeoutRef.current);
      gameOverTimeoutRef.current = null;
    }
    
    setIsLoadingNextLevel(true);
    setShowVSModal(false); 
    setShowLevelCompletion(false); 
    setShowGameplay(false);
    hasTriggeredLevelCompletion.current = false;
    hasShownVSModalRef.current = false;
    soundManager.stopAllSounds();
    combatSoundManager.stopAllSounds();
    
    try {
      await enterNextLevel(nextLevelId);
      console.log(' Next level loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load next level:', error);
      setIsLoadingNextLevel(false);
    } finally {
      setIsLoadingNextLevel(false);
    }
  }, [gameState?.submissionResult?.nextLevel?.level_id, enterNextLevel]);

  const handleHome = useCallback(() => {
    console.log('🏠 Going home...');
    
    if (gameOverTimeoutRef.current) {
      clearTimeout(gameOverTimeoutRef.current);
      gameOverTimeoutRef.current = null;
    }

    if (levelCompletionTimeoutRef.current) {
      clearTimeout(levelCompletionTimeoutRef.current);
      levelCompletionTimeoutRef.current = null;
    }
    
    soundManager.stopAllSounds();
    combatSoundManager.stopAllSounds();
    setShowGameOver(false);
    setShowGameOverModal(false);
    setShowLevelCompletion(false); 
    setIsRetrying(false);
    setIsLoadingNextLevel(false);
    setRunButtonClicked(false);
    setShowRunButton(true);
    hasTriggeredGameOver.current = false;
    hasTriggeredLevelCompletion.current = false;
    router.back();
  }, [router]);

    useEffect(() => {
    return () => {
      if (levelCompletionTimeoutRef.current) {
        clearTimeout(levelCompletionTimeoutRef.current);
        levelCompletionTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (gameOverTimeoutRef.current) {
        clearTimeout(gameOverTimeoutRef.current);
        gameOverTimeoutRef.current = null;
      }
     soundManager.stopAllSounds();
     combatSoundManager.stopAllSounds();
    };
  }, []);
  

  const handleAllowEnemyCompletion = useCallback((allowCompletionFn) => {
    allowEnemyCompletionRef.current = allowCompletionFn;
  }, []);

  const handleSetCorrectAnswer = useCallback((setCorrectAnswerFn) => {
    setCorrectAnswerRef.current = setCorrectAnswerFn;
  }, []);

  const getBlankIndex = useCallback((lineIndex, partIndex) => {
    let blankIndex = 0;
    const lines = currentChallenge?.question?.split('\n') || [];
    for (let i = 0; i < lineIndex; i++) {
      blankIndex += (lines[i].match(/_/g) || []).length;
    }
    blankIndex += partIndex;
    return blankIndex;
  }, [currentChallenge?.question]);

  const handleExitGame = useCallback(() => {
    console.log('🚪 Exiting game...');
    router.back();
  }, [router]);

  const memoizedSetSelectedAnswers = useCallback((answers) => {
    setSelectedAnswers(answers);
  }, []);

    if (loading || animationsLoading || isLoadingNextLevel || isRetrying) {
    return (
      <>
        <StatusBar hidden={true} />
        <ImageBackground 
          source={{uri: 'https://github.com/user-attachments/assets/dc83a36e-eb2e-4fa5-b4e7-0eab9ff65abc'}}
          style={styles.container}  
        >

      

          <View style={[styles.container, styles.centerContent]}>
            <ActivityIndicator size="large" color="#ffffff" />
            
            {isRetrying ? (
              <Text style={styles.loadingText}>Restarting level...</Text>
            ) : isLoadingNextLevel ? (
              <Text style={styles.loadingText}>Loading next level...</Text>
            ) : loading ? (
              <Text style={styles.loadingText}>Loading challenge...</Text>
            ) : (
              <View style={styles.downloadContainer}>
                <Text style={styles.loadingText}>Downloading animations...</Text>
                
                {downloadProgress.total > 0 && (
                  <View style={styles.progressSection}>
                    <Text style={styles.progressLabel}>
                      Overall Progress: {downloadProgress.loaded}/{downloadProgress.total}
                    </Text>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { width: `${Math.round(downloadProgress.progress * 100)}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressPercentage}>
                      {Math.round(downloadProgress.progress * 100)}%
                    </Text>
                  </View>
                )}
                
                {individualAnimationProgress.url && (
                  <View style={styles.progressSection}>
                    <Text style={styles.currentAnimationText}>
                      Downloading: ...{individualAnimationProgress.url}
                    </Text>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { 
                            width: `${Math.round(individualAnimationProgress.progress * 100)}%`,
                            backgroundColor: '#4dabf7' 
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressPercentage}>
                      {Math.round(individualAnimationProgress.progress * 100)}%
                    </Text>
                  </View>
                )}
                
                {downloadProgress.currentUrl && (
                  <Text style={styles.currentUrlText}>
                    Current: ...{downloadProgress.currentUrl}
                  </Text>
                )}
                
                <Text style={styles.downloadHint}>
                  📥 Downloading animations for smooth gameplay...
                </Text>
              </View>
            )}
          </View>
        </ImageBackground>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <StatusBar hidden={true} />
        <View style={[styles.container, styles.centerContent]}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetchGameData}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exitButton} onPress={handleExitGame}>
            <Text style={styles.exitText}>Exit Game</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <>
      <StatusBar hidden={true} />

      {showVSModal && (
          <CombatVSModal
            visible={showVSModal}
            onComplete={handleVSComplete}
            selectedCharacter={gameState?.selectedCharacter}
            enemy={gameState?.enemy}
            versusBackground={gameState?.versus_background}
          />
      )}

      {showGameplay && (
      <ImageBackground 
        source={{uri: 'https://github.com/user-attachments/assets/dc83a36e-eb2e-4fa5-b4e7-0eab9ff65abc'}}
        style={styles.container}
      >
        {currentChallenge && (
          <View style={styles.gameLayoutContainer}>
            <View style={styles.screenPlayContainer}>
              <ScreenPlay 
                gameState={gameState}
                isPaused={false}
                borderColor={borderColor}
                characterRunState={characterRunState}
                onEnemyComplete={handleEnemyComplete}
                currentQuestionIndex={0}
                onAllowEnemyCompletion={handleAllowEnemyCompletion}
                onSetCorrectAnswer={handleSetCorrectAnswer}
                onSubmissionAnimationComplete={handleAnimationComplete}
                isInRunMode={isInRunMode}
                fadeOutAnim={fadeOutAnim}
                isMessageVisible={isMessageVisible}
                messageText={messageText}
              />
            </View>

          
              <GameQuestions 
                currentQuestion={currentChallenge}
                selectedAnswers={selectedAnswers}
                getBlankIndex={getBlankIndex}
                onTabChange={handleGameTabChange}
                activeTab={activeGameTab}
                selectedBlankIndex={selectedBlankIndex}
                onBlankPress={handleBlankSelect} 
                isAnswerCorrect={gameState?.submissionResult?.isCorrect}
              />

              {!shouldHideThirdGrid && (
              <View style={[styles.thirdGridContainer, { height: thirdGridHeight }]}>
                <ThirdGrid 
                  currentQuestion={currentChallenge}
                  selectedAnswers={selectedAnswers}
                  setSelectedAnswers={memoizedSetSelectedAnswers}
                  currentQuestionIndex={0}
                  setCurrentQuestionIndex={() => {}}
                  setBorderColor={setBorderColor}
                  setCorrectAnswerRef={setCorrectAnswerRef}
                  getBlankIndex={getBlankIndex}
                  challengeData={currentChallenge}
                  submitAnswer={submitAnswer}
                  submitting={submitting}
                  selectedBlankIndex={selectedBlankIndex} 
                  potions={potions}
                  selectedPotion={selectedPotion}
                  onPotionPress={handlePotionPress}
                  loadingPotions={loadingPotions}
                  usingPotion={usingPotion}
                  setThirdGridHeight={setThirdGridHeight}
                  usePotion={usePotion}
                  cardImageUrl={characterAttackCard}
                  cardDisplaySequence={cardDisplaySequence}
                  canProceed={canProceed}
                  onProceed={handleProceed}
                  isLevelComplete={showLevelCompletion}
                  showRunButton={showRunButton}
                  onCharacterRun={handleCharacterRun}
                  onHome={handleHome}
                  onRetry={handleRetry}
                  onNextLevel={handleNextLevel}
                  hasNextLevel={!!gameState?.submissionResult?.nextLevel}
                  fadeOutAnim={fadeOutAnim}
                  isInRunMode={isInRunMode}
                  setSelectedBlankIndex={setSelectedBlankIndex}
                />
              </View>
              )}


          <GameOverModal
            visible={showGameOverModal}
            onRetry={handleRetry}
            onHome={handleHome}
           characterName={gameState?.submissionResult?.fightResult?.character?.character_name || 'Character'}
            enemyName={gameState?.submissionResult?.fightResult?.enemy?.enemy_name || 'Enemy'}
            isRetrying={isRetrying} 
            completionRewards={completionRewards}
          />
            
          <LevelCompletionModal
              visible={showLevelCompletionModal && runButtonClicked && !showRunButton}
              onRetry={handleRetry}
              onHome={handleHome}
              onNextLevel={handleNextLevel}
              completionRewards={completionRewards}
              nextLevel={!!gameState?.submissionResult?.nextLevel}
              isLoading={isLoadingNextLevel}
          />
        
          </View>
        )}
      </ImageBackground>
      )}

      <Card
        visible={showAttackCard}
        imageUrl={characterAttackCard}
        cardType={cardType}
        onClose={handleCloseAttackCard}
        autoClose={true}
        autoCloseDuration={3000}
      />



    
    </>
  );
}


const styles = StyleSheet.create({
  container: { 
    flex: 1,
    paddingTop: 0,
  },
  
  gameLayoutContainer: {
    flex: 1,
    flexDirection: 'column',
  },

  screenPlayContainer: {
    height: SCREEN_HEIGHT * 0.38, 
  },

  gameQuestionsContainer: {
    flex: 1,
    minHeight: 0,
  },

   gameQuestionsContainerExpanded: {
    maxHeight: SCREEN_HEIGHT * 0.75, 
  },

  centerContent: { 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.8)' 
  },
  
  loadingText: { 
    color: '#fff', 
    fontSize: 18, 
    marginTop: 10, 
    fontWeight: '600' 
  },
  
  errorText: { 
    color: '#ff6b6b', 
    fontSize: 18, 
    textAlign: 'center', 
    marginHorizontal: 20, 
    fontWeight: '600' 
  },
  
  retryText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold', 
    textAlign: 'center' 
  },
  
  exitText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold', 
    textAlign: 'center' 
  },
  
  retryButton: {
    backgroundColor: '#4dabf7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 15,
  },
  
  exitButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10,
  },

  exitGameButton: {
    position: 'absolute',
    top: 20, 
    left: 20,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    borderWidth: 1,
    borderColor: '#4dabf7',
  },
  
  exitGameText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },

  // Debug styles
  debugToggle: { 
    position: 'absolute', 
    top: 20, //  Adjusted for status bar hidden
    right: 10, 
    backgroundColor: 'rgba(0,0,0,0.8)', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#4dabf7',
    zIndex: 999,
  },
  debugToggleText: { 
    color: '#4dabf7', 
    fontSize: 12, 
    fontWeight: 'bold' 
  },
  debugPanel: { 
    position: 'absolute', 
    top: 20, //  Adjusted for status bar hidden
    left: 10, 
    right: 10, 
    bottom: 100, 
    backgroundColor: 'rgba(0,0,0,0.95)', 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#4dabf7' 
  },
  debugHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#333' 
  },
  debugTitle: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  debugClose: { 
    padding: 4 
  },
  debugCloseText: { 
    color: '#ff6b6b', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  debugScrollView: { 
    flex: 1, 
    padding: 12 
  },
  debugText: { 
    color: '#fff', 
    fontSize: 12, 
    lineHeight: 18 
  },

  progressContainer: {
    marginTop: 20,
    alignItems: 'center',
    width: '80%',
  },
  
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: '#4dabf7',
    borderRadius: 4,
  },
  
  progressText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },

   downloadContainer: {
    alignItems: 'center',
    width: '90%',
    paddingHorizontal: 20,
  },
  
  progressSection: {
    marginTop: 20,
    alignItems: 'center',
    width: '100%',
  },
  
  progressLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  
  progressBar: {
    width: '100%',
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 6,
    transition: 'width 0.3s ease',
  },
  
  progressPercentage: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  currentAnimationText: {
    color: '#4dabf7',
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  
  currentUrlText: {
    color: '#ffeb3b',
    fontSize: 10,
    marginTop: 8,
    textAlign: 'center',
  },
  
  downloadHint: {
    color: '#fff',
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
});