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
      return '<html><body><p>No question content available.</p></body></html>';
    }

    const questionType = currentQuestion.challenge_type;
    
    if (questionType !== 'fill in the blank' && questionType !== 'code with guide') {
      return '<html><body></body></html>';
    }

    // 1. Get the main content by filling in the blanks
    let bodyContent = currentQuestion.question;
    const answersArray = selectedAnswers.map(index => options?.[index]).filter(answer => answer && typeof answer === 'string');
    
    answersArray.forEach((answer) => {
      bodyContent = bodyContent.replace('_', answer);
    });
    // Remove any remaining unanswered blanks
    bodyContent = bodyContent.replace(/_/g, '');

    // 2. Get the content from the separate file fields
    const cssContent = currentQuestion.css_file || '';
    const jsContent = currentQuestion.javascript_file || '';

    // 3. Construct the final HTML document, injecting CSS and JS
    const finalHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Live Output</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
          <style>
            /* --- Injected CSS from Challenge --- */
            ${cssContent}
          </style>
        </head>
        <body>
          ${bodyContent}
          
          <!-- --- Injected JavaScript from Challenge --- -->
          <script>
            try {
              ${jsContent}
            } catch (e) {
              // Create a visual error overlay in the HTML if JS fails
              const errorDiv = document.createElement('div');
              errorDiv.style.position = 'fixed';
              errorDiv.style.bottom = '0';
              errorDiv.style.left = '0';
              errorDiv.style.right = '0';
              errorDiv.style.backgroundColor = '#ff5f56';
              errorDiv.style.color = 'white';
              errorDiv.style.padding = '10px';
              errorDiv.style.fontFamily = 'monospace';
              errorDiv.style.zIndex = '10000';
              errorDiv.innerText = 'JavaScript Error: ' + e.message;
              document.body.appendChild(errorDiv);
            }
          </script>
        </body>
      </html>
    `;

    return finalHtml;
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