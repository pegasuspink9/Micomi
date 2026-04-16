import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { generateCombinedHtml } from './WebViewBuilder'; 

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ExpectedOutput = ({ 
  currentQuestion, 
  submissionResult = null,
}) => {
  const [htmlOutput, setHtmlOutput] = useState('');

  const resolvedCorrectAnswers = useMemo(() => {
    const submissionAnswers = submissionResult?.correctAnswer ?? submissionResult?.correct_answer;
    const challengeAnswers = currentQuestion?.correctAnswer ?? currentQuestion?.correct_answer;
    const rawAnswers = submissionAnswers ?? challengeAnswers ?? [];
    const normalizedAnswers = Array.isArray(rawAnswers)
      ? rawAnswers
      : rawAnswers !== null && rawAnswers !== undefined
        ? [rawAnswers]
        : [];

    return normalizedAnswers
      .map((answer) => {
        if (typeof answer === 'number' && Array.isArray(currentQuestion?.options)) {
          const optionValue = currentQuestion.options[answer];
          return typeof optionValue === 'string' ? optionValue : String(answer);
        }

        if (answer === null || answer === undefined) {
          return '';
        }

        return String(answer);
      })
      .filter((answer) => answer.length > 0);
  }, [currentQuestion?.correctAnswer, currentQuestion?.correct_answer, currentQuestion?.options, submissionResult?.correctAnswer, submissionResult?.correct_answer]);

    const generateHtmlOutput = useCallback(() => {
    return generateCombinedHtml(currentQuestion, resolvedCorrectAnswers);
  }, [currentQuestion, resolvedCorrectAnswers]);

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
          key={`expected-${currentQuestion?.id}-${resolvedCorrectAnswers.join('|')}`}
          source={{ html: htmlOutput, baseUrl: '' }}
          style={styles.webview}
          scalesPageToFit={false}
          startInLoadingState={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          originWhitelist={['*']}
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