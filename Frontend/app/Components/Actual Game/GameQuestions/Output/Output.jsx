import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const Output = ({ 
  actualResult = "", 
  isCorrect = null,
  style = {},
  currentQuestion,
  selectedAnswers = [],
  showLiveHTML = false,
  options = [],
}) => {
  const [htmlOutput, setHtmlOutput] = useState('');

  //  Memoize HTML generation function
  const generateHtmlOutput = useCallback(() => {
    if (!currentQuestion || !currentQuestion.question) {
      return '<html><body></body></html>';
    }

    const questionType = currentQuestion.challenge_type;
    
    if (questionType !== 'fill in the blank' && questionType !== 'code with guide') {
      return '<html><body></body></html>';
    }

    let htmlCode = currentQuestion.question;
    const answersArray = selectedAnswers.map(index => options?.[index]).filter(answer => answer && typeof answer === 'string');
    
    answersArray.forEach((answer) => {
      htmlCode = htmlCode.replace('_', answer);
    });
    htmlCode = htmlCode.replace(/_/g, '');

    if (!htmlCode.includes('<!DOCTYPE')) {
      htmlCode = `<!DOCTYPE html>\n${htmlCode}`;
    }

    if (!htmlCode.includes('<html>')) {
      htmlCode = `<html>\n<head>
        <title>Output</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            font-size: 18px; 
            line-height: 1.6; 
            margin: 20px; 
            color: #333;
          }
          h1, h2, h3 { color: #2c3e50; margin-bottom: 15px; }
          p { margin-bottom: 15px; }
        </style>
      </head>\n<body>\n${htmlCode}\n</body>\n</html>`;
    }

    return htmlCode;
  }, [currentQuestion, selectedAnswers, options]);

  // Update HTML output when dependencies change
  useEffect(() => {
    if (showLiveHTML) {
      const newHtmlOutput = generateHtmlOutput();
      setHtmlOutput(newHtmlOutput);
    }
  }, [generateHtmlOutput, showLiveHTML]);

  //  Memoize should show HTML decision
  const shouldShowHTML = useMemo(() => 
    showLiveHTML && currentQuestion && 
    (currentQuestion.challenge_type === 'fill in the blank' || currentQuestion.challenge_type === 'code with guide'),
    [showLiveHTML, currentQuestion]
  );

  //  Memoize event handlers
  const handleWebViewError = useCallback((error) => {
    console.log('WebView error:', error);
  }, []);

  const handleWebViewLoad = useCallback(() => {
    console.log('WebView loaded');
  }, []);

  return (
    <View style={styles.container}>
      {shouldShowHTML ? (
        <View style={styles.webviewContainer}>
          <WebView
            source={{ html: htmlOutput }}
            style={styles.webview}
            scalesPageToFit={true}
            startInLoadingState={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            onError={handleWebViewError}
            onLoad={handleWebViewLoad}
          />
        </View>
      ) : (
        <ScrollView style={styles.outputContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.outputText}>
            {actualResult || ""}
          </Text>
        </ScrollView>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    minHeight: SCREEN_HEIGHT * 1,
    height: '100%',
  },
  outputContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 15, 
    borderWidth: 1,
    borderColor: '#e9ecef',
    minHeight: SCREEN_HEIGHT * 0.35, 
  },
  outputText: {
    fontSize: 16, 
    color: '#495057',
    fontFamily: 'monospace', 
    lineHeight: 24, 
    textAlign: 'left', 
  },
  webviewContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e9ecef',
    overflow: 'hidden',
    minHeight: SCREEN_HEIGHT * 0.35,
    height: '100%',
  },
  webview: {
    flex: 1,
    backgroundColor: '#fff',
    width: '100%',
    height: '100%',
  },
});

export default React.memo(Output, (prevProps, nextProps) => {
  return (
    prevProps.actualResult === nextProps.actualResult &&
    prevProps.isCorrect === nextProps.isCorrect &&
    prevProps.showLiveHTML === nextProps.showLiveHTML &&
    prevProps.currentQuestion?.question === nextProps.currentQuestion?.question &&
    prevProps.currentQuestion?.challenge_type === nextProps.currentQuestion?.challenge_type &&
    JSON.stringify(prevProps.selectedAnswers) === JSON.stringify(nextProps.selectedAnswers)
  );
});