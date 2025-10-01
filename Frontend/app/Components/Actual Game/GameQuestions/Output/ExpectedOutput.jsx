import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const ExpectedOutput = ({ 
  currentQuestion, 
  title = "Expected Output"
}) => {
  const [htmlOutput, setHtmlOutput] = useState('');
  
  // Get expected output from gameService data structure
  const expectedResult = currentQuestion?.expected_output || "No expected output available";

  // Generate HTML output for WebView
  const generateHtmlOutput = useCallback(() => {
    if (!currentQuestion || !currentQuestion.expected_output) {
      return '<html><body><p>No expected output available</p></body></html>';
    }

    const questionType = currentQuestion.challenge_type;
    
    // For non-HTML question types, show as plain text
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

    // Ensure proper HTML structure with styling
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

  // Determine if we should show HTML output
  const shouldShowHTML = currentQuestion && currentQuestion.expected_output;

  return (
    <View style={styles.container}>
      
      {shouldShowHTML ? (
        // WebView for Expected Output
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
            onError={(error) => console.log('ExpectedOutput WebView error:', error)}
            onLoad={() => console.log('ExpectedOutput WebView loaded')}
          />
        </View>
      ) : (
        // Fallback text display
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

export default ExpectedOutput;