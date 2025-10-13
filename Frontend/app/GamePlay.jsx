import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, Dimensions, ImageBackground, Text, ActivityIndicator, TouchableOpacity, ScrollView } from "react-native";
import { StatusBar } from 'expo-status-bar';
import ScreenPlay from '../app/Components/Actual Game/Screen Play/ScreenPlay';
import GameQuestions from '../app/Components/Actual Game/GameQuestions/GameQuestions';
import ThirdGrid from '../app/Components/Actual Game/Third Grid/thirdGrid';
import { useGameData } from './hooks/useGameData';
import { useLocalSearchParams, useRouter } from 'expo-router';
import CombatVSModal from './Components/Actual Game/Game Display Entrance/GameDisplayEntrance';
import GameOverModal from './Components/GameOver And Win/GameOver';
import LevelCompletionModal from './Components/GameOver And Win/LevelCompletionModal'; 

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function GamePlay() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Parse parameters from Expo Router
  const playerId = parseInt(params.playerId) || 11;
  const levelId = parseInt(params.levelId) || 1;
  const levelData = params.levelData ? JSON.parse(params.levelData) : null;

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
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [selectedBlankIndex, setSelectedBlankIndex] = useState(0); 
  const [showVSModal, setShowVSModal] = useState(true);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showLevelCompletion, setShowLevelCompletion] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isLoadingNextLevel, setIsLoadingNextLevel] = useState(false); 
  const gameOverTimeoutRef = useRef(null);
  const hasTriggeredGameOver = useRef(false);
  const hasTriggeredLevelCompletion = useRef(false);

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

  const allowEnemyCompletionRef = useRef(null);
  const setCorrectAnswerRef = useRef(null);

  // ✅ Reset states when new challenge loads
  useEffect(() => {
    if (currentChallenge && !loading && !animationsLoading && (isRetrying || isLoadingNextLevel)) {
      console.log('✅ Level data loaded successfully');
      setIsRetrying(false);
      setIsLoadingNextLevel(false);
      setShowGameOver(false);
      setShowLevelCompletion(false);
      hasTriggeredGameOver.current = false;
      hasTriggeredLevelCompletion.current = false;
      
      // Clear any pending timeouts
      if (gameOverTimeoutRef.current) {
        clearTimeout(gameOverTimeoutRef.current);
        gameOverTimeoutRef.current = null;
      }
    }
  }, [currentChallenge, loading, animationsLoading, isRetrying, isLoadingNextLevel]);

  const handlePotionPress = useCallback(async (potion) => {
    if (selectedPotion && selectedPotion.id === potion.id) {
      // If clicking the same potion, use it
      console.log('🧪 Using selected potion:', potion.name);
      
      const result = await usePotion(potion.player_potion_id);
      
      if (result.success) {
        console.log(`🧪 ${potion.name} potion used successfully!`);
        // Optionally show success message
      } else {
        console.error('Failed to use potion:', result.error);
        // Optionally show error message
      }
    } else {
      // Select the potion
      selectPotion(potion);
      console.log('🧪 Potion selected:', potion.name);
    }
  }, [selectedPotion, usePotion, selectPotion]);



  const handleVSComplete = () => {
    setShowVSModal(false);
  };

  const handleGameTabChange = useCallback((tabName) => {
    setActiveGameTab(tabName);
    if (selectedPotion) {
      clearSelectedPotion();
    }
  }, [selectedPotion, clearSelectedPotion]);


  const handleCorrectAnswer = useCallback(() => {
    setActiveGameTab('output');
  }, []);

  const handleBlankSelect = useCallback((blankIndex) => {
    console.log('🎯 Blank selected in GamePlay:', blankIndex);
    setSelectedBlankIndex(blankIndex);
  }, []);

  const shouldHideThirdGrid = activeGameTab === 'output' || activeGameTab === 'expected';

  useEffect(() => {
    if (currentChallenge) {
      setSelectedAnswers([]);
      setBorderColor('white');
      setActiveGameTab('code');
      setSelectedBlankIndex(0);
    }
  }, [currentChallenge?.id]);

  const handleEnemyComplete = useCallback(() => {
    setSelectedAnswers([]);
    setBorderColor('white'); 
    setActiveGameTab('code');
    setSelectedBlankIndex(0);
  }, []);

  useEffect(() => {
    if (gameState?.submissionResult?.fightResult?.status === 'lost' &&
        gameState?.submissionResult?.fightResult?.character?.character_health === 0 &&
        !hasTriggeredGameOver.current && !showGameOver && !isRetrying) {
      
      console.log('🎮 Character died - waiting for death animations to complete...');
      hasTriggeredGameOver.current = true;
      
      gameOverTimeoutRef.current = setTimeout(() => {
        console.log('🎮 Showing GameOver modal after animations');
        setShowGameOver(true);
      }, 4000);
    }
  }, [gameState?.submissionResult?.fightResult]);

  useEffect(() => {
  const submissionResult = gameState?.submissionResult;
  const fightResult = submissionResult?.fightResult;
  
  console.log('🎉 Level Completion Check:', {
    status: fightResult?.status, 
    enemyHealth: fightResult?.enemy?.enemy_health,
    hasCompletionRewards: !!submissionResult?.completionRewards,
    hasNextLevel: !!submissionResult?.nextLevel,
    hasTriggered: hasTriggeredLevelCompletion.current,
    showLevelCompletion: showLevelCompletion,
    isLoadingNextLevel: isLoadingNextLevel
  });

  // ✅ Only detect level completion, don't set timeout here
  if (fightResult?.status === 'won' &&
      fightResult?.enemy?.enemy_health === 0 &&
      !hasTriggeredLevelCompletion.current && 
      !showLevelCompletion && 
      !isLoadingNextLevel) {
    
    console.log('🎉 Level completed - enemy defeated, waiting for animations to complete...');
    console.log('🏆 Completion rewards:', submissionResult?.completionRewards);
    console.log('🚀 Next level:', submissionResult?.nextLevel);
    
    hasTriggeredLevelCompletion.current = true;
    // ✅ Remove the setTimeout - let animations complete naturally
  }
}, [gameState?.submissionResult?.fightResult, showLevelCompletion, isLoadingNextLevel]);


const handleAnimationCompletionForLevelCompletion = useCallback(() => {
  if (hasTriggeredLevelCompletion.current && !showLevelCompletion) {
    console.log('🎉 All animations completed - showing Level Completion modal');
    setShowLevelCompletion(true);
  }
}, [showLevelCompletion]);

const handleAnimationComplete = useCallback(() => {
  console.log('🎬 Animation sequence completed');
  
  if (hasTriggeredLevelCompletion.current) {
    handleAnimationCompletionForLevelCompletion();
  } else {
    onAnimationComplete?.();
  }
}, [onAnimationComplete, handleAnimationCompletionForLevelCompletion]);



  // ✅ Updated retry handler
  const handleRetry = useCallback(() => {
    console.log('🔄 Retrying level - calling entryLevel API to reset data...');
    
    if (gameOverTimeoutRef.current) {
      clearTimeout(gameOverTimeoutRef.current);
      gameOverTimeoutRef.current = null;
    }
    
    setIsRetrying(true);
    hasTriggeredGameOver.current = false;
    hasTriggeredLevelCompletion.current = false;
    retryLevel();
  }, [retryLevel]);

  // ✅ Handle next level navigation
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
    hasTriggeredLevelCompletion.current = false;
    
    try {
      await enterNextLevel(playerId, nextLevelId);
      console.log('✅ Next level loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load next level:', error);
      setIsLoadingNextLevel(false);
    }
  }, [gameState?.submissionResult?.nextLevel?.level_id, playerId, enterNextLevel]);

  const handleHome = useCallback(() => {
    console.log('🏠 Going home...');
    
    if (gameOverTimeoutRef.current) {
      clearTimeout(gameOverTimeoutRef.current);
      gameOverTimeoutRef.current = null;
    }
    
    setShowGameOver(false);
    setShowLevelCompletion(false); 
    setIsRetrying(false);
    setIsLoadingNextLevel(false);
    hasTriggeredGameOver.current = false;
    hasTriggeredLevelCompletion.current = false;
    router.back();
  }, [router]);

  // ✅ Cleanup on unmount
  useEffect(() => {
    return () => {
      if (gameOverTimeoutRef.current) {
        clearTimeout(gameOverTimeoutRef.current);
        gameOverTimeoutRef.current = null;
      }
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

  // ✅ Show loading during retry or next level loading
  if (loading || animationsLoading) {
    return (
      <>
        <StatusBar hidden={true} />
        <ImageBackground 
          source={{uri: 'https://github.com/user-attachments/assets/dc83a36e-eb2e-4fa5-b4e7-0eab9ff65abc'}}
          style={styles.container}
        >
          {/* ✅ Show modals in background if they were visible */}
          <GameOverModal
            visible={showGameOver}
            onRetry={handleRetry}
            onHome={handleHome}
            characterName={gameState?.selectedCharacter?.name || 'Character'}
            enemyName={gameState?.enemy?.enemy_name || 'Enemy'}
            isRetrying={isRetrying} 
          />

          <LevelCompletionModal
            visible={showLevelCompletion}
            onRetry={handleRetry}
            onHome={handleHome}
            onNextLevel={handleNextLevel}
            completionRewards={gameState?.submissionResult?.completionRewards}
            nextLevel={gameState?.submissionResult?.nextLevel}
            characterName={gameState?.selectedCharacter?.name || 'Character'}
            enemyName={gameState?.enemy?.enemy_name || 'Enemy'}
            isLoading={isLoadingNextLevel}
          />

          {/* ✅ Loading overlay */}
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
      <ImageBackground 
        source={{uri: 'https://github.com/user-attachments/assets/dc83a36e-eb2e-4fa5-b4e7-0eab9ff65abc'}}
        style={styles.container}
      >
        {/* ✅ GameOver Modal */}
        <GameOverModal
          visible={showGameOver}
          onRetry={handleRetry}
          onHome={handleHome}
          characterName={gameState?.selectedCharacter?.name || 'Character'}
          enemyName={gameState?.enemy?.enemy_name || 'Enemy'}
          isRetrying={isRetrying} 
        />

        {/* ✅ Level Completion Modal */}
        <LevelCompletionModal
          visible={showLevelCompletion}
          onRetry={handleRetry}
          onHome={handleHome}
          onNextLevel={handleNextLevel}
          completionRewards={gameState?.submissionResult?.completionRewards}
          nextLevel={gameState?.submissionResult?.nextLevel}
          characterName={gameState?.selectedCharacter?.name || 'Character'}
          enemyName={gameState?.enemy?.enemy_name || 'Enemy'}
          isLoading={isLoadingNextLevel}
        />

        {/* ✅ Only render game content if we have currentChallenge */}
        {currentChallenge && (
          <View style={styles.gameLayoutContainer}>
            <View style={styles.screenPlayContainer}>
              <ScreenPlay 
                gameState={gameState}
                isPaused={false}
                borderColor={borderColor}
                onEnemyComplete={handleEnemyComplete}
                currentQuestionIndex={0}
                onAllowEnemyCompletion={handleAllowEnemyCompletion}
                onSetCorrectAnswer={handleSetCorrectAnswer}
                onSubmissionAnimationComplete={handleAnimationComplete}
              />
            </View>

            <View style={[
              styles.gameQuestionsContainer,
              shouldHideThirdGrid && styles.gameQuestionsContainerExpanded
            ]}>
              <GameQuestions 
                currentQuestion={currentChallenge}
                selectedAnswers={selectedAnswers}
                getBlankIndex={getBlankIndex}
                onTabChange={handleGameTabChange}
                activeTab={activeGameTab}
                onBlankSelect={handleBlankSelect}
              />
            </View>

            {!shouldHideThirdGrid && (
              <View style={styles.thirdGridContainer}>
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
                  onCorrectAnswer={handleCorrectAnswer}
                  selectedBlankIndex={selectedBlankIndex} 
                   potions={potions}
                  selectedPotion={selectedPotion}
                  onPotionPress={handlePotionPress}
                  loadingPotions={loadingPotions}
                  usingPotion={usingPotion}
                />
              </View>
            )}
          </View>
        )}
      </ImageBackground>
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

  thirdGridContainer: {
    height: SCREEN_HEIGHT * 0.25,
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
    top: 20, // ✅ Adjusted for status bar hidden
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
    top: 20, // ✅ Adjusted for status bar hidden
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
    top: 20, // ✅ Adjusted for status bar hidden
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