import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Animated, ImageBackground, Text, ActivityIndicator, TouchableOpacity, ScrollView } from "react-native";
import ScreenPlay from '../Components/Actual Game/Screen Play/ScreenPlay';
import GameQuestions from '../Components/Actual Game/GameQuestions/GameQuestions';
import ThirdGrid from '../Components/Actual Game/Third Grid/thirdGrid';
import LevelModal from '../Components/Actual Game/Level Intro and Outro/LevelModal';
import { useGameData } from '../hooks/useGameData';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LeaderBoard({ route }) {
  const { playerId = 11, levelId = 1 } = route?.params || {};

  // Game state
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [currentQuestionIndex] = useState(0);
  const [borderColor, setBorderColor] = useState('white');
  const [activeGameTab, setActiveGameTab] = useState('code');


  const [showModal, setShowModal] = useState(true);

  const startGame = (levelData) => {
    console.log('🎮 Starting game with level data:', levelData);
    setShowModal(false);
  };


  const handleGameTabChange = (tabName) => {
    setActiveGameTab(tabName);
  };

  const handleCorrectAnswer = () => {
    setActiveGameTab('output');
  };

  const shouldHideThirdGrid = activeGameTab === 'output' || activeGameTab === 'expected';

  // Debug interface state
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // API data
  const { 
    gameState,   
    loading, 
    error, 
    submitting,
    refetchGameData,
    submitAnswer,
    waitingForAnimation, 
    onAnimationComplete
  } = useGameData(playerId, levelId);

  const currentChallenge = gameState?.currentChallenge;
  const submissionResult = gameState?.submissionResult;

  const allowEnemyCompletionRef = useRef(null);
  const setCorrectAnswerRef = useRef(null);

  const currentQuestion = currentChallenge || {
    timeLimit: 0
  };

  useEffect(() => {
    if (currentChallenge) {
      setSelectedAnswers([]);
      setBorderColor('white');
      setActiveGameTab('code');
    }
  }, [currentChallenge?.id]);

  const handleEnemyComplete = useCallback(() => {
    setSelectedAnswers([]);
    setBorderColor('white');
    setActiveGameTab('code');
  }, []);

  const handleAllowEnemyCompletion = useCallback((allowCompletionFn) => {
    allowEnemyCompletionRef.current = allowCompletionFn;
  }, []);

  const handleSetCorrectAnswer = useCallback((setCorrectAnswerFn) => {
    setCorrectAnswerRef.current = setCorrectAnswerFn;
  }, []);

  const getBlankIndex = (lineIndex, partIndex) => {
    let blankIndex = 0;
    const lines = currentQuestion.question?.split('\n') || [];
    for (let i = 0; i < lineIndex; i++) {
      blankIndex += (lines[i].match(/_/g) || []).length;
    }
    blankIndex += partIndex;
    return blankIndex;
  };

  // Render unified debug - same as before
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
            <Text style={styles.debugText}>Number: {gameState.level?.level_number}</Text>
            <Text style={styles.debugText}>Content: {gameState.level?.content}</Text>
          </View>

          <View style={styles.debugSection}>
            <Text style={styles.debugSubtitle}>👤 Character</Text>
            <Text style={styles.debugText}>ID: {gameState.selectedCharacter?.character_id}</Text>
            <Text style={styles.debugText}>Name: {gameState.selectedCharacter?.name}</Text>
            <Text style={styles.debugText}>
              Health: {gameState.selectedCharacter?.current_health}
            </Text>
            <Text style={styles.debugText}>
              Max Health: {gameState.selectedCharacter?.max_health}
            </Text>
            <Text style={styles.debugText}>
              Damage: {JSON.stringify(gameState.selectedCharacter?.damage)}
            </Text>
            <Text style={styles.debugText}>Character Idle:</Text>
              {gameState.selectedCharacter?.character_idle ? (
                <ImageBackground
                  source={{ uri: gameState.selectedCharacter.character_idle }}
                  style={{ width: 60, height: 60, marginTop: 4 }}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.debugText}>No Idle Image</Text>
              )}

             <Text style={styles.debugText}>Character Hurt:</Text>
              {(() => {
                const hurtImageUrl = gameState.submissionResult?.fightResult?.character?.character_hurt || 
                                    gameState.selectedCharacter?.character_hurt;
                
                return hurtImageUrl ? (
                  <ImageBackground
                    source={{ uri: hurtImageUrl }}
                    style={{ width: 60, height: 60, marginTop: 4 }}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={styles.debugText}>No Hurt Image</Text>
                );
              })()}
            <Text style={styles.debugText}>Character Hurt URL: {gameState.submissionResult?.fightResult?.character?.character_hurt}</Text>
            <Text style={styles.debugText}>Character Attack URL: {gameState.submissionResult?.fightResult?.character?.character_attack}</Text>
          </View>

          <View style={styles.debugSection}>
            <Text style={styles.debugSubtitle}>👹 Enemy</Text>
            <Text style={styles.debugText}>ID: {gameState.enemy?.enemy_id}</Text>
            <Text style={styles.debugText}>Name: {gameState.enemy?.enemy_name}</Text>
            <Text style={styles.debugText}>Health: {gameState.enemy?.enemy_health}</Text>
            <Text style={styles.debugText}>Damage: {gameState.enemy?.enemy_damage}</Text>
             <Text style={styles.debugText}>Enemy Idle:</Text>
              {gameState.enemy?.enemy_idle ? (
                <ImageBackground
                  source={{ uri: gameState.enemy.enemy_idle }}
                  style={{ width: 60, height: 60, marginTop: 4 }}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.debugText}>No Idle Image</Text>
              )}
            <Text style={styles.debugText}>
              {gameState.enemy?.enemy_attack ? (
                <ImageBackground
                  source={{ uri: gameState.enemy?.enemy_attack }}
                  style={{ width: 60, height: 60, marginTop: 4 }}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.debugText}>No Attack Image</Text>
              )}
            </Text>

            <Text style={styles.debugText}>Enemy Hurt URL:
                {gameState.enemy?.enemy_hurt ? (
                <ImageBackground
                  source={{ uri: gameState.enemy?.enemy_hurt }}
                  style={{ width: 60, height: 60, marginTop: 4 }}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.debugText}>No Hurt Image</Text>
              )}
            </Text>
          </View>

          <View style={styles.debugSection}>
            <Text style={styles.debugSubtitle}>🎯 Challenge</Text>
            <Text style={styles.debugText}>ID: {gameState.currentChallenge?.id}</Text>
            <Text style={styles.debugText}>Title: {gameState.currentChallenge?.title}</Text>
            <Text style={styles.debugText}>Type: {gameState.currentChallenge?.challenge_type}</Text>
            <Text style={styles.debugText}>Description: {gameState.currentChallenge?.description}</Text>
            <Text style={styles.debugText}>Hint: {gameState.currentChallenge?.hint}</Text>
            <Text style={styles.debugText}>Points: {gameState.currentChallenge?.pointsReward}</Text>
            <Text style={styles.debugText}>Coins: {gameState.currentChallenge?.coinsReward}</Text>
            <Text style={styles.debugText}>Timer: {gameState.currentChallenge?.timer}</Text>
            <Text style={styles.debugText}>Options: {JSON.stringify(gameState.currentChallenge?.options)}</Text>
            <Text style={styles.debugText}>Correct Answer: {JSON.stringify(gameState.currentChallenge?.correctAnswer)}</Text>
          </View>

          <View style={styles.debugSection}>
            <Text style={styles.debugSubtitle}>⚡ Game Status</Text>
            <Text style={styles.debugText}>Energy: {gameState.energy}</Text>
            <Text style={styles.debugText}>Time to Next Energy: {gameState.timeToNextEnergyRestore}</Text>
          </View>

          {submissionResult && (
            <View style={styles.debugSection}>
              <Text style={styles.debugSubtitle}>📊 Last Submission</Text>
              <Text style={styles.debugText}>Result: {submissionResult.isCorrect ? 'CORRECT' : 'INCORRECT'}</Text>
              <Text style={styles.debugText}>Attempts: {submissionResult.attempts}</Text>
              <Text style={styles.debugText}>Message: {submissionResult.message}</Text>
              
              {submissionResult.fightResult && (
                <>
                  <Text style={styles.debugText}>Fight Status: {submissionResult.fightResult.status}</Text>
                  <Text style={styles.debugText}>Fight Timer: {submissionResult.fightResult.timer}</Text>
                  <Text style={styles.debugText}>Fight Energy: {submissionResult.fightResult.energy}</Text>
                </>
              )}
              
              {submissionResult.levelStatus && (
                <>
                  <Text style={styles.debugText}>Level Completed: {submissionResult.levelStatus.isCompleted ? 'Yes' : 'No'}</Text>
                  <Text style={styles.debugText}>Battle Won: {submissionResult.levelStatus.battleWon ? 'Yes' : 'No'}</Text>
                  <Text style={styles.debugText}>Coins Earned: {submissionResult.levelStatus.coinsEarned}</Text>
                </>
              )}
            </View>
          )}
        </>
      ) : (
        <Text style={styles.debugText}>No game state available</Text>
      )}
    </ScrollView>
  );

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Loading challenge...</Text>
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
      </View>
    );
  }

  // No challenge data
  if (!currentChallenge) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>No challenge data available</Text>
      </View>
    );
  }

  return (
    <ImageBackground 
      source={{uri: 'https://github.com/user-attachments/assets/dc83a36e-eb2e-4fa5-b4e7-0eab9ff65abc'}}
      style={styles.container}
    >
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

      <GameQuestions 
        currentQuestion={gameState?.currentChallenge || { timeLimit: 0 }}
        selectedAnswers={selectedAnswers}
        getBlankIndex={getBlankIndex}
        onTabChange={handleGameTabChange}
        activeTab={activeGameTab}
      />

      {!shouldHideThirdGrid && (
        <ThirdGrid 
          currentQuestion={gameState?.currentChallenge || { timeLimit: 0 }}
          selectedAnswers={selectedAnswers}
          setSelectedAnswers={setSelectedAnswers}
          currentQuestionIndex={0}
          setCurrentQuestionIndex={() => {}}
          setBorderColor={setBorderColor}
          setCorrectAnswerRef={setCorrectAnswerRef}
          getBlankIndex={getBlankIndex}
          challengeData={gameState?.currentChallenge}
          submitAnswer={submitAnswer}
          submitting={submitting}
          onCorrectAnswer={handleCorrectAnswer}
        />
      )}
    
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)' },
  loadingText: { color: '#fff', fontSize: 18, marginTop: 10, fontWeight: '600' },
  errorText: { color: '#ff6b6b', fontSize: 18, textAlign: 'center', marginHorizontal: 20, fontWeight: '600' },
  retryText: { color: '#4dabf7', fontSize: 16, marginTop: 10, textDecorationLine: 'underline' },

  // Debug styles
  debugToggle: { position: 'absolute', top: 50, right: 10, backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#4dabf7' },
  debugToggleText: { color: '#4dabf7', fontSize: 12, fontWeight: 'bold' },
  debugPanel: { position: 'absolute', top: 50, left: 10, right: 10, bottom: 100, backgroundColor: 'rgba(0,0,0,0.95)', borderRadius: 10, borderWidth: 1, borderColor: '#4dabf7' },
  debugHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#333' },
  debugTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  debugClose: { padding: 4 },
  debugCloseText: { color: '#ff6b6b', fontSize: 16, fontWeight: 'bold' },
  debugScrollView: { flex: 1, padding: 12 },
  debugSectionTitle: { color: '#4dabf7', fontSize: 16, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  debugSection: { marginBottom: 16, padding: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6 },
  debugSubtitle: { color: '#fbbf24', fontSize: 13, fontWeight: 'bold', marginBottom: 6 },
  debugText: { color: '#fff', fontSize: 11, marginTop: 2, lineHeight: 16 },
});