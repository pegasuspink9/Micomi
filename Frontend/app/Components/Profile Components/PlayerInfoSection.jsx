import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { gameScale } from '../Responsiveness/gameResponsive';

const PlayerInfoSection = ({ playerName, username }) => (
  <View style={styles.playerSection}>
    <Text style={styles.playerName}>{playerName}</Text>
    <Text style={styles.username}>{username}</Text>
  </View>
);

const styles = StyleSheet.create({
  playerSection: {
    alignItems: 'flex-start',
    left: gameScale(16),
    top: gameScale(9),
    marginBottom: gameScale(12),
  },
  playerName: {
    fontSize: gameScale(28),
    fontFamily: 'MusicVibes',
    color: 'white',
    marginBottom: gameScale(2),
    textShadowColor: '#000000ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    elevation: 0,
  },
  username: {
    fontSize: gameScale(14),
    color: '#c2c2c2ff',
    fontFamily: 'DynaPuff',
    marginBottom: gameScale(18),
  },
});

export default PlayerInfoSection;