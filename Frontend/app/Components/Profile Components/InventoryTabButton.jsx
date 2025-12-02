import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gameScale } from '../Responsiveness/gameResponsive';

const InventoryTabButton = ({ label, isActive, onPress }) => {
  return (
    <View style={styles.capsuleWrapper}>
      <View style={[styles.capsuleShadow, isActive && styles.capsuleShadowActive]} />

      <TouchableOpacity 
        activeOpacity={1} 
        onPress={onPress}
        style={[styles.capsuleButton, isActive && styles.capsuleButtonActive]}
      >
        <LinearGradient
          colors={isActive 
            ? ['#0c96a9ff', '#006471ff'] 
            : ['#1598d9ff', '#0f2a38'] 
          }
          style={styles.capsuleGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={styles.capsuleHighlight} />
          
          <Text style={[styles.capsuleText, isActive && styles.capsuleTextActive]}>
            {label}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  capsuleWrapper: {
    flex: 1,
    height: gameScale(38),
    width: gameScale(10)
  },
  capsuleShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    backgroundColor: '#003f52',
    borderRadius: gameScale(24),
  },
  capsuleShadowActive: {
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  capsuleButton: {
    flex: 1,
    marginBottom: gameScale(4),
    borderRadius: gameScale(24),
  },
  capsuleButtonActive: {
    marginBottom: 0,
    marginTop: gameScale(4),
  },
  capsuleGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: gameScale(24),
    borderWidth: gameScale(1),
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  capsuleHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderTopLeftRadius: gameScale(24),
    borderTopRightRadius: gameScale(24),
  },
  capsuleText: {
    fontFamily: 'MusicVibes',
    fontSize: gameScale(15),
    color: '#8baebf',
    textShadowColor: '#000000ff',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 2,
    zIndex: 2,
  },
  capsuleTextActive: {
    color: '#ffffff',
    fontSize: gameScale(15),
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default InventoryTabButton;