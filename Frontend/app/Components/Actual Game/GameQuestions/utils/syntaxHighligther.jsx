import React from 'react';
import { Text, StyleSheet } from 'react-native';

// --- THEME DEFINITIONS ---
// Define color palettes for different themes. Easily add more themes here.
const themes = {
  oneDarkPro: {
    default: '#ABB2BF',
    comment: '#5C6370',
    keyword: '#C678DD',
    tag: '#E06C75', // HTML tags, CSS tag selectors
    attribute: '#D19A66', // HTML attributes
    string: '#98C379',
    number: '#D19A66', // Numbers, CSS units, hex colors
    operator: '#56B6C2',
    punctuation: '#ABB2BF',
    function: '#61AFEF',
    className: '#E5C07B', // CSS classes/IDs
    property: '#D19A66', // CSS properties
    value: '#E5C07B', // Fallback for CSS values
    doctype: '#56B6C2',
  },
  default: {
    default: '#f8f8f2',
    comment: '#75715E',
    keyword: '#f92672',
    tag: '#f92672',
    attribute: '#a6e22e',
    string: '#e6db74',
    number: '#ae81ff',
    operator: '#f92672',
    punctuation: '#f8f8f2',
    function: '#66d9ef',
    className: '#a6e22e',
    property: '#66d9ef',
    value: '#e6db74',
    doctype: '#75715E',
  }
};

// --- DYNAMIC STYLESHEET CREATOR ---
// Creates styles based on the selected theme
const createStyles = (theme) => StyleSheet.create({
  defaultText: { color: theme.default, fontFamily: 'monospace' },
  comment: { color: theme.comment, fontStyle: 'italic', fontFamily: 'monospace' },
  keyword: { color: theme.keyword, fontWeight: 'bold', fontFamily: 'monospace' },
  tag: { color: theme.tag, fontWeight: 'bold', fontFamily: 'monospace' },
  attribute: { color: theme.attribute, fontFamily: 'monospace' },
  string: { color: theme.string, fontFamily: 'monospace' },
  number: { color: theme.number, fontFamily: 'monospace' },
  operator: { color: theme.operator, fontWeight: 'bold', fontFamily: 'monospace' },
  punctuation: { color: theme.punctuation, fontFamily: 'monospace' },
  function: { color: theme.function, fontFamily: 'monospace' },
  className: { color: theme.className, fontWeight: 'bold', fontFamily: 'monospace' },
  property: { color: theme.property, fontFamily: 'monospace' },
  value: { color: theme.value, fontFamily: 'monospace' },
  doctype: { color: theme.doctype, fontStyle: 'italic', fontFamily: 'monospace' },
});

// --- SYNTAX HIGHLIGHTING LOGIC ---
export const renderHighlightedText = (text, language = 'html', themeName = 'oneDarkPro') => {
  if (!text) return null;

  const selectedTheme = themes[themeName] || themes.oneDarkPro;
  const styles = createStyles(selectedTheme);

  const patterns = {
    html: [
      { pattern: /(<!--[\s\S]*?-->)/g, style: styles.comment },
      { pattern: /(<!DOCTYPE[^>]*>)/g, style: styles.doctype },
      { pattern: /(<\/?[a-zA-Z0-9\s-]+>?)/g, style: styles.tag },
      { pattern: /([\w-]+(?==))/g, style: styles.attribute },
      { pattern: /(".*?"|'.*?')/g, style: styles.string },
      { pattern: /([<>=\/])/g, style: styles.punctuation },
    ],
    css: [
      { pattern: /(\/\*[\s\S]*?\*\/)/g, style: styles.comment },
      { pattern: /(".*?"|'.*?')/g, style: styles.string },
      { pattern: /((?:\.|#|::?)[a-zA-Z0-9_-]+)/g, style: styles.className },
      { pattern: /([a-zA-Z-]+(?=:))/g, style: styles.property },
      { pattern: /(#[\da-fA-F]{3,6}\b|-?\d*\.?\d+(?:px|%|em|rem|vw|vh|s|ms|deg)?\b)/g, style: styles.number },
      { pattern: /(\b(?:absolute|relative|fixed|bold|italic|none|center|block|inline-block|auto|inherit|initial|sans-serif|arial)\b)/g, style: styles.keyword },
      { pattern: /(\b(?:body|h1|h2|h3|p|div|span|a|ul|li|img|html)\b)/g, style: styles.tag },
      { pattern: /([:;{}()>])/g, style: styles.punctuation },
    ],
    javascript: [
      { pattern: /(\/\*[\s\S]*?\*\/|\/\/.*)/g, style: styles.comment },
      { pattern: /(".*?"|'.*?'|`.*?`)/g, style: styles.string },
      { pattern: /(\b(?:const|let|var|function|return|if|else|for|while|import|export|from|async|await|new|this|class|extends|super)\b)/g, style: styles.keyword },
      { pattern: /(\b(?:true|false|null|undefined)\b)/g, style: styles.number },
      { pattern: /(\b\d+(?:\.\d+)?\b)/g, style: styles.number },
      { pattern: /((?<=\.)[a-zA-Z_]\w*)/g, style: styles.property },
      { pattern: /([a-zA-Z_]\w*(?=\())/g, style: styles.function },
      { pattern: /([=+\-*/%<>!&|?:])/g, style: styles.operator },
      { pattern: /([{}()\[\],;.])/g, style: styles.punctuation },
    ]
  };

  const languagePatterns = patterns[language] || patterns.html;
  let segments = [{ text, style: styles.defaultText }];

  languagePatterns.forEach(({ pattern, style }) => {
    let newSegments = [];
    segments.forEach(segment => {
      // Only process segments that haven't been styled yet
      if (segment.style === styles.defaultText && segment.text) {
        const parts = segment.text.split(pattern);
        
        parts.forEach((part, index) => {
          if (part) { 
            const isMatch = index % 2 === 1;
            newSegments.push({
              text: part,
              style: isMatch ? style : styles.defaultText,
            });
          }
        });
      } else {
        // If the segment is already styled, or empty, keep it as is.
        newSegments.push(segment);
      }
    });
    // Replace the old segments with the newly refined ones for the next pattern.
    segments = newSegments;
  });

  return segments.map((segment, index) => (
    <Text key={index} style={segment.style}>
      {segment.text}
    </Text>
  ));
};