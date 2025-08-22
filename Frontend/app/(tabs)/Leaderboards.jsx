import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Dimensions, PanResponder, Animated, ScrollView, Pressable } from "react-native";
import { WebView } from 'react-native-webview';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import ScreenPlay from '../Components/Actual Game/ScreenPlay';
import GameQuestions from '../Components/Actual Game/GameQuestions';
import questionsData from '../Components/Actual Game/questionsData';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_PEEK = SCREEN_HEIGHT * 0.05;
const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.7;
const SNAP_THRESHOLD = SCREEN_HEIGHT * 0.1;
const VELOCITY_THRESHOLD = 0.9;

const secondGrid = {
    backgroundColor: 'rgba(12, 21, 103, 1)',
};

const WEBVIEW_WIDTH = SCREEN_WIDTH * 2;

export default function LeaderBoard() {
  const [isOutputVisible, setIsOutputVisible] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [htmlOutput, setHtmlOutput] = useState('');
  const [isGamePaused, setIsGamePaused] = useState(false);


  const translateY = useRef(new Animated.Value(DRAWER_HEIGHT - DRAWER_PEEK)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Get current question dynamically
  const currentQuestion = questionsData[currentQuestionIndex] || questionsData[0];

  // Generate HTML output in real-time based on selected answers
  const generateHtmlOutput = useCallback(() => {
    if (currentQuestion.questionType !== 'code-blanks') {
      return '<html><body><h2>No HTML output for this question type</h2></body></html>';
    }

    let htmlCode = currentQuestion.question;
    
    // Replace blanks with selected answers
    selectedAnswers.forEach((answer, index) => {
      if (answer) {
        htmlCode = htmlCode.replace('_', answer);
      }
    });

    // Replace remaining blanks with placeholder text
    htmlCode = htmlCode.replace(/_/g, '<!-- Missing --!>');

    // Ensure it's a complete HTML document
    if (!htmlCode.includes('<!DOCTYPE')) {
      htmlCode = `<!DOCTYPE html>\n${htmlCode}`;
    }

    if (!htmlCode.includes('<html>')) {
      htmlCode = `<html>\n${htmlCode}\n</html>`;
    }

    return htmlCode;
  }, [currentQuestion, selectedAnswers]);

  // Update HTML output whenever answers change
  useEffect(() => {
    const newHtmlOutput = generateHtmlOutput();
    setHtmlOutput(newHtmlOutput);
  }, [generateHtmlOutput]);

  const animateToPosition = useCallback((shouldOpen) => {
    const toValue = shouldOpen ? 0 : DRAWER_HEIGHT - DRAWER_PEEK;
    const backdropValue = shouldOpen ? 0.5 : 0;
    
    setIsOutputVisible(shouldOpen);
    setIsGamePaused(shouldOpen);
    
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

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      
      onPanResponderGrant: () => {
        translateY.stopAnimation();
        backdropOpacity.stopAnimation();
      },
      
      onPanResponderMove: (_, gestureState) => {
        const startY = isOutputVisible ? 0 : DRAWER_HEIGHT - DRAWER_PEEK;
        const newY = Math.max(0, Math.min(DRAWER_HEIGHT - DRAWER_PEEK, startY + gestureState.dy));
        
        translateY.setValue(newY);
        backdropOpacity.setValue((1 - newY / (DRAWER_HEIGHT - DRAWER_PEEK)) * 0.5);
      },
      
      onPanResponderRelease: (_, gestureState) => {
        const { dy, vy } = gestureState;
        
        const shouldOpen = Math.abs(vy) > VELOCITY_THRESHOLD 
          ? vy < 0
          : isOutputVisible ? dy < SNAP_THRESHOLD : dy < -SNAP_THRESHOLD;
        
        animateToPosition(shouldOpen);
      },
    })
  ).current;

  // Helper function for GameQuestions component
  const getBlankIndex = (lineIndex, partIndex) => {
    let blankIndex = 0;
    const lines = currentQuestion.question.split('\n');
    
    for (let i = 0; i < lineIndex; i++) {
      blankIndex += (lines[i].match(/_/g) || []).length;
    }
    blankIndex += partIndex;
    
    return blankIndex;
  };

  // Updated renderListItems
  const renderListItems = () => {
    const maxAnswers = currentQuestion.questionType === 'code-blanks' 
      ? (currentQuestion.question.match(/_/g) || []).length 
      : getBlankCount();
    
    const options = currentQuestion.options || "";
    
    return options.split(',').map((item, index) => {
      const trimmedItem = item.trim();
      const isSelected = selectedAnswers.includes(trimmedItem);
      const isDisabled = !isSelected && selectedAnswers.length >= maxAnswers;
      
      return (
        <Pressable 
          key={index} 
          style={({ pressed }) => [
            styles.listItemContainer,
            isSelected && styles.listItemSelected,
            isDisabled && styles.listItemDisabled,
            pressed && !isDisabled && styles.listItemPressed
          ]}
          onPress={() => !isDisabled && handleAnswerSelect(trimmedItem)}
          disabled={isDisabled}
        >
          <Text style={[
            styles.listItemText,
            isSelected && styles.listItemTextSelected,
            isDisabled && styles.listItemTextDisabled 
          ]}>
            {trimmedItem}
          </Text>
        </Pressable>
      );
    });
  };

  const getBlankCount = () => {
    const questionText = currentQuestion.question;
    const blanks = questionText.match(/_/g);
    return blanks ? blanks.length : 1;
  };

  const handleAnswerSelect = (answer) => {
    const maxAnswers = currentQuestion.questionType === 'code-blanks' 
      ? (currentQuestion.question.match(/_/g) || []).length 
      : getBlankCount();
    
    setSelectedAnswers(prev => {
      if (prev.includes(answer)) {
        return prev.filter(item => item !== answer);
      } else {
        if (prev.length < maxAnswers) {
          return [...prev, answer];
        } else {
          alert(`You can only select ${maxAnswers} answer(s)`);
          return prev;
        }
      }
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questionsData.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswers([]);
    }
  };

  const checkAnswer = () => {
  let isCorrect = false;
  
  if (currentQuestion.questionType === 'code-blanks') {
    const correctAnswers = Array.isArray(currentQuestion.answer) 
      ? currentQuestion.answer 
      : [currentQuestion.answer];
    
    isCorrect = correctAnswers.every((answer, index) => 
      selectedAnswers[index] === answer
    ) && selectedAnswers.length === correctAnswers.length;
  } else {
    isCorrect = selectedAnswers.includes(currentQuestion.answer);
  }

  if (isCorrect) {
    if (currentQuestion.questionType === 'code-blanks') {
      
      setTimeout(() => {
        animateToPosition(true);
      }, 100); 
      
      // Auto-close drawer and move to next question after viewing
      setTimeout(() => {
        animateToPosition(false); 
        handleNextQuestion(); 
      }, 10000); 
      
    } else {
      // For regular questions: normal flow
      alert('Correct! 🎉');
      setTimeout(() => {
        handleNextQuestion();
      }, 1000);
    }
  } else {
    alert('Try again! ❌');
  }
  };

  return (
    <View style={styles.container}>
      <ScreenPlay isPaused={isOutputVisible} />

      <GameQuestions 
        currentQuestion={currentQuestion}
        selectedAnswers={selectedAnswers}
        getBlankIndex={getBlankIndex}
      />

      <View style={styles.thirdGrid}>
        <ScrollView 
          contentContainerStyle={styles.scrollableButton}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          <View style={styles.flexWrapContainer}>
            {renderListItems()}
          </View>
        </ScrollView>
        
        <Pressable 
          style={({ pressed }) => [
            styles.runButtonContainer,
            pressed && styles.listItemPressed
          ]}
          onPress={checkAnswer}
        >
          <Text style={styles.runButton}>Run</Text>
        </Pressable>
      </View>

      <Animated.View 
        style={[
          styles.backdrop,
          {
            opacity: backdropOpacity,
            pointerEvents: isOutputVisible ? 'auto' : 'none',
          }
        ]}
      >
        <TouchableOpacity 
          style={StyleSheet.absoluteFillObject}
          onPress={() => animateToPosition(false)}
          activeOpacity={1}
        />
      </Animated.View>
      
      <Animated.View 
        style={[
          styles.drawer,
          { transform: [{ translateY }] }
        ]}
      >
        <View 
          style={styles.peekArea}
          {...panResponder.panHandlers}
        >
          <View style={styles.arrowContainer}>
            <FontAwesome 
              name={isOutputVisible ? "arrow-down" : "arrow-up"} 
              size={10} 
              color="white" 
            />
          </View>
          <Text style={{ color: 'white', fontSize: 9 }}>{isOutputVisible ? "Hide" : "Output"}</Text>
        </View>

        <View style={styles.hiddenContent}>
          <View style={styles.outputHeader}>
            <Text style={styles.outputTitle}>Live HTML Output</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => animateToPosition(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Real-time HTML Output */}
          <View style={styles.webviewContainer}>
            {currentQuestion.questionType === 'code-blanks' ? (
              <WebView
                source={{ html: htmlOutput }}
                style={styles.webview}
                scalesPageToFit={true}
                startInLoadingState={true}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                onError={(error) => console.log('WebView error:', error)}
                onLoad={() => console.log('WebView loaded')}
                renderLoading={() => (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading HTML...</Text>
                  </View>
                )}
              />
            ) : (
              <View style={styles.contentArea}>
                <Text style={styles.placeholderText}>
                  Question {currentQuestionIndex + 1} of {questionsData.length}
                </Text>
                <Text style={styles.placeholderText}>
                  Type: {currentQuestion.questionType}
                </Text>
                <Text style={styles.placeholderText}>
                  HTML output only available for code-blanks questions
                </Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: secondGrid.backgroundColor,
  },
  webviewContainer: {
    flex: 1,
    backgroundColor: '#fff',
    width: WEBVIEW_WIDTH,
    borderRadius: 8,
  },
  webview: {
    flex: 1,
    backgroundColor: '#fff',
    width: WEBVIEW_WIDTH,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },

  listItemContainer: {
    borderRadius: SCREEN_WIDTH * 0.02,
    paddingVertical: SCREEN_WIDTH * 0.03,
    paddingHorizontal: SCREEN_WIDTH * 0.04,
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    marginRight: SCREEN_WIDTH * 0.02,
    marginBottom: SCREEN_HEIGHT * 0.015,
    backgroundColor: '#0d0355cf',
    borderTopWidth: SCREEN_WIDTH * 0.002,
    borderTopColor: '#0493a3ff',
    borderBottomWidth: SCREEN_WIDTH * 0.008,
    borderBottomColor: '#0493a3ff',
    borderLeftWidth: SCREEN_WIDTH * 0.001,
    borderLeftColor: '#0493a3ff',
    borderRightWidth: SCREEN_WIDTH * 0.003,
    borderRightColor: '#0493a3ff',
    shadowColor: '#2c008bff',
    shadowOffset: {
      width: 100,
      height: 10,
    },
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 72,
  },
  
  listItemDisabled: {
    backgroundColor: '#7f8c8d',
    borderTopColor: '#95a5a6',
    borderBottomColor: '#6c7b7d',
    borderLeftColor: '#95a5a6',
    borderRightColor: '#6c7b7d',
    opacity: 0.5,
  },
  
  listItemTextDisabled: {
    color: '#bdc3c7',
  },
  
  runButtonContainer: {
    borderRadius: SCREEN_WIDTH * 0.02,
    paddingVertical: SCREEN_WIDTH * 0.02,
    paddingHorizontal: SCREEN_WIDTH * 0.02,
    width: 80, 
    alignSelf: 'flex-end',
    marginRight: SCREEN_WIDTH * 0.05,
    marginTop: SCREEN_HEIGHT * 0.015,
    marginBottom: SCREEN_HEIGHT * 0.015,
    backgroundColor: '#89061c90',
    borderTopWidth: SCREEN_WIDTH * 0.002,
    borderTopColor: '#640000ff',
    borderBottomWidth: SCREEN_WIDTH * 0.008,
    borderBottomColor: '#640000ff',
    borderLeftWidth: SCREEN_WIDTH * 0.001,
    borderLeftColor: '#640000ff',
    borderRightWidth: SCREEN_WIDTH * 0.003,
    borderRightColor: '#640000ff',
    shadowColor: '#640000ff',
  },
  
  runButton: {
    fontSize: SCREEN_WIDTH * 0.03,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  
  scrollableButton: {
    flexGrow: 1,
    paddingHorizontal: SCREEN_WIDTH * 0.02,
    paddingVertical: SCREEN_HEIGHT * 0.01,
  },
  
  listItemPressed: {
    transform: [{ translateY: 5}], 
    borderBottomWidth: SCREEN_WIDTH * 0.003,
  },
  
  listItemSelected: {
    backgroundColor: '#2c3e50',
    borderTopColor: '#34495e',
    borderBottomColor: '#1a252f',
    borderLeftColor: '#34495e',
    borderRightColor: '#1a252f',
  },
  
  listItemTextSelected: {
    color: '#ecf0f1',
  },
  
  listItemText: {
    fontSize: SCREEN_WIDTH * 0.029,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  
  flexWrapContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: SCREEN_WIDTH * 0.01,
  },
  
  thirdGrid: {
    flex: 1,
    borderTopEndRadius: SCREEN_WIDTH * 0.1,
    borderTopStartRadius: SCREEN_WIDTH * 0.1,
    backgroundColor: '#000000ff',
    paddingHorizontal: SCREEN_WIDTH * 0.04,
    paddingVertical: SCREEN_HEIGHT * 0.02,
  },
  
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 1,
  },
  
  drawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: DRAWER_HEIGHT,
    borderTopLeftRadius: SCREEN_WIDTH * 0.05,
    borderTopRightRadius: SCREEN_WIDTH * 0.05,
    zIndex: 2,
  },
  
  arrowContainer: {
    padding: SCREEN_WIDTH * 0.015,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: SCREEN_WIDTH * 0.02,
    minWidth: SCREEN_WIDTH * 0.1,
    minHeight: SCREEN_WIDTH * 0.06,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  peekArea: {
    height: DRAWER_PEEK, 
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: SCREEN_WIDTH * 0.05,
    borderTopRightRadius: SCREEN_WIDTH * 0.05,
  },
  
  hiddenContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
  
  outputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SCREEN_HEIGHT * 0.025,
    paddingHorizontal: SCREEN_WIDTH * 0.05,
    borderBottomWidth: SCREEN_WIDTH * 0.0025,
    borderBottomColor: '#eee',
    minHeight: SCREEN_HEIGHT * 0.08,
  },
  
  outputTitle: {
    fontSize: SCREEN_WIDTH * 0.045,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  
  closeButton: {
    width: SCREEN_WIDTH * 0.08,
    height: SCREEN_WIDTH * 0.08,
    borderRadius: SCREEN_WIDTH * 0.04,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  closeButtonText: {
    fontSize: SCREEN_WIDTH * 0.04,
    color: 'black',
    fontWeight: 'bold',
  },
  
  contentArea: {
    flex: 1,
    paddingVertical: SCREEN_HEIGHT * 0.025,
    paddingHorizontal: SCREEN_WIDTH * 0.05,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  placeholderText: {
    fontSize: SCREEN_WIDTH * 0.04,
    color: '#999',
    textAlign: 'center',
    lineHeight: SCREEN_WIDTH * 0.06,
  },
});