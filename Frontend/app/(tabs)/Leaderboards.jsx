import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Animated, ImageBackground } from "react-native";
import ScreenPlay from '../Components/Actual Game/Screen Play/ScreenPlay';
import GameQuestions from '../Components/Actual Game/GameQuestions/GameQuestions';
import ThirdGrid from '../Components/Actual Game/Third Grid/thirdGrid';
import Drawer from '../Components/Actual Game/Drawer/Drawer';
import questionsData from '../Components/Actual Game/GameData/questionsData';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_PEEK = SCREEN_HEIGHT * 0.05;
const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.7;

export default function LeaderBoard() {
  const [isOutputVisible, setIsOutputVisible] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [borderColor, setBorderColor] = useState('rgba(37, 144, 197, 1)');
  const translateY = useRef(new Animated.Value(DRAWER_HEIGHT - DRAWER_PEEK)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const currentQuestion = questionsData[currentQuestionIndex] || questionsData[0];

  const animateToPosition = useCallback((shouldOpen) => {
    const toValue = shouldOpen ? 0 : DRAWER_HEIGHT - DRAWER_PEEK;
    const backdropValue = shouldOpen ? 0.5 : 0;
    
    setIsOutputVisible(shouldOpen);
    
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
    ]).start();
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
    style={styles.container}>
      <ScreenPlay isPaused={isOutputVisible} borderColor={borderColor} />

      <GameQuestions 
        currentQuestion={currentQuestion}
        selectedAnswers={selectedAnswers}
        getBlankIndex={getBlankIndex}
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