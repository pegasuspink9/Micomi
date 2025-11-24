import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { renderHighlightedText } from '../utils/syntaxHighligther';
import {
  scale,
  scaleWidth,
  RESPONSIVE
} from '../../../Responsiveness/gameResponsive';

const FileViewer = ({ fileContent }) => {
  const lines = useMemo(() => (fileContent || '').split('\n'), [fileContent]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContentContainer}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled={true}
    >
      {lines.map((line, lineIndex) => (
        <View key={lineIndex} style={styles.codeLine}>
          <View style={styles.lineNumberContainer}>
            <Text style={styles.lineNumber}>{lineIndex + 1}</Text>
          </View>
          <View style={styles.lineContent}>
            <Text style={styles.codeText}>
              {renderHighlightedText(line)}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000d2f99',
    flex: 1,
    paddingVertical: RESPONSIVE.margin.md,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: scale(100),
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
    paddingHorizontal: scale(8),
  },
  lineNumber: {
    color: '#ffffff7e',
    fontSize: RESPONSIVE.fontSize.xs,
    fontFamily: 'monospace',
  },
  lineContent: {
    flex: 1,
    paddingHorizontal: RESPONSIVE.margin.md,
  },
  codeText: {
    color: '#f8f8f2',
    fontFamily: 'monospace',
    fontSize: RESPONSIVE.fontSize.md,
  },
});

export default FileViewer;