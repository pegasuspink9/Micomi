import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const WEBVIEW_WIDTH = SCREEN_WIDTH * 2;

export default function Output({
  currentQuestion,
  currentQuestionIndex = 0,
  questionsData = null,
  selectedAnswers = [],
  animateToPosition,
  challengeData = null, // NEW: Direct challenge data
  gameState = null // NEW: Direct game state
}) {
  const [htmlOutput, setHtmlOutput] = useState('');

  const generateHtmlOutput = useCallback(() => {
    // Safety checks
    if (!currentQuestion) {
      return '<html><body><h2>No question data available</h2></body></html>';
    }

    // Check both possible field names for question type
    const questionType = currentQuestion.type || currentQuestion.questionType;
    
    if (questionType !== 'fill in the blank') {
      return '<html><body><h2>No HTML output for this question type</h2></body></html>';
    }

    if (!currentQuestion.question) {
      return '<html><body><h2>No question text available</h2></body></html>';
    }

    let htmlCode = currentQuestion.question;
    
    // Ensure selectedAnswers is an array before using forEach
    const answersArray = Array.isArray(selectedAnswers) ? selectedAnswers : [];
    
    console.log('🔧 Generating HTML output:', {
      questionType,
      originalQuestion: currentQuestion.question,
      selectedAnswers: answersArray,
      blanksCount: (currentQuestion.question.match(/_/g) || []).length
    });
    
    // Replace blanks with selected answers
    answersArray.forEach((answer, index) => {
      if (answer && typeof answer === 'string') {
        htmlCode = htmlCode.replace('_', answer);
      }
    });

    // Replace remaining blanks with placeholder comment
    htmlCode = htmlCode.replace(/_/g, '<!-- Missing -->');

    // Ensure proper HTML structure
    if (!htmlCode.includes('<!DOCTYPE')) {
      htmlCode = `<!DOCTYPE html>\n${htmlCode}`;
    }

    if (!htmlCode.includes('<html>')) {
      htmlCode = `<html>\n<head><title>HTML Output</title></head>\n<body>\n${htmlCode}\n</body>\n</html>`;
    }

    console.log('✅ Generated HTML:', htmlCode);
    return htmlCode;
  }, [currentQuestion, selectedAnswers]);

  useEffect(() => {
    const newHtmlOutput = generateHtmlOutput();
    setHtmlOutput(newHtmlOutput);
  }, [generateHtmlOutput]);

  // Safety check for currentQuestion
  if (!currentQuestion) {
    return (
      <View style={styles.hiddenContent}>
        <View style={styles.outputHeader}>
          <Text style={styles.outputTitle}>Live HTML Output</Text>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => animateToPosition && animateToPosition(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.contentArea}>
          <Text style={styles.placeholderText}>No question data available</Text>
        </View>
      </View>
    );
  }

  const questionType = currentQuestion.type || currentQuestion.questionType;

  return (
    <View style={styles.hiddenContent}>
      <View style={styles.outputHeader}>
        <Text style={styles.outputTitle}>Live HTML Output</Text>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => animateToPosition && animateToPosition(false)}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.webviewContainer}>
        {questionType === 'fill in the blank' ? (
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
              Question: {currentQuestion.title || 'Unknown'}
            </Text>
            <Text style={styles.placeholderText}>
              Type: {questionType || 'Unknown'}
            </Text>
            <Text style={styles.placeholderText}>
              HTML output only available for fill in the blank questions
            </Text>
            {Array.isArray(selectedAnswers) && selectedAnswers.length > 0 && (
              <Text style={styles.placeholderText}>
                Selected: {selectedAnswers.join(', ')}
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    marginVertical: 5,
  },
});