import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Animated, ImageBackground, Text, ActivityIndicator, TouchableOpacity, ScrollView } from "react-native";
import ScreenPlay from '../Components/Actual Game/Screen Play/ScreenPlay';
import GameQuestions from '../Components/Actual Game/GameQuestions/GameQuestions';
import ThirdGrid from '../Components/Actual Game/Third Grid/thirdGrid';
import Drawer from '../Components/Actual Game/Drawer/Drawer';
import LevelModal from '../Components/Actual Game/Level Intro and Outro/LevelModal';
import { useGameData } from '../hooks/useGameData';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_PEEK = SCREEN_HEIGHT * 0.05;
const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.7;

export default function LeaderBoard({ route }) {
  const { playerId = 11, levelId = 1 } = route?.params || {};
  
  // Game state
  const [isOutputVisible, setIsOutputVisible] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [borderColor, setBorderColor] = useState('white');
  const [hasShownOutput, setHasShownOutput] = useState(false);
  
  // Debug interface state
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [debugTab, setDebugTab] = useState('gameState'); // 'gameState', 'submission', 'challenge'

  // API data
    const { 
    gameState,   
    loading, 
    error, 
    submitting,
    refetchGameData,
    submitAnswer 
  } = useGameData(playerId, levelId);

  const currentChallenge = gameState?.currentChallenge;
  const submissionResult = gameState?.submissionResult;

  
  const allowEnemyCompletionRef = useRef(null);
  const setCorrectAnswerRef = useRef(null);

  const translateY = useRef(new Animated.Value(DRAWER_HEIGHT - DRAWER_PEEK)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Use API challenge data or fallback to empty object
  const currentQuestion = currentChallenge || {
    timeLimit: 0
  };

  // Log all extracted game data for debugging
  useEffect(() => {
  if (gameState) {
    console.log('🔄 GAME STATE UPDATED:', {
      challengeId: gameState.currentChallenge?.id,
      challengeTitle: gameState.currentChallenge?.title,
      characterHealth: gameState.selectedCharacter?.current_health,
      enemyHealth: gameState.enemy?.enemy_health,
      isSubmissionResult: !!gameState.submissionResult,
      lastSubmissionCorrect: gameState.submissionResult?.isCorrect,
      fightStatus: gameState.submissionResult?.fightResult?.status,
      levelCompleted: gameState.submissionResult?.levelStatus?.isCompleted
    });
  }
  }, [gameState]);

  // Log submission results
  useEffect(() => {
  if (gameState?.currentChallenge) {
    console.log('🎯 CHALLENGE CHANGED:', {
      from: 'previous challenge',
      to: `${gameState.currentChallenge.title} (ID: ${gameState.currentChallenge.id})`,
      timer: gameState.currentChallenge.timer,
      timeRemaining: gameState.currentChallenge.timeRemaining
    });
    
    setSelectedAnswers([]);
    setBorderColor('white');
    setHasShownOutput(false);
    
    // Close drawer if it's open
    if (isOutputVisible) {
      setIsOutputVisible(false);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: DRAWER_HEIGHT - DRAWER_PEEK,
          useNativeDriver: false,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        })
      ]).start();
    }
  }
  }, [gameState?.currentChallenge?.id]);


  const handleEnemyComplete = useCallback((enemyIndex) => {
    console.log(`🏁 Enemy ${enemyIndex} completed for challenge ${currentChallenge?.id}`);
    
    setSelectedAnswers([]);
    setBorderColor('white');
    setHasShownOutput(false);
    
    if (isOutputVisible) {
      console.log('🔄 Auto-closing drawer for next question');
      setIsOutputVisible(false);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: DRAWER_HEIGHT - DRAWER_PEEK,
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        })
      ]).start();
    }
    
    // TODO: Implement logic to fetch next challenge or complete level
    console.log('🎉 Challenge completed! Implement next challenge logic here.');
  }, [currentChallenge, isOutputVisible, translateY, backdropOpacity]);

  const handleAllowEnemyCompletion = useCallback((allowCompletionFn) => {
    allowEnemyCompletionRef.current = allowCompletionFn;
  }, []);

  const handleSetCorrectAnswer = useCallback((setCorrectAnswerFn) => {
    setCorrectAnswerRef.current = setCorrectAnswerFn;
  }, []);

  const animateToPosition = useCallback((shouldOpen) => {
    const toValue = shouldOpen ? 0 : DRAWER_HEIGHT - DRAWER_PEEK;
    const backdropValue = shouldOpen ? 0.5 : 0;
    
    console.log(`🎭 ${shouldOpen ? 'OPENING' : 'CLOSING'} drawer`);
    console.log(`⏰ Timer will ${shouldOpen ? '🔒 FREEZE timeRemaining' : '🔄 RESUME ticking'}`);
    console.log(`🎭 Setting isOutputVisible to: ${shouldOpen}`);
    
    setIsOutputVisible(shouldOpen);
    
    if (shouldOpen && allowEnemyCompletionRef.current) {
      console.log('✅ Allowing enemy completion because drawer opened for correct answer');
      allowEnemyCompletionRef.current();
    }
    
    Animated.parallel([
      Animated.spring(translateY, {
        toValue,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
        overshootClamping: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: backdropValue,
        duration: 250,
        useNativeDriver: false,
      })
    ]).start(() => {
      console.log(`🎭 Drawer animation completed. Timer is now ${shouldOpen ? '🔒 FROZEN' : '🔄 TICKING'}`);
    });
  }, [translateY, backdropOpacity]);

  const getBlankIndex = (lineIndex, partIndex) => {
    let blankIndex = 0;
    const lines = currentQuestion.question.split('\n');
    
    for (let i = 0; i < lineIndex; i++) {
      blankIndex += (lines[i].match(/_/g) || []).length;
    }
    blankIndex += partIndex;
    
    return blankIndex;
  };

   useEffect(() => {
    if (currentChallenge) {
      setSelectedAnswers([]);
      setBorderColor('white');
      setHasShownOutput(false);
      
      // Close drawer if it's open
      if (isOutputVisible) {
        setIsOutputVisible(false);
        Animated.parallel([
          Animated.spring(translateY, {
            toValue: DRAWER_HEIGHT - DRAWER_PEEK,
            useNativeDriver: false,
          }),
          Animated.timing(backdropOpacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: false,
          })
        ]).start();
      }
    }
  }, [currentChallenge?.id]);

  // Render debug tabs
  const renderDebugTabs = () => (
    <View style={styles.debugTabs}>
      <TouchableOpacity 
        style={[styles.debugTab, debugTab === 'gameState' && styles.debugTabActive]}
        onPress={() => setDebugTab('gameState')}
      >
        <Text style={[styles.debugTabText, debugTab === 'gameState' && styles.debugTabTextActive]}>
          Game State
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.debugTab, debugTab === 'challenge' && styles.debugTabActive]}
        onPress={() => setDebugTab('challenge')}
      >
        <Text style={[styles.debugTabText, debugTab === 'challenge' && styles.debugTabTextActive]}>
          Challenge
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.debugTab, debugTab === 'submission' && styles.debugTabActive]}
        onPress={() => setDebugTab('submission')}
      >
        <Text style={[styles.debugTabText, debugTab === 'submission' && styles.debugTabTextActive]}>
          Submission
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render game state debug info
  const renderGameStateDebug = () => (
    <ScrollView style={styles.debugScrollView}>
      <Text style={styles.debugSectionTitle}>🎮 Game State</Text>
      {gameState ? (
        <>
          <View style={styles.debugSection}>
            <Text style={styles.debugSubtitle}>🏆 Level Info</Text>
            <Text style={styles.debugText}>ID: {gameState.level?.level_id}</Text>
            <Text style={styles.debugText}>Number: {gameState.level?.level_number}</Text>
            <Text style={styles.debugText}>Title: {gameState.level?.level_title}</Text>
            <Text style={styles.debugText}>Difficulty: {gameState.level?.level_difficulty}</Text>
          </View>

          <View style={styles.debugSection}>
            <Text style={styles.debugSubtitle}>👤 Character</Text>
            <Text style={styles.debugText}>ID: {gameState.selectedCharacter?.character_id}</Text>
            <Text style={styles.debugText}>Name: {gameState.selectedCharacter?.name}</Text>
            <Text style={styles.debugText}>Health: {gameState.selectedCharacter?.current_health}/{gameState.selectedCharacter?.max_health}</Text>
            <Text style={styles.debugText}>Idle URL: {gameState.selectedCharacter?.character_idle ? '✅' : '❌'}</Text>
          </View>

          <View style={styles.debugSection}>
            <Text style={styles.debugSubtitle}>👹 Enemy</Text>
            <Text style={styles.debugText}>ID: {gameState.enemy?.enemy_id}</Text>
            <Text style={styles.debugText}>Health: {gameState.enemy?.enemy_health}</Text>
            <Text style={styles.debugText}>Idle URL: {gameState.enemy?.enemy_idle ? '✅' : '❌'}</Text>
          </View>

          <View style={styles.debugSection}>
            <Text style={styles.debugSubtitle}>⚡ Resources</Text>
            <Text style={styles.debugText}>Energy: {gameState.energy}</Text>
            <Text style={styles.debugText}>Next Restore: {gameState.timeToNextEnergyRestore || 'N/A'}</Text>
          </View>
        </>
      ) : (
        <Text style={styles.debugText}>No game state available</Text>
      )}
    </ScrollView>
  );

  // Render challenge debug info
  const renderUnifiedStateDebug = () => (
  <ScrollView style={styles.debugScrollView}>
    <Text style={styles.debugSectionTitle}>🎮 Unified Game State</Text>
    {gameState ? (
      <>
        <View style={styles.debugSection}>
          <Text style={styles.debugSubtitle}>🏆 Level Info</Text>
          <Text style={styles.debugText}>ID: {gameState.level?.level_id}</Text>
          <Text style={styles.debugText}>Title: {gameState.level?.level_title}</Text>
          <Text style={styles.debugText}>Difficulty: {gameState.level?.level_difficulty}</Text>
        </View>

        <View style={styles.debugSection}>
          <Text style={styles.debugSubtitle}>👤 Character (Live Health)</Text>
          <Text style={styles.debugText}>Name: {gameState.selectedCharacter?.name}</Text>
          <Text style={styles.debugText}>
            Health: {gameState.selectedCharacter?.current_health}/{gameState.selectedCharacter?.max_health}
          </Text>
          <Text style={[
            styles.debugText, 
            { color: gameState.selectedCharacter?.current_health < gameState.selectedCharacter?.max_health ? '#f87171' : '#4ade80' }
          ]}>
            Status: {gameState.selectedCharacter?.current_health < gameState.selectedCharacter?.max_health ? 'INJURED' : 'HEALTHY'}
          </Text>
        </View>

        <View style={styles.debugSection}>
          <Text style={styles.debugSubtitle}>👹 Enemy (Live Health)</Text>
          <Text style={styles.debugText}>ID: {gameState.enemy?.enemy_id}</Text>
          <Text style={styles.debugText}>Health: {gameState.enemy?.enemy_health}</Text>
          <Text style={[
            styles.debugText, 
            { color: gameState.enemy?.enemy_health > 0 ? '#f87171' : '#4ade80' }
          ]}>
            Status: {gameState.enemy?.enemy_health > 0 ? 'ALIVE' : 'DEFEATED'}
          </Text>
        </View>

        <View style={styles.debugSection}>
          <Text style={styles.debugSubtitle}>🎯 Current Challenge</Text>
          <Text style={styles.debugText}>ID: {gameState.currentChallenge?.id}</Text>
          <Text style={styles.debugText}>Title: {gameState.currentChallenge?.title}</Text>
          <Text style={styles.debugText}>Type: {gameState.currentChallenge?.challenge_type}</Text>
          <Text style={styles.debugText}>Timer: {gameState.currentChallenge?.timer}</Text>
        </View>

        {gameState.submissionResult && (
          <View style={styles.debugSection}>
            <Text style={styles.debugSubtitle}>📊 Last Submission</Text>
            <Text style={[
              styles.debugText, 
              { color: gameState.submissionResult.isCorrect ? '#4ade80' : '#f87171' }
            ]}>
              Result: {gameState.submissionResult.isCorrect ? 'CORRECT ✅' : 'INCORRECT ❌'}
            </Text>
            <Text style={styles.debugText}>Attempts: {gameState.submissionResult.attempts}</Text>
            <Text style={styles.debugText}>Message: {gameState.submissionResult.message}</Text>
            
            {gameState.submissionResult.fightResult && (
              <>
                <Text style={styles.debugText}>Fight Status: {gameState.submissionResult.fightResult.status}</Text>
                <Text style={styles.debugText}>Damage Dealt: {gameState.submissionResult.fightResult.damage}</Text>
                <Text style={styles.debugText}>Attack Type: {gameState.submissionResult.fightResult.attackType || 'None'}</Text>
              </>
            )}
          </View>
        )}

        <View style={styles.debugSection}>
          <Text style={styles.debugSubtitle}>⚡ Resources</Text>
          <Text style={styles.debugText}>Energy: {gameState.energy}</Text>
          <Text style={styles.debugText}>Next Restore: {gameState.timeToNextEnergyRestore || 'N/A'}</Text>
        </View>

        {gameState.submissionResult?.levelStatus && (
          <View style={styles.debugSection}>
            <Text style={styles.debugSubtitle}>🏆 Level Progress</Text>
            <Text style={styles.debugText}>
              Completed: {gameState.submissionResult.levelStatus.isCompleted ? 'YES ✅' : 'NO ⏳'}
            </Text>
            <Text style={styles.debugText}>
              Battle Won: {gameState.submissionResult.levelStatus.battleWon ? 'YES 🏆' : 'NO ⚔️'}
            </Text>
            <Text style={styles.debugText}>
              Can Proceed: {gameState.submissionResult.levelStatus.canProceed ? 'YES ➡️' : 'NO ⏸️'}
            </Text>
            <Text style={styles.debugText}>
              Coins Earned: {gameState.submissionResult.levelStatus.coinsEarned || 0} 🪙
            </Text>
          </View>
        )}
      </>
    ) : (
      <Text style={styles.debugText}>No unified game state available</Text>
    )}
    </ScrollView>
  );

  // Render submission result debug info
  const renderSubmissionDebug = () => (
    <ScrollView style={styles.debugScrollView}>
      <Text style={styles.debugSectionTitle}>📊 Submission Result</Text>
      {submissionResult ? (
        <>
          <View style={styles.debugSection}>
            <Text style={styles.debugSubtitle}>✅ Result</Text>
            <Text style={[styles.debugText, { color: submissionResult.isCorrect ? '#4ade80' : '#f87171' }]}>
              Correct: {submissionResult.isCorrect ? 'YES' : 'NO'}
            </Text>
            <Text style={styles.debugText}>Attempts: {submissionResult.attempts}</Text>
            <Text style={styles.debugText}>Message: {submissionResult.message}</Text>
          </View>

          {submissionResult.fightResult && (
            <View style={styles.debugSection}>
              <Text style={styles.debugSubtitle}>⚔️ Fight Result</Text>
              <Text style={styles.debugText}>Status: {submissionResult.fightResult.status}</Text>
              <Text style={styles.debugText}>
                Character Health: {submissionResult.fightResult.charHealth}
              </Text>
              <Text style={styles.debugText}>
                Enemy Health: {submissionResult.fightResult.enemyHealth}/{submissionResult.fightResult.enemyMaxHealth}
              </Text>
              <Text style={styles.debugText}>Damage: {submissionResult.fightResult.damage}</Text>
              <Text style={styles.debugText}>Attack Type: {submissionResult.fightResult.attackType || 'None'}</Text>
              <Text style={styles.debugText}>Timer: {submissionResult.fightResult.timer}</Text>
              <Text style={styles.debugText}>Energy: {submissionResult.fightResult.energy}</Text>
            </View>
          )}

          {submissionResult.levelStatus && (
            <View style={styles.debugSection}>
              <Text style={styles.debugSubtitle}>🏆 Level Status</Text>
              <Text style={styles.debugText}>
                Completed: {submissionResult.levelStatus.isCompleted ? 'YES' : 'NO'}
              </Text>
              <Text style={styles.debugText}>
                Battle Won: {submissionResult.levelStatus.battleWon ? 'YES' : 'NO'}
              </Text>
              <Text style={styles.debugText}>
                Battle Lost: {submissionResult.levelStatus.battleLost ? 'YES' : 'NO'}
              </Text>
              <Text style={styles.debugText}>
                Can Proceed: {submissionResult.levelStatus.canProceed ? 'YES' : 'NO'}
              </Text>
              <Text style={styles.debugText}>
                Show Feedback: {submissionResult.levelStatus.showFeedback ? 'YES' : 'NO'}
              </Text>
              <Text style={styles.debugText}>
                Player Health: {submissionResult.levelStatus.playerHealth}/{submissionResult.levelStatus.playerMaxHealth}
              </Text>
              <Text style={styles.debugText}>
                Enemy Health: {submissionResult.levelStatus.enemyHealth}/{submissionResult.levelStatus.enemyMaxHealth}
              </Text>
            </View>
          )}

          <View style={styles.debugSection}>
            <Text style={styles.debugSubtitle}>🔋 Resources</Text>
            <Text style={styles.debugText}>Energy: {submissionResult.energy}</Text>
            <Text style={styles.debugText}>
              Next Energy Restore: {submissionResult.timeToNextEnergyRestore || 'N/A'}
            </Text>
            <Text style={styles.debugText}>Next Level: {submissionResult.nextLevel || 'N/A'}</Text>
          </View>
        </>
      ) : (
        <Text style={styles.debugText}>No submission result available</Text>
      )}
    </ScrollView>
  );

  // Render debug content based on active tab
  const renderDebugContent = () => {
    switch (debugTab) {
      case 'gameState':
        return renderGameStateDebug();
      case 'challenge':
        return renderChallengeDebug();
      case 'submission':
        return renderSubmissionDebug();
      default:
        return renderGameStateDebug();
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Loading challenge...</Text>
        {gameState && (
          <Text style={styles.debugText}>
            Level: {gameState.level?.level_title} | Energy: {gameState.energy}
          </Text>
        )}
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Text style={styles.retryText} onPress={refetchGameData}>
          Tap to retry
        </Text>
        {gameState && (
          <Text style={styles.debugText}>
            Character: {gameState.selectedCharacter?.name} | Health: {gameState.selectedCharacter?.current_health}/{gameState.selectedCharacter?.max_health}
          </Text>
        )}
      </View>
    );
  }

  // No challenge data
  if (!currentChallenge) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>No challenge data available</Text>
        {gameState && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>Level: {gameState.level?.level_title}</Text>
            <Text style={styles.debugText}>Character: {gameState.selectedCharacter?.name}</Text>
            <Text style={styles.debugText}>Enemy: ID {gameState.enemy?.enemy_id}</Text>
            <Text style={styles.debugText}>Energy: {gameState.energy}</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <ImageBackground 
      source={{uri: 'https://github.com/user-attachments/assets/dc83a36e-eb2e-4fa5-b4e7-0eab9ff65abc'}}
      style={styles.container}
    >
      {/* Pass gameState to ScreenPlay */}
        <ScreenPlay 
          isPaused={isOutputVisible}
          borderColor={borderColor}
          onEnemyComplete={handleEnemyComplete}
          currentQuestionIndex={0}
          onAllowEnemyCompletion={handleAllowEnemyCompletion}
          onSetCorrectAnswer={handleSetCorrectAnswer}
          gameState={gameState}
        />

       <GameQuestions 
        currentQuestion={gameState?.currentChallenge || { timeLimit: 0 }}
        selectedAnswers={selectedAnswers}
        getBlankIndex={getBlankIndex}
        />

      <ThirdGrid 
      currentQuestion={gameState?.currentChallenge || { timeLimit: 0 }}
      selectedAnswers={selectedAnswers}
      setSelectedAnswers={setSelectedAnswers}
      currentQuestionIndex={0}
      setCurrentQuestionIndex={() => {}}
      animateToPosition={animateToPosition}
      setBorderColor={setBorderColor}
      hasShownOutput={hasShownOutput}
      setHasShownOutput={setHasShownOutput}
      setCorrectAnswerRef={setCorrectAnswerRef}
      getBlankIndex={getBlankIndex}
      challengeData={gameState?.currentChallenge}
      submitAnswer={submitAnswer}
      submitting={submitting}
      />

      <Drawer
      isOutputVisible={isOutputVisible}
      translateY={translateY}
      backdropOpacity={backdropOpacity}
      animateToPosition={animateToPosition}
      currentQuestion={gameState?.currentChallenge || { timeLimit: 0 }}
      currentQuestionIndex={0} 
      questionsData={null} 
      selectedAnswers={selectedAnswers}
      challengeData={gameState?.currentChallenge}
      gameState={gameState}
      submissionResult={gameState?.submissionResult}
      />

      {/* Enhanced Debug Interface - only in development */}
      {__DEV__ && (
        <>
          {/* Debug Toggle Button */}
          <TouchableOpacity 
            style={styles.debugToggle}
            onPress={() => setShowDebugPanel(!showDebugPanel)}
          >
            <Text style={styles.debugToggleText}>
              {showDebugPanel ? '🔍 Hide Debug' : '🔍 Show Debug'}
            </Text>
          </TouchableOpacity>

          {/* Debug Panel */}
           {__DEV__ && showDebugPanel && (
            <View style={styles.debugPanel}>
              <View style={styles.debugHeader}>
                <Text style={styles.debugTitle}>🛠️ Unified Game State Debug</Text>
                <TouchableOpacity 
                  style={styles.debugClose}
                  onPress={() => setShowDebugPanel(false)}
                >
                  <Text style={styles.debugCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              {renderUnifiedStateDebug()}
            </View>
          )}
        </>
      )}

      {/* Uncomment when ready to use
      <LevelModal
        level={gameState?.level}
        visible={showLevelModal}
        onClose={() => setShowLevelModal(false)}
      />
      */}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
    marginTop: 10,
    fontWeight: '600',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 18,
    textAlign: 'center',
    marginHorizontal: 20,
    fontWeight: '600',
  },
  retryText: {
    color: '#4dabf7',
    fontSize: 16,
    marginTop: 10,
    textDecorationLine: 'underline',
  },
  debugContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 5,
  },
  
  // Enhanced Debug Interface Styles
  debugToggle: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4dabf7',
  },
  debugToggleText: {
    color: '#4dabf7',
    fontSize: 12,
    fontWeight: 'bold',
  },
  debugPanel: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    bottom: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4dabf7',
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  debugTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  debugClose: {
    padding: 4,
  },
  debugCloseText: {
    color: '#ff6b6b',
    fontSize: 16,
    fontWeight: 'bold',
  },
  debugTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  debugTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  debugTabActive: {
    backgroundColor: '#4dabf7',
  },
  debugTabText: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: '600',
  },
  debugTabTextActive: {
    color: '#ffffff',
  },
  debugScrollView: {
    flex: 1,
    padding: 12,
  },
  debugSectionTitle: {
    color: '#4dabf7',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  debugSection: {
    marginBottom: 16,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
  },
  debugSubtitle: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  debugText: {
    color: '#ffffff',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
});