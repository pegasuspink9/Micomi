import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { gameScale } from '../Components/Responsiveness/gameResponsive';

export default function PracticeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Coming soon!!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e', // A dark background for the practice screen
  },
  title: {
    fontSize: gameScale(30),
    fontFamily: 'Grobold',
    color: '#e0e0e0',
    marginBottom: gameScale(10),
  },
  subtitle: {
    fontSize: gameScale(16),
    fontFamily: 'DynaPuff',
    color: '#b0b0b0',
    textAlign: 'center',
    paddingHorizontal: gameScale(20),
  },
});