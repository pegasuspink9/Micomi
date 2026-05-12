import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { generateCombinedHtml } from './WebViewBuilder'; 
import { getPreviewLayout } from './previewMode';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const ExpectedOutput = ({ 
  currentQuestion, 
  submissionResult = null,
  displayMode = 'gameQuestion',
  previewMode = 'web',
}) => {

  const containerStyle = displayMode === 'overlay'
    ? styles.containerOverlay
    : styles.containerGameQuestion;

  const webviewContainerStyle = displayMode === 'overlay'
    ? styles.webviewContainerOverlay
    : styles.webviewContainerGameQuestion;

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

  const htmlOutput = useMemo(() => (
    generateCombinedHtml(currentQuestion, resolvedCorrectAnswers, previewMode)
  ), [currentQuestion, resolvedCorrectAnswers, previewMode]);

  const handleWebViewError = useCallback((error) => {
    console.log('ExpectedOutput WebView error:', error);
  }, []);

  const previewLayout = useMemo(() => (
    getPreviewLayout({
      previewMode,
      screenWidth: SCREEN_WIDTH,
      screenHeight: SCREEN_HEIGHT,
    })
  ), [previewMode]);

  return (
    <View style={containerStyle}>
      <View style={[webviewContainerStyle, previewLayout.containerStyle]}>
        <View style={[styles.previewFrame, previewLayout.frameStyle]}>
          <WebView
            key={`expected-${currentQuestion?.id}-${resolvedCorrectAnswers.join('|')}-${previewMode}`}
            source={{ html: htmlOutput, baseUrl: '' }}
            style={[styles.webview, previewLayout.webViewStyle]}
            scalesPageToFit={false}
            startInLoadingState={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            originWhitelist={['*']}
            onError={handleWebViewError}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  containerGameQuestion: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    minHeight: SCREEN_HEIGHT * 1,
    height: '100%',
  },
  containerOverlay: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    minHeight: 0,
    height: '100%',
  },
  webviewContainerGameQuestion: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e9ecef',
    overflow: 'hidden',
    minHeight: SCREEN_HEIGHT * 0.35,
    height: '100%',
  },
  webviewContainerOverlay: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e9ecef',
    overflow: 'hidden',
    minHeight: 0,
    height: '100%',
  },
  webview: {
    flex: 1,
    backgroundColor: '#fff',
    width: '100%',
    height: '100%',
  },
  previewFrame: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default React.memo(ExpectedOutput);