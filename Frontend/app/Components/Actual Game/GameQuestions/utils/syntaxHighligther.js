import React from 'react';
import { Text, StyleSheet } from 'react-native';

export const renderHighlightedText = (text) => {
  const htmlPatterns = [
    { pattern: /(<\/?[^>]+>)/g, style: styles.htmlTag },
    { pattern: /(<!DOCTYPE[^>]*>)/g, style: styles.doctype },
    { pattern: /(\w+)(?==)/g, style: styles.attribute },
    { pattern: /(".*?")/g, style: styles.string },
    { pattern: /(=)/g, style: styles.operator },
  ];
  
  let segments = [{ text, style: styles.defaultText }];
  
  htmlPatterns.forEach(({ pattern, style }) => {
    segments = segments.flatMap(segment => {
      if (segment.style === styles.defaultText) {
        return segment.text.split(pattern).map((part, index) => ({
          text: part,
          style: pattern.test(part) ? style : styles.defaultText
        }));
      }
      return segment;
    });
  });
  
  return segments.map((segment, index) => (
    <Text key={index} style={segment.style}>
      {segment.text}
    </Text>
  ));
};

// Syntax highlighting styles kept in this file
const styles = StyleSheet.create({
  htmlTag: {
    color: '#ff6b6b', 
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  
  doctype: {
    color: '#4ecdc4',
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  
  attribute: {
    color: '#45b7d1',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  
  string: {
    color: '#96ceb4',
    fontFamily: 'monospace',
    fontWeight: '500',
  },
  
  operator: {
    color: '#feca57', 
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  
  defaultText: {
    color: '#f8f8f2',
    fontFamily: 'monospace',
  },
});


