import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, Dimensions, ImageBackground, Text, ActivityIndicator, TouchableOpacity, ScrollView } from "react-native";
import { StatusBar } from 'expo-status-bar';
import ScreenPlay from '../app/Components/Actual Game/Screen Play/ScreenPlay';
import GameQuestions from '../app/Components/Actual Game/GameQuestions/GameQuestions';
import ThirdGrid from '../app/Components/Actual Game/Third Grid/thirdGrid';
import { useGameData } from './hooks/useGameData';
import { useLocalSearchParams, useRouter } from 'expo-router';
import CombatVSModal from './Components/Actual Game/Game Display Entrance/GameDisplayEntrance';

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
  const [selectedBlankIndex, setSelectedBlankIndex] = useState(0); // ✅ Add selected blank state

  const [showVSModal, setShowVSModal] = useState(true);

  useEffect(() => {
  if (gameState && !animationsLoading && !loading && !showVSModal) {
    setShowVSModal(true);
  }
  }, [gameState, animationsLoading, loading, showVSModal]);

  const handleVSComplete = () => {
  setShowVSModal(false);
  // Continue with normal game flow
  };


  const handleGameTabChange = useCallback((tabName) => {
    setActiveGameTab(tabName);
  }, []);

  const handleCorrectAnswer = useCallback(() => {
    setActiveGameTab('output');
  }, []);

  // ✅ Handle blank selection
  const handleBlankSelect = useCallback((blankIndex) => {
    console.log('🎯 Blank selected in GamePlay:', blankIndex);
    setSelectedBlankIndex(blankIndex);
  }, []);

  const shouldHideThirdGrid = activeGameTab === 'output' || activeGameTab === 'expected';

  // API data with properly parsed parameters
  const { 
    gameState,   
    loading, 
    error, 
    submitting,
    refetchGameData,
    submitAnswer,
    waitingForAnimation, 
    onAnimationComplete,
    animationsLoading, 
    animationProgress,
    downloadProgress,
    individualAnimationProgress,
  } = useGameData(playerId, levelId);

  const currentChallenge = gameState?.currentChallenge;
  const submissionResult = gameState?.submissionResult;

  const allowEnemyCompletionRef = useRef(null);
  const setCorrectAnswerRef = useRef(null);

  useEffect(() => {
    if (currentChallenge) {
      setSelectedAnswers([]);
      setBorderColor('white');
      setActiveGameTab('code');
      setSelectedBlankIndex(0); // ✅ Reset selected blank
    }
  }, [currentChallenge?.id]);

  const handleEnemyComplete = useCallback(() => {
    setSelectedAnswers([]);
    setBorderColor('white');
    setActiveGameTab('code');
    setSelectedBlankIndex(0); // ✅ Reset selected blank
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

  // ✅ Memoize setSelectedAnswers to prevent re-renders
  const memoizedSetSelectedAnswers = useCallback((answers) => {
    setSelectedAnswers(answers);
  }, []);

  // Loading state
  if (loading) {
    return (
      <>
        <StatusBar hidden={true} />
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading challenge...</Text>
        </View>
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

  // No challenge data
  if (!currentChallenge) {
    return (
      <>
        <StatusBar hidden={true} />
        <View style={[styles.container, styles.centerContent]}>
          <Text style={styles.errorText}>No challenge data available</Text>
          <TouchableOpacity style={styles.exitButton} onPress={handleExitGame}>
            <Text style={styles.exitText}>Exit Game</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }


  if (loading || animationsLoading) {
    return (
      <>
        <StatusBar hidden={true} />
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color="#ffffff" />
          
          {loading ? (
            <Text style={styles.loadingText}>Loading challenge...</Text>
          ) : (
            <View style={styles.downloadContainer}>
              <Text style={styles.loadingText}>Downloading animations...</Text>
              
              {/* Overall Progress */}
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
              
              {/* Individual Animation Progress */}
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
              
              {/* Download Status */}
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

     
        {/* Exit Button */}
        {/* <TouchableOpacity style={styles.exitGameButton} onPress={handleExitGame}>
          <Text style={styles.exitGameText}>←</Text>
        </TouchableOpacity> */}

        {/* ✅ Fixed Layout Structure */}
        <View style={styles.gameLayoutContainer}>
          {/* ScreenPlay - Fixed height */}
          <View style={styles.screenPlayContainer}>
            <ScreenPlay 
              gameState={gameState}
              isPaused={false}
              borderColor={borderColor}
              onEnemyComplete={handleEnemyComplete}
              currentQuestionIndex={0}
              onAllowEnemyCompletion={handleAllowEnemyCompletion}
              onSetCorrectAnswer={handleSetCorrectAnswer}
              onSubmissionAnimationComplete={onAnimationComplete}
            />
          </View>

          <View style={[
            styles.gameQuestionsContainer,
            shouldHideThirdGrid && styles.gameQuestionsContainerExpanded
          ]}>
            <GameQuestions 
              currentQuestion={currentChallenge || { timeLimit: 0 }}
              selectedAnswers={selectedAnswers}
              getBlankIndex={getBlankIndex}
              onTabChange={handleGameTabChange}
              activeTab={activeGameTab}
              onBlankSelect={handleBlankSelect} // ✅ Pass blank select handler
            />
          </View>

           {!shouldHideThirdGrid && (
            <View style={styles.thirdGridContainer}>
              <ThirdGrid 
                currentQuestion={currentChallenge || { timeLimit: 0 }}
                selectedAnswers={selectedAnswers}
                setSelectedAnswers={memoizedSetSelectedAnswers} // ✅ Use memoized setter
                currentQuestionIndex={0}
                setCurrentQuestionIndex={() => {}}
                setBorderColor={setBorderColor}
                setCorrectAnswerRef={setCorrectAnswerRef}
                getBlankIndex={getBlankIndex}
                challengeData={currentChallenge}
                submitAnswer={submitAnswer}
                submitting={submitting}
                onCorrectAnswer={handleCorrectAnswer}
                selectedBlankIndex={selectedBlankIndex} // ✅ Pass selected blank index
              />
            </View>
          )}

          {/* <CombatVSModal
          visible={showVSModal} // ✅ This will always be true now
          onComplete={handleVSComplete}
          character={gameState?.selectedCharacter}
          enemy={gameState?.enemy}
          duration={10000} // ✅ Increased duration for testing (10 seconds)
          /> */}

        </View>

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