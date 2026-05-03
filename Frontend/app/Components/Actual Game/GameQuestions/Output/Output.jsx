import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Pressable } from 'react-native';
import { WebView } from 'react-native-webview';
import { generateCombinedHtml } from './WebViewBuilder';
import { gameScale } from '../../../../Components/Responsiveness/gameResponsive';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const Output = ({ 
  actualResult = "", 
  isCorrect = null,
  style = {},
  currentQuestion,
  selectedAnswers = [],
  showLiveHTML = false,
  options = [],
  displayMode = 'gameQuestion',
  showWebViewInScreenPlay = false,
  onWebViewToggle = null,
  // New: expected output toggle
  showExpectedInScreenPlay = false,
  onExpectedToggle = null,
}) => {
  const [htmlOutput, setHtmlOutput] = useState('');
  // REMOVED autoHideTimerRef

   const generateHtmlOutput = useCallback(() => {
    const userAnswers = selectedAnswers.map(index => options?.[index]).filter(Boolean);
    return generateCombinedHtml(currentQuestion, userAnswers);
  }, [currentQuestion, selectedAnswers, options]);

    useEffect(() => {
    const newHtmlOutput = generateHtmlOutput();
    setHtmlOutput(newHtmlOutput);
  }, [generateHtmlOutput]);


  //  Memoize should show HTML decision
  const shouldShowHTML = useMemo(() => 
    showLiveHTML && currentQuestion && 
    (currentQuestion.challenge_type === 'fill in the blank' || currentQuestion.challenge_type === 'code with guide'),
    [showLiveHTML, currentQuestion]
  );

  // REMOVED THE useEffect FOR AUTO-HIDE TIMER

  //  Memoize event handlers
  const handleWebViewError = useCallback((error) => {
    console.log('WebView error:', error);
  }, []);

  const handleWebViewLoad = useCallback(() => {
    console.log('WebView loaded');
  }, []);

  // Determine container style based on display mode
  const containerStyle = displayMode === 'gameQuestion' 
    ? styles.containerGameQuestion 
    : styles.containerOverlay;
  
  const webviewContainerStyle = displayMode === 'gameQuestion'
    ? styles.webviewContainerGameQuestion
    : styles.webviewContainerOverlay;

  return (
    <View style={[containerStyle, style]}>
      {shouldShowHTML ? (
        <View style={webviewContainerStyle}>
          <WebView
            key={`output-${currentQuestion?.id}-${selectedAnswers.join('-')}`} // Use key to force reload
            source={{ html: htmlOutput, baseUrl: '' }}
            style={styles.webview}
            scalesPageToFit={false} 
            startInLoadingState={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            originWhitelist={['*']}
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
      
      {displayMode === 'gameQuestion' && onWebViewToggle && (
        <Pressable 
          onPress={onWebViewToggle}
          style={styles.webViewToggleButton}
        >
          <Text style={styles.webViewToggleText}>
            {showWebViewInScreenPlay ? 'Hide Screen' : 'Show Screen'}
          </Text>
        </Pressable>
      )}
      {/* Expected output toggle button (same style) - show when a toggle handler provided
          and when either in gameQuestion or overlay display so it's available on-screen */}
      {(onExpectedToggle && displayMode === 'gameQuestion') && (
        <Pressable 
          onPress={onExpectedToggle}
          style={[styles.webViewToggleButton, styles.expectedToggleButton]}
        >
          <Text style={styles.webViewToggleText}>
            {showExpectedInScreenPlay ? 'Hide Expected' : 'Show Expected'}
          </Text>
        </Pressable>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  // ... (styles remain the same as the original file)
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    height: '100%',
  },
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
  outputContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 15, 
    borderWidth: 1,
    borderColor: '#e9ecef',
    minHeight: 0, 
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
  webViewToggleButton: {
    position: 'absolute',
    bottom: gameScale(300),
    right: gameScale(12),
    backgroundColor: '#3c3c3c',
    paddingVertical: gameScale(7),
    paddingHorizontal: gameScale(14),
    borderRadius: gameScale(20),
    borderTopWidth: gameScale(1),
    borderLeftWidth: gameScale(1),
    borderRightWidth: gameScale(1),
    borderTopColor: '#555',
    borderLeftColor: '#555',
    borderRightColor: '#555',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: gameScale(-1) },
    shadowOpacity: 0.2,
    shadowRadius: gameScale(2),
    elevation: gameScale(3),
    zIndex: 10,
  },
  expectedToggleButton: {
    position: 'absolute',
    right: gameScale(12),
    bottom: gameScale(240),
    zIndex: 11,
    elevation: gameScale(4),
  },
  webViewToggleText: {
    color: '#d1d5d9',
    fontSize: gameScale(10),
    fontFamily: 'DynaPuff',
    fontWeight: '500',
  },
});

// REVERTED MEMOIZATION comparison
export default React.memo(Output, (prevProps, nextProps) => {
  return (
    prevProps.actualResult === nextProps.actualResult &&
    prevProps.isCorrect === nextProps.isCorrect &&
    prevProps.showLiveHTML === nextProps.showLiveHTML &&
    prevProps.displayMode === nextProps.displayMode &&
    prevProps.showWebViewInScreenPlay === nextProps.showWebViewInScreenPlay &&
    prevProps.showExpectedInScreenPlay === nextProps.showExpectedInScreenPlay &&
    // REMOVED runButtonClicked comparison
    prevProps.currentQuestion?.question === nextProps.currentQuestion?.question &&
    prevProps.currentQuestion?.challenge_type === nextProps.currentQuestion?.challenge_type &&
    JSON.stringify(prevProps.selectedAnswers) === JSON.stringify(nextProps.selectedAnswers)
  );
});
