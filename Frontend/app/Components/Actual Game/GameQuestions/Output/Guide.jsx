import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput } from 'react-native';
import { WebView } from 'react-native-webview';
import { renderHighlightedText } from '../utils/syntaxHighligther';
import { 
  scale, 
  scaleWidth, 
  RESPONSIVE 
} from '../../../Responsiveness/gameResponsive';

// --- 1. MOVED OUTSIDE TO PREVENT REMOUNTING GLITCHES ---
const generateExampleOutput = (exampleCode) => {
  if (!exampleCode) return '';

  let htmlCode = exampleCode.trim();

  if (!htmlCode.includes('<!DOCTYPE')) {
    htmlCode = `<!DOCTYPE html>\n${htmlCode}`;
  }

  if (!htmlCode.includes('<html>')) {
    htmlCode = `<html>\n<head>
      <title>Example Output</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        html, body { margin: 0; padding: 0; height: auto; }
        body { 
          font-family: Arial, sans-serif; 
          font-size: 18px; 
          line-height: 1.6; 
          padding: 15px; 
          color: #333;
          overflow-wrap: break-word;
        }
        h1, h2, h3 { color: #2c3e50; margin-bottom: 15px; margin-top: 0; }
        p { margin-bottom: 15px; margin-top: 0; }
      </style>
    </head>\n<body>\n${htmlCode}\n</body>\n</html>`;
  }

  return htmlCode;
};

const webViewInjectedJS = `
  (function() {
    var lastHeight = 0;
    function sendHeight() {
      var body = document.body;
      var html = document.documentElement;
      var height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
      if (height !== lastHeight && height > 0) {
        lastHeight = height;
        window.ReactNativeWebView.postMessage(height.toString());
      }
    }
    var observer = new MutationObserver(sendHeight);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true });
    window.addEventListener('load', sendHeight);
    window.addEventListener('resize', sendHeight);
    sendHeight();
    setTimeout(sendHeight, 100);
    setTimeout(sendHeight, 500);
  })();
  true;
`;

const ExampleOutput = ({ exampleCode, exampleKey }) => {
  const [htmlOutput, setHtmlOutput] = useState('');
  const [webViewHeight, setWebViewHeight] = useState(scale(10)); 
  const [hasMeasured, setHasMeasured] = useState(false);

  useEffect(() => {
    setHtmlOutput(generateExampleOutput(exampleCode));
  }, [exampleCode]);

  const onWebViewMessage = (event) => {
    try {
      const height = Number(event.nativeEvent.data);
      if (!isNaN(height) && height > 0) {
        setWebViewHeight(height); 
        setHasMeasured(true);
      }
    } catch (e) {
      console.warn("Failed to parse WebView height", e);
    }
  };

  const hasVisibleContent = exampleCode && 
    exampleCode.trim().length > 0 && 
    !/^[\s<>/]*$/.test(exampleCode) && 
    exampleCode.includes('<') && 
    htmlOutput && htmlOutput.trim().length > 0 && 
    /<body[^>]*>[\s\S]*?<\/body>/.test(htmlOutput) && 
    /<body[^>]*>[\s\S]*?<\/body>/.exec(htmlOutput)[0].replace(/<[^>]*>/g, '').trim().length > 0;

  if (!hasVisibleContent) return null;

  return (
    <View style={[styles.exampleOutputContainer, { opacity: hasMeasured ? 1 : 0 }]}>
      <Text style={styles.exampleOutputLabel}>Output:</Text>
      <View style={[styles.exampleWebviewContainer, { height: webViewHeight }]}>
        <WebView
          key={exampleKey} 
          source={{ html: htmlOutput }}
          style={styles.exampleWebview}
          onMessage={onWebViewMessage}
          injectedJavaScript={webViewInjectedJS}
          scrollEnabled={false} 
          scalesPageToFit={false} 
          javaScriptEnabled={true}
          domStorageEnabled={true}
          originWhitelist={['*']}
        />
      </View>
    </View>
  );
};

const InteractiveEditor = ({ initialCode }) => {
  const [code, setCode] = useState(initialCode || '<h1>Hello World!</h1>\n<p>Welcome to Micomi.</p>');
  const [debouncedCode, setDebouncedCode] = useState(code);
  const [webViewHeight, setWebViewHeight] = useState(scale(10)); // Increased default initial height
  const [hasMeasured, setHasMeasured] = useState(false);

  // --- 2. ADDED DEBOUNCE TO PREVENT FLICKERING WHILE TYPING ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCode(code);
    }, 500); // Waits 500ms after you stop typing to update the output
    return () => clearTimeout(timer);
  }, [code]);

  const htmlOutput = useMemo(() => generateExampleOutput(debouncedCode), [debouncedCode]);

  const onWebViewMessage = (event) => {
    try {
      const height = Number(event.nativeEvent.data);
      if (!isNaN(height) && height > 0) {
        setWebViewHeight(height); 
        setHasMeasured(true);
      }
    } catch (e) {
      console.warn("Failed to parse WebView height", e);
    }
  };
  
  const lines = code.split('\n');

  return (
    <View style={styles.interactiveSection}>
      <Text style={styles.interactiveTitle}>Try it yourself 🚀</Text>
      
      <View style={styles.interactiveEditorContainer}>
        <View style={styles.interactiveHeader}>
          <View style={styles.windowControls}>
            <View style={[styles.windowButton, { backgroundColor: '#ff5f56' }]} />
            <View style={[styles.windowButton, { backgroundColor: '#ffbd2e' }]} />
            <View style={[styles.windowButton, { backgroundColor: '#27ca3f' }]} />
          </View>
          <Text style={styles.interactiveHeaderText}>index.html</Text>
        </View>

        <View style={styles.interactiveBody}>
          <View style={styles.interactiveLineNumbers}>
            {lines.map((_, i) => (
              <Text key={i} style={styles.interactiveLineNumberText}>{i + 1}</Text>
            ))}
          </View>
          
          <View style={styles.interactiveInputWrapper}>
            <Text style={styles.interactiveHighlightedLayer} pointerEvents="none">
              {lines.map((line, i) => (
                <React.Fragment key={i}>
                  {renderHighlightedText(line)}
                  {i < lines.length - 1 ? '\n' : ''}
                </React.Fragment>
              ))}
            </Text>
            
            <TextInput
              style={styles.interactiveInput}
              multiline={true}
              value={code}
              onChangeText={setCode}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              placeholder="Type your HTML here..."
              placeholderTextColor="#75715E"
              cursorColor="#f8f8f2"
            />
          </View>
        </View>
      </View>

      <Text style={styles.interactiveOutputLabel}>Output:</Text>
      <View style={[styles.exampleWebviewContainer, { height: webViewHeight, opacity: hasMeasured ? 1 : 0 }]}>
        <WebView
          source={{ html: htmlOutput }}
          style={styles.exampleWebview}
          onMessage={onWebViewMessage}
          injectedJavaScript={webViewInjectedJS}
          scrollEnabled={false}
          scalesPageToFit={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          originWhitelist={['*']}
        />
      </View>
    </View>
  );
};

// --- MAIN GUIDE COMPONENT ---
const Guide = ({ currentQuestion, isFullPageLesson = false }) => {

  const renderStyledContent = (content) => {
    const parts = [];
    let lastIndex = 0;
    
    const tokenRegex = /\*(.*?)\*|`(.*?)`|(<[^>]+>)/g;
    
    let match;

    while ((match = tokenRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.substring(lastIndex, match.index),
        });
      }

      if (match[1]) {
        parts.push({
          type: 'bold',
          content: match[1],
        });
      } else if (match[2]) {
        parts.push({
          type: 'code_inline', 
          content: match[2],
        });
      } else if (match[3]) {
        parts.push({
          type: 'tag',
          content: match[3],
        });
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex),
      });
    }

    return parts.map((part, idx) => {
      let style = styles.guidePlainText;

      if (part.type === 'tag') {
        style = styles.htmlTag;
      } else if (part.type === 'bold') {
        style = styles.guideBoldText; 
      } else if (part.type === 'code_inline') {
        style = styles.guideInlineCode; 
      }
      
      return (
        <Text key={idx} style={style}>
          {part.content}
        </Text>
      );
    });
  };

  const renderGuideContent = (guideText) => {
    if (!guideText) return <Text style={styles.guideText}>No guide available for this level.</Text>;

    const normalizedText = guideText.replace(/\\n/g, '\n');
    const lines = normalizedText.split('\n');
    const result = [];
    let i = 0;
    let exampleCounter = 0;
    let lastExampleCode = ''; 

    while (i < lines.length) {
      const line = lines[i];
      const trimmedLine = line.trim();

      if (isFullPageLesson && trimmedLine.startsWith('--') && trimmedLine.endsWith('--')) {
        const headerText = trimmedLine.substring(2, trimmedLine.length - 2);
        result.push(
          <Text key={`header-${i}`} style={styles.guideHeader}>
            {headerText}
          </Text>
        );
        i++;
        continue;
      }

      if (trimmedLine === 'Try it yourself') {
        result.push(<InteractiveEditor key={`interactive-${i}`} initialCode={lastExampleCode} />);
        i++;
        while (i < lines.length && (lines[i].trim() === 'Run' || lines[i].trim() === 'Output' || lines[i].trim() === '')) {
          i++;
        }
        continue;
      }

      if (trimmedLine.startsWith('Example:')) {
        const exampleLines = [];
        
        const firstLineContent = line.substring(8).trim(); 
        if (firstLineContent) {
          exampleLines.push(firstLineContent);
        }

        i++; 
        
        while (i < lines.length) {
          const currentLine = lines[i];
          if (currentLine.trim() === 'End of example' || currentLine.trim() === 'Try it yourself') {
             if (currentLine.trim() === 'End of example') i++;
             break;
          }
          exampleLines.push(currentLine);
          i++;
        }

        let startIndex = 0;
        while (startIndex < exampleLines.length && exampleLines[startIndex].trim() === '') startIndex++;
        let endIndex = exampleLines.length - 1;
        while (endIndex >= 0 && exampleLines[endIndex].trim() === '') endIndex--;

        const cleanExampleLines = exampleLines.slice(startIndex, endIndex + 1);
        const exampleCode = cleanExampleLines.join('\n');
        
        lastExampleCode = exampleCode; 
        const exampleKey = `example-${exampleCounter}`;

        if (exampleCode.length > 0) {
            result.push(
            <View key={exampleKey} style={styles.exampleSection}>
                <View style={styles.exampleContainer}>
                <View style={styles.exampleCodeBox}>
                    {cleanExampleLines.map((codeLine, lineIdx) => (
                    <View key={lineIdx} style={styles.codeLine}>
                        <View style={styles.lineNumberContainer}>
                        <Text style={styles.lineNumber}>{lineIdx + 1}</Text>
                        </View>
                        <View style={styles.lineContent}>
                        <Text style={styles.exampleCode}>
                            {renderHighlightedText(codeLine)}
                        </Text>
                        </View>
                    </View>
                    ))}
                </View>
                </View>
                <ExampleOutput exampleCode={exampleCode} exampleKey={exampleKey} />
            </View>
            );
        }

        exampleCounter++;
        continue;
      }

      if (line.trim() !== '') {
        result.push(
          <Text key={`text-${i}`} style={styles.guideLine}>
            {renderStyledContent(line)}
          </Text>
        );
      } else {
        result.push(
          <View key={`space-${i}`} style={{ height: scale(10) }} />
        );
      }

      i++;
    }

    return result;
  };

  return (
    <ScrollView 
      style={styles.guideContainer}
      contentContainerStyle={styles.guideScrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled" 
    >
      <View style={styles.guideContent}>
        {renderGuideContent(currentQuestion?.guide)}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
// ...existing code...
// (Keep all your existing styles exactly as they are)
// ...existing code...
  guideContainer: {
    backgroundColor: '#ffffffff',
    flex: 1,
    width: '100%',
  },

  guideScrollContent: {
    flexGrow: 1,
    padding: RESPONSIVE.margin.lg,
    paddingBottom: scale(100), 
  },

  guideTitle: {
    fontSize: RESPONSIVE.fontSize.lg,
    fontWeight: '600',
    color: '#495057',
    marginBottom: RESPONSIVE.margin.md,
    fontFamily: 'DynaPuff',
  },

  guideContent: {
    flex: 1,
  },

  guideLine: {
    fontSize: RESPONSIVE.fontSize.md,
    color: '#495057',
    lineHeight: scale(24),
    marginBottom: scale(8),
  },

  guideHeader: {
    fontSize: scale(27),
    fontFamily: 'Grobold',
    color: '#0d253f',
    textAlign: 'center',
    marginVertical: scale(12),
    width: '100%',
  },

  guidePlainText: {
    fontFamily: 'Poppins',
    color: '#495057',
  },

  guideBoldText: {
    fontFamily: 'Grobold',
    color: '#0d253f', 
    fontSize: RESPONSIVE.fontSize.md,
  },

  guideInlineCode: {
    fontFamily: 'Grobold',
    color: '#e30a0aff', 
    fontSize: RESPONSIVE.fontSize.md,
  },

  htmlTag: {
    fontFamily: 'Poppins',
    color: '#e30000ff',
    fontWeight: '600',
  },

  guideAllCaps: {
    fontFamily: 'Poppins',
    color: '#0077ffff',
  },

  exampleSection: {
    marginVertical: scale(16),
  },

  exampleContainer: {
    marginVertical: scale(12),
    paddingLeft: scale(12),
  },

  exampleCodeBox: {
    backgroundColor: '#000d2fff',
    borderRadius: scale(4),
    marginBottom: scale(8),
    overflow: 'hidden',
    borderTopWidth: scale(2),
    borderTopColor: '#4a4a4a',
  },

  codeLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: scale(20),
    paddingVertical: scale(2),
  },

  lineNumberContainer: {
    minWidth: scaleWidth(30),
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRightWidth: scale(1),
    borderRightColor: '#3a3a3a',
    paddingHorizontal: scale(8),
  },

  lineNumber: {
    color: '#ffffff7e',
    fontSize: RESPONSIVE.fontSize.xs,
    fontFamily: 'monospace',
    fontWeight: '400',
  },

  lineContent: {
    flex: 1,
    paddingHorizontal: RESPONSIVE.margin.md,
    justifyContent: 'center',
  },

  exampleCode: {
    fontSize: RESPONSIVE.fontSize.md,
    fontFamily: 'monospace',
    color: '#f8f8f2',
    lineHeight: scale(20),
  },

  exampleOutputContainer: {
    marginLeft: scale(12),
    marginBottom: scale(16),
  },

  exampleOutputLabel: {
    fontSize: RESPONSIVE.fontSize.md,
    fontWeight: '600',
    color: '#495057',
    fontFamily: 'DynaPuff',
    marginBottom: scale(6),
  },
  
  interactiveOutputLabel: {
    fontSize: RESPONSIVE.fontSize.md,
    fontWeight: '600',
    color: '#ffffff', 
    fontFamily: 'DynaPuff',
    marginBottom: scale(6),
  },

  exampleWebviewContainer: {
    backgroundColor: '#fff',
    borderRadius: scale(6),
    borderWidth: scale(1),
    borderColor: '#e9ecef',
    overflow: 'hidden'
  },

  exampleWebview: {
    backgroundColor: 'transparent', 
    width: '100%',
  },

   interactiveSection: {
    marginVertical: scale(20),
    padding: scale(15),
    backgroundColor: '#0d4277',
    borderRadius: scale(10),
    borderWidth: scale(2),
    borderColor: '#065290',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
    elevation: 3,
  },

  interactiveTitle: {
    fontSize: RESPONSIVE.fontSize.lg,
    color: '#ffffff',
    fontFamily: 'DynaPuff',
    marginBottom: scale(12),
  },

  interactiveEditorContainer: {
    backgroundColor: '#1e1e1e32',
    borderRadius: scale(12),
    overflow: 'hidden',
    borderTopColor: '#4a4a4a',
    borderLeftWidth: scale(1),
    borderLeftColor: '#3a3a3a',
    borderBottomWidth: scale(4),
    borderBottomColor: '#0a0a0a',
    borderRightWidth: scale(1),
    borderRightColor: '#3a3a3a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(8) },
    shadowOpacity: 0.4,
    shadowRadius: scale(12),
    elevation: scale(16),
    marginBottom: scale(16),
  },

  interactiveHeader: {
    backgroundColor: '#2d2d30',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    borderTopWidth: scale(1),
    borderTopColor: '#505050',
  },

  windowControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  windowButton: {
    width: scale(10),
    height: scale(10),
    borderRadius: scale(6),
    marginRight: scale(8),
    borderTopWidth: scale(1),
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: scale(1),
    borderBottomColor: 'rgba(0, 0, 0, 0.5)',
  },

  interactiveHeaderText: {
    color: '#d1d5d9',
    fontSize: RESPONSIVE.fontSize.xs,
    fontFamily: 'DynaPuff',
    marginLeft: scale(10),
  },

  interactiveBody: {
    flexDirection: 'row',
    backgroundColor: '#000d2f',
    minHeight: scale(120),
  },

  interactiveLineNumbers: {
    paddingVertical: scale(12),
    paddingHorizontal: scale(8),
    backgroundColor: '#1e1e1e',
    borderRightWidth: scale(1),
    borderRightColor: '#3a3a3a',
    alignItems: 'center',
    minWidth: scaleWidth(35),
  },

   interactiveLineNumberText: {
    color: '#ffffff7e',
    fontSize: RESPONSIVE.fontSize.xs,
    fontFamily: 'monospace',
    lineHeight: scale(20),
  },

  interactiveInputWrapper: {
    flex: 1,
    position: 'relative',
  },

  interactiveHighlightedLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: scale(12),
    paddingTop: scale(12),
    fontFamily: 'monospace',
    fontSize: RESPONSIVE.fontSize.md,
    lineHeight: scale(20),
    textAlignVertical: 'top',
    includeFontPadding: false, 
  },

  interactiveInput: {
    flex: 1,
    color: 'rgba(255, 255, 255, 0)',
    backgroundColor: 'transparent',
    fontFamily: 'monospace',
    fontSize: RESPONSIVE.fontSize.md,
    padding: scale(12),
    paddingTop: scale(12),
    textAlignVertical: 'top',
    lineHeight: scale(20),
    includeFontPadding: false, 
  },

  editorContainer: {
    backgroundColor: '#000d2fff', 
    borderRadius: scale(6),
    borderWidth: scale(2),
    borderColor: '#4a4a4a',
    marginBottom: scale(16),
    overflow: 'hidden',
  },

  editorInput: {
    color: '#f8f8f2', 
    fontFamily: 'monospace',
    fontSize: RESPONSIVE.fontSize.md,
    minHeight: scale(120), 
    padding: scale(12),
    textAlignVertical: 'top', 
  },
});

export default Guide;