import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const ExpectedOutput = ({ 
  currentQuestion, 
  title = "Expected Output"
}) => {
  const [htmlOutput, setHtmlOutput] = useState('');
  
  //  Memoize expected result
  const expectedResult = useMemo(() => 
    currentQuestion?.expected_output || "No expected output available",
    [currentQuestion?.expected_output]
  );

  //  Memoize HTML generation function
  const generateHtmlOutput = useCallback(() => {
    if (!currentQuestion || !currentQuestion.expected_output) {
      return '<html><body><p>No expected output available</p></body></html>';
    }

    const questionType = currentQuestion.challenge_type;
    
    if (questionType !== 'fill in the blank' && questionType !== 'code with guide') {
      return `<html>
        <head>
          <title>Expected Output</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: monospace; 
              font-size: 16px; 
              line-height: 1.6; 
              margin: 20px; 
              color: #495057;
              white-space: pre-wrap;
            }
          </style>
        </head>
        <body>${currentQuestion.expected_output}</body>
      </html>`;
    }

    let htmlCode = currentQuestion.expected_output;

    if (!htmlCode.includes('<!DOCTYPE')) {
      htmlCode = `<!DOCTYPE html>\n${htmlCode}`;
    }

    if (!htmlCode.includes('<html>')) {
      htmlCode = `<html>\n<head>
        <title>Expected Output</title>
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
  }, [currentQuestion]);

  // Update HTML output when currentQuestion changes
  useEffect(() => {
    const newHtmlOutput = generateHtmlOutput();
    setHtmlOutput(newHtmlOutput);
  }, [generateHtmlOutput]);

  //  Memoize should show HTML decision
  const shouldShowHTML = useMemo(() => 
    currentQuestion && currentQuestion.expected_output,
    [currentQuestion]
  );

  //  Memoize event handlers
  const handleWebViewError = useCallback((error) => {
    console.log('ExpectedOutput WebView error:', error);
  }, []);

  const handleWebViewLoad = useCallback(() => {
    console.log('ExpectedOutput WebView loaded');
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
            {expectedResult}
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

export default React.memo(ExpectedOutput, (prevProps, nextProps) => {
  return (
    prevProps.currentQuestion?.expected_output === nextProps.currentQuestion?.expected_output &&
    prevProps.currentQuestion?.challenge_type === nextProps.currentQuestion?.challenge_type &&
    prevProps.title === nextProps.title
  );
});