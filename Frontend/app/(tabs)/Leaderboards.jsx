import React, { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Animated, ImageBackground } from "react-native";
import ScreenPlay from '../Components/Actual Game/Screen Play/ScreenPlay';
import GameQuestions from '../Components/Actual Game/GameQuestions/GameQuestions';
import ThirdGrid from '../Components/Actual Game/Third Grid/thirdGrid';
import Drawer from '../Components/Actual Game/Drawer/Drawer';
import questionsData from '../Components/Actual Game/GameData/Question Game Data/questionsData';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_PEEK = SCREEN_HEIGHT * 0.05;
const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.7;

export default function LeaderBoard() {
  const [isOutputVisible, setIsOutputVisible] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [borderColor, setBorderColor] = useState('rgba(37, 144, 197, 1)');
  
  const [timeLeft, setTimeLeft] = useState(null);
  const [isTimeExpired, setIsTimeExpired] = useState(false);
  const [hasShownOutput, setHasShownOutput] = useState(false);

  const allowEnemyCompletionRef = useRef(null);
  const setCorrectAnswerRef = useRef(null);

  const translateY = useRef(new Animated.Value(DRAWER_HEIGHT - DRAWER_PEEK)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const currentQuestion = questionsData[currentQuestionIndex] || questionsData[0];

  // ENHANCED: Better timer update logging
   const handleTimerUpdate = useCallback((timeRemaining, expired) => {
    const status = isOutputVisible ? '🔒 FROZEN' : '🔄 TICKING';
    console.log('⏰ Timer update:', { 
      timeRemaining, 
      expired, 
      questionIndex: currentQuestionIndex,
      drawerState: isOutputVisible ? '📂 OPEN' : '📁 CLOSED',
      timerStatus: status
    });
    setTimeLeft(timeRemaining);
    setIsTimeExpired(expired);
  }, [isOutputVisible, currentQuestionIndex]);

  const handleEnemyComplete = useCallback((enemyIndex) => {
    console.log(`🏁 Enemy ${enemyIndex} completed for question ${currentQuestionIndex}`);
    
    setTimeLeft(null);
    setIsTimeExpired(false);
    setSelectedAnswers([]);
    setBorderColor('rgba(37, 144, 197, 1)');
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
    
    if (currentQuestionIndex < questionsData.length - 1) {
      const nextQuestionIndex = currentQuestionIndex + 1;
      console.log(`🔄 Moving from question ${currentQuestionIndex} to question ${nextQuestionIndex}`);
      setCurrentQuestionIndex(nextQuestionIndex);
    } else {
      console.log('🎉 All questions completed!');
    }
  }, [currentQuestionIndex, isOutputVisible, translateY, backdropOpacity]);

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

  return (
    <ImageBackground 
      source={{uri: 'https://github.com/user-attachments/assets/dc83a36e-eb2e-4fa5-b4e7-0eab9ff65abc'}}
      style={styles.container}
    >
      <ScreenPlay 
        isPaused={isOutputVisible} // CRITICAL: This controls timer pausing
        borderColor={borderColor}
        onEnemyComplete={handleEnemyComplete}
        currentQuestionIndex={currentQuestionIndex} 
        onTimerUpdate={handleTimerUpdate}
        onAllowEnemyCompletion={handleAllowEnemyCompletion}
        onSetCorrectAnswer={handleSetCorrectAnswer}
      />

      <GameQuestions 
        currentQuestion={currentQuestion}
        selectedAnswers={selectedAnswers}
        getBlankIndex={getBlankIndex}
        timeLeft={timeLeft}
      />

      <ThirdGrid 
        currentQuestion={currentQuestion}
        selectedAnswers={selectedAnswers}
        setSelectedAnswers={setSelectedAnswers}
        currentQuestionIndex={currentQuestionIndex}
        setCurrentQuestionIndex={setCurrentQuestionIndex}
        questionsData={questionsData}
        animateToPosition={animateToPosition}
        setBorderColor={setBorderColor}
        timeLeft={timeLeft}
        isTimeExpired={isTimeExpired}
        hasShownOutput={hasShownOutput}
        setHasShownOutput={setHasShownOutput}
        setCorrectAnswerRef={setCorrectAnswerRef}
      />

      <Drawer
        isOutputVisible={isOutputVisible}
        translateY={translateY}
        backdropOpacity={backdropOpacity}
        animateToPosition={animateToPosition}
        currentQuestion={currentQuestion}
        currentQuestionIndex={currentQuestionIndex}
        questionsData={questionsData}
        selectedAnswers={selectedAnswers}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});