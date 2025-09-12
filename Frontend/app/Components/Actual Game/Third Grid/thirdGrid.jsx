import React from 'react';
import { View, StyleSheet, ScrollView, Pressable, Text, Dimensions, Alert } from 'react-native';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ThirdGrid({ 
  currentQuestion, 
  selectedAnswers, 
  setSelectedAnswers,
  currentQuestionIndex,
  setCurrentQuestionIndex,
  questionsData,
  animateToPosition,
  setBorderColor
}) {
  
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
          Alert.alert('Selection Limit', `You can only select ${maxAnswers} answer(s)`);
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
      // Set border to green for correct answer
      setBorderColor('#34c759'); // Green
      
      if (currentQuestion.questionType === 'code-blanks') {
        setTimeout(() => {
          animateToPosition(true);
        }, 100); 
        
        setTimeout(() => {
          animateToPosition(false); 
          setBorderColor('rgba(37, 144, 197, 1)'); // Reset to blue
          handleNextQuestion(); 
        }, 10000); 
      } else {
        setTimeout(() => {
          setBorderColor('rgba(37, 144, 197, 1)'); // Reset to blue
          handleNextQuestion();
        }, 1000);
      }
    } else {
      // Set border to red for wrong answer
      setBorderColor('#ff3b30'); // Red
      
      // Reset border color after 2 seconds
      setTimeout(() => {
        setBorderColor('rgba(37, 144, 197, 1)'); // Reset to blue
      }, 2000);
    }
  };


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

  return (
    <View style={styles.thirdGrid}>
      <View style={styles.innerContent}>
        <View style={styles.innerBorder}>
          <View style={styles.backlightOverlay} />
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  thirdGrid: {
    flex: 1,
    padding: SCREEN_WIDTH * 0.02,
    backgroundColor: 'transparent',
  },

  innerContent: {
    flex: 1,
    backgroundColor: '#2c2c2e', 
    borderRadius: SCREEN_WIDTH * 0.04,
    padding: SCREEN_WIDTH * 0.03,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
    borderTopWidth: 2,
    borderTopColor: '#4a4a4c',
    borderBottomWidth: 4,
    borderBottomColor: '#1c1c1e',
    borderLeftWidth: 2,
    borderLeftColor: '#3a3a3c',
    borderRightWidth: 3,
    borderRightColor: '#1c1c1e',
  },

  innerBorder: {
    flex: 1,
    backgroundColor: '#1c1c1e',
    borderRadius: SCREEN_WIDTH * 0.025,
    borderTopWidth: 1,
    borderTopColor: '#0a0a0a',
    borderLeftWidth: 1,
    borderLeftColor: '#0a0a0a',
    borderBottomWidth: 2,
    borderBottomColor: '#2c2c2e',
    borderRightWidth: 2,
    borderRightColor: '#2c2c2e',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,

      flexDirection: 'column',
  justifyContent: 'space-between',
  },

  backlightOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(7, 127, 255, 0.07)',
  borderRadius: SCREEN_WIDTH * 0.025,
  pointerEvents: 'none',
  },


  listItemContainer: {
    borderRadius: SCREEN_WIDTH * 0.02,
    paddingVertical: SCREEN_WIDTH * 0.03,
    paddingHorizontal: SCREEN_WIDTH * 0.02,
    width: SCREEN_WIDTH * 0.20,
    marginBottom: SCREEN_HEIGHT * 0.015,
    
    // 3D key effect
    backgroundColor: '#f2f2f7', 
    
    // 3D borders
    borderTopWidth: 2,
    borderTopColor: '#ffffff',
    borderLeftWidth: 2,
    borderLeftColor: '#e5e5ea',
    borderBottomWidth: 4,
    borderBottomColor: '#8e8e93',
    borderRightWidth: 3,
    borderRightColor: '#aeaeb2',
    
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },

  listItemPressed: {
    transform: [{ translateY: 2 }],
    shadowOffset: {
      width: 1,
      height: 2,
    },
    shadowOpacity: 0.15,
    borderTopColor: '#d1d1d6',
    borderLeftColor: '#c7c7cc',
    borderBottomWidth: 2,
    borderBottomColor: '#8e8e93',
  },

  listItemSelected: {
    backgroundColor: '#007aff',
    borderTopColor: '#4da6ff',
    borderLeftColor: '#0066cc',
    borderBottomColor: '#005bb5',
    borderRightColor: '#005bb5',
  },


  // Enhanced run button
  runButtonContainer: {
    borderRadius: SCREEN_WIDTH * 0.02,
    paddingVertical: SCREEN_WIDTH * 0.010,
    paddingHorizontal: SCREEN_WIDTH * 0.04,
    width: SCREEN_WIDTH * 0.3,
    alignSelf: 'flex-end',
    // Special run button styling
    backgroundColor: '#34c759',
    
    // 3D effect

    position: 'absolute',
    bottom: SCREEN_WIDTH * 0.02,
    right: SCREEN_WIDTH * 0.02,
  

    borderTopWidth: 2,
    borderTopColor: '#5ac777',
    borderLeftWidth: 2,
    borderLeftColor: '#30d158',
    borderBottomWidth: 4,
    borderBottomColor: '#248a3d',
    borderRightWidth: 3,
    borderRightColor: '#1f7a37',
    
    // Button shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 4,
    },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 10,
  },

  // Key text styling
  listItemText: {
    fontSize: SCREEN_WIDTH * 0.032,
    fontWeight: 'bold',
    color: '#1c1c1e',
    textAlign: 'center',
    // Text shadow for 3D effect
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },

  listItemTextSelected: {
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
  },

  listItemTextDisabled: {
    color: '#636366',
    textShadowColor: 'transparent',
  },

  runButton: {
    fontSize: SCREEN_WIDTH * 0.035,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  flexWrapContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: SCREEN_WIDTH * 0.01,
  },

  scrollableButton: {
    flexGrow: 1,
    paddingHorizontal: SCREEN_WIDTH * 0.01,
    paddingVertical: SCREEN_HEIGHT * 0.02,
      paddingBottom: SCREEN_HEIGHT * 0.08, 
  },
});