import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { generateCombinedHtml } from './WebViewBuilder'; 

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ExpectedOutput = ({ 
  currentQuestion, 
}) => {
  const [htmlOutput, setHtmlOutput] = useState('');

    const generateHtmlOutput = useCallback(() => {
    return generateCombinedHtml(currentQuestion, currentQuestion.correctAnswer);
  }, [currentQuestion]);

  // Update the HTML output whenever the question changes
  useEffect(() => {
    const newHtmlOutput = generateHtmlOutput();
    setHtmlOutput(newHtmlOutput);
  }, [generateHtmlOutput]);

  const handleWebViewError = useCallback((error) => {
    console.log('ExpectedOutput WebView error:', error);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.webviewContainer}>
        <WebView
          source={{ html: htmlOutput }}
          style={styles.webview}
          scalesPageToFit={true}
          startInLoadingState={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onError={handleWebViewError}
        />
      </View>
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

export default React.memo(ExpectedOutput);