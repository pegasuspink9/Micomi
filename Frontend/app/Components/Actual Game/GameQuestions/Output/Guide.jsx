import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { renderHighlightedText } from '../utils/syntaxHighligther';
import { 
  scale, 
  scaleWidth, 
  scaleHeight, 
  RESPONSIVE 
} from '../../../Responsiveness/gameResponsive';

const Guide = ({ currentQuestion }) => {
  const [exampleOutputs, setExampleOutputs] = useState({});

  const generateExampleOutput = useCallback((exampleCode) => {
    if (!exampleCode) return ''; //  CHANGED: Return empty string instead of default message

    let htmlCode = exampleCode.trim();

    if (!htmlCode.includes('<!DOCTYPE')) {
      htmlCode = `<!DOCTYPE html>\n${htmlCode}`;
    }

    if (!htmlCode.includes('<html>')) {
      htmlCode = `<html>\n<head>
        <title>Example Output</title>
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
  }, []);


const ExampleOutput = useCallback(({ exampleCode, exampleKey }) => {
  const [htmlOutput, setHtmlOutput] = useState('');

  useEffect(() => {
    const output = generateExampleOutput(exampleCode);
    setHtmlOutput(output);
  }, [exampleCode, generateExampleOutput]);

  //  FIXED: Check if body has actual visible content (not empty tags)
  const hasVisibleContent = exampleCode && 
    exampleCode.trim().length > 0 && 
    !/^[\s<>/]*$/.test(exampleCode) && 
    exampleCode.includes('<') && 
    htmlOutput && htmlOutput.trim().length > 0 && 
    /<body[^>]*>[\s\S]*?<\/body>/.test(htmlOutput) && 
    /<body[^>]*>[\s\S]*?<\/body>/.exec(htmlOutput)[0].replace(/<[^>]*>/g, '').trim().length > 0;

  if (!hasVisibleContent) return null;

  return (
    <View style={styles.exampleOutputContainer}>
      <Text style={styles.exampleOutputLabel}>Output:</Text>
      <View style={styles.exampleWebviewContainer}>
        <WebView
          source={{ html: htmlOutput }}
          style={styles.exampleWebview}
          scalesPageToFit={true}
          startInLoadingState={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      </View>
    </View>
  );
}, [generateExampleOutput]);

  const renderStyledContent = (content) => {
    const parts = [];
    let lastIndex = 0;
    const tokenRegex = /(<\/?[^>]+>)|\*([A-Z]+)\*/g;
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
          type: 'tag',
          content: match[1],
        });
      } else if (match[2]) {
        parts.push({
          type: 'allCaps',
          content: match[2],
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

    return parts.map((part, idx) => (
      <Text
        key={idx}
        style={
          part.type === 'tag' 
            ? styles.htmlTag 
            : part.type === 'allCaps'
              ? styles.guideAllCaps
              : styles.guidePlainText
        }
      >
        {part.content}
      </Text>
    ));
  };

  const renderGuideContent = (guideText) => {
    if (!guideText) return <Text style={styles.guideText}>No guide available for this level.</Text>;

    const normalizedText = guideText.replace(/\\n/g, '\n');
    const lines = normalizedText.split('\n');
    const result = [];
    let i = 0;
    let exampleCounter = 0;

    while (i < lines.length) {
      const line = lines[i];

      if (line.trim().startsWith('Example:')) {
        const exampleLines = [];
        const firstLine = line.trim().substring('Example:'.length).trim();
        
        if (firstLine) {
          exampleLines.push(firstLine);
        }

        i++;
        while (i < lines.length) {
          const nextLine = lines[i];
          
          if (nextLine.trim() === '' || /^•/.test(nextLine.trim())) {
            break;
          }
          
          exampleLines.push(nextLine);
          i++;
        }

        const exampleCode = exampleLines.join('\n');
        const exampleKey = `example-${exampleCounter}`;

        //  ADDED: Render example code and its output
        result.push(
          <View key={exampleKey} style={styles.exampleSection}>
            <View style={styles.exampleContainer}>
              <View style={styles.exampleCodeBox}>
                {exampleLines.map((codeLine, lineIdx) => (
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
            {/*  ADDED: Example output below code */}
            <ExampleOutput exampleCode={exampleCode} exampleKey={exampleKey} />
          </View>
        );

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
    >
      <View style={styles.guideContent}>
        {renderGuideContent(currentQuestion?.guide)}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  guideContainer: {
    backgroundColor: '#ffffffff',
    flex: 1,
    width: '100%',
  },

  guideScrollContent: {
    flexGrow: 1,
    padding: RESPONSIVE.margin.lg,
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

  guidePlainText: {
    fontFamily: 'DynaPuff',
    color: '#495057',
  },

  htmlTag: {
    fontFamily: 'MusicVibes',
    color: '#ff0000ff',
    fontWeight: '600',
  },

  guideAllCaps: {
    fontFamily: 'MusicVibes',
    color: '#0077ffff',
  },

  //  ADDED: Example section wrapper
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

  //  ADDED: Example output styles
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

  exampleWebviewContainer: {
    backgroundColor: '#fff',
    borderRadius: scale(6),
    borderWidth: scale(1),
    borderColor: '#e9ecef',
    overflow: 'hidden',
    minHeight: scale(150),
    maxHeight: scale(300),
  },

  exampleWebview: {
    flex: 1,
    backgroundColor: '#fff',
    width: '100%',
    height: '100%',
  },
});

export default Guide;