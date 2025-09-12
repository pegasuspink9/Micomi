import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const WEBVIEW_WIDTH = SCREEN_WIDTH * 2;

export default function Output({
  currentQuestion,
  currentQuestionIndex,
  questionsData,
  selectedAnswers,
  animateToPosition
}) {
  const [htmlOutput, setHtmlOutput] = useState('');

  const generateHtmlOutput = useCallback(() => {
    if (currentQuestion.questionType !== 'code-blanks') {
      return '<html><body><h2>No HTML output for this question type</h2></body></html>';
    }

    let htmlCode = currentQuestion.question;
    
    selectedAnswers.forEach((answer, index) => {
      if (answer) {
        htmlCode = htmlCode.replace('_', answer);
      }
    });

    htmlCode = htmlCode.replace(/_/g, '<!-- Missing -->');

    if (!htmlCode.includes('<!DOCTYPE')) {
      htmlCode = `<!DOCTYPE html>\n${htmlCode}`;
    }

    if (!htmlCode.includes('<html>')) {
      htmlCode = `<html>\n${htmlCode}\n</html>`;
    }

    return htmlCode;
  }, [currentQuestion, selectedAnswers]);

  useEffect(() => {
    const newHtmlOutput = generateHtmlOutput();
    setHtmlOutput(newHtmlOutput);
  }, [generateHtmlOutput]);

  return (
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
  },
});