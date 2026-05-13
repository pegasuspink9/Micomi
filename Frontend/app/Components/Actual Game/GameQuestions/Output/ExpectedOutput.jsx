import React, { useCallback, useMemo, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { generateCombinedHtml } from './WebViewBuilder'; 
import { getPreviewLayout } from './previewMode';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// GLOBAL CACHE: Stores scroll position outside the component lifecycle.
// This ensures that even if you switch tabs and this component unmounts,
// the scroll position is remembered when you come back.
const expectedScrollCache = {};

const ExpectedOutput = ({ 
  currentQuestion, 
  submissionResult = null,
  displayMode = 'gameQuestion',
  previewMode = 'web',
}) => {
  // Create a unique identifier for this specific question and preview mode
  const cacheKey = `expected-${currentQuestion?.id || 'default'}-${previewMode}`;
  
  // Initialize from our global cache so it remembers after tab switches
  const scrollYRef = useRef(expectedScrollCache[cacheKey] || 0);

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

  // MEMOIZE SOURCE: Prevents unnecessary native reloading which resets scroll to 0 natively
  const webViewSource = useMemo(() => ({ html: htmlOutput, baseUrl: '' }), [htmlOutput]);

  const handleWebViewError = useCallback((error) => {
    console.log('ExpectedOutput WebView error:', error);
  }, []);

  const handleWebViewMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent?.data || '{}');
      if (data?.type === 'scroll' && Number.isFinite(data.y)) {
        scrollYRef.current = data.y;
        expectedScrollCache[cacheKey] = data.y; // Save state to global cache immediately
      }
    } catch (error) {
      console.log('ExpectedOutput WebView message parse error:', error);
    }
  }, [cacheKey]);

  // Read latest value from cache or ref
  const restoreScrollY = expectedScrollCache[cacheKey] || scrollYRef.current || 0;
  
  // Robustly force the webview to scroll down to where it left off
  const injectedScrollHandler = `
    (function() {
      var restoreY = ${restoreScrollY};
      var isRestoring = restoreY > 0;
      
      var getY = function() {
        return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      };
      
      var sendY = function() {
        var y = getY();
        // Skip sending 0 back to React if we are in the middle of forcing the scroll restoration
        if (isRestoring && y === 0) return;
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'scroll', y: y }));
      };
      
      window.addEventListener('scroll', function() { requestAnimationFrame(sendY); }, { passive: true });
      
      var tryRestoreScroll = function() {
        if (restoreY > 0) {
          window.scrollTo(0, restoreY);
          if (getY() >= restoreY - 2) {
            isRestoring = false;
          }
        }
      };
      
      tryRestoreScroll();
      document.addEventListener("DOMContentLoaded", tryRestoreScroll);
      window.addEventListener("load", tryRestoreScroll);
      
      // Multi-interval check to ensure layout completes before restoring
      setTimeout(tryRestoreScroll, 50);
      setTimeout(tryRestoreScroll, 200);
      setTimeout(function() {
        tryRestoreScroll();
        isRestoring = false;
        sendY();
      }, 500);
      
      sendY();
    })();
    true;
  `;

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
            key={`expected-${currentQuestion?.id}-${previewMode}`} // Removed answer dependency so it stays highly static
            source={webViewSource}
            style={[styles.webview, previewLayout.webViewStyle]}
            scalesPageToFit={false}
            startInLoadingState={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            originWhitelist={['*']}
            onMessage={handleWebViewMessage}
            injectedJavaScriptBeforeContentLoaded={injectedScrollHandler}
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