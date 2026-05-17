import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gameScale } from '../Responsiveness/gameResponsive';

const MissionTabButton = ({ label, count, isActive, onPress }) => {
  const getGradientColors = () => {
    if (isActive) {
      switch (label) {
        case 'Daily':
          return ['#c98930', '#7a4a12']; // Warm golden brown
        case 'Weekly':
          return ['#b87a28', '#6b4010']; // Medium brown
        case 'Monthly':
          return ['#d49a38', '#8b5a18']; // Bright amber brown
        default:
          return ['#c98930', '#7a4a12'];
      }
    }
    // Inactive state - darker muted brown versions
    switch (label) {
      case 'Daily':
        return ['#6b4420', '#3e2208'];
      case 'Weekly':
        return ['#5a3a18', '#2a1500'];
      case 'Monthly':
        return ['#7a5020', '#4a2c10'];
      default:
        return ['#6b4420', '#3e2208'];
    }
  };

  const getShadowColor = () => {
    switch (label) {
      case 'Daily':
        return '#2a1500';
      case 'Weekly':
        return '#1a0e00';
      case 'Monthly':
        return '#3e2208';
      default:
        return '#2a1500';
    }
  };

  return (
    <View style={styles.capsuleWrapper}>
      {/* 3D Shadow Layer */}
      <View style={[
        styles.capsuleShadow, 
        { backgroundColor: getShadowColor() },
        isActive && styles.capsuleShadowActive
      ]} />

      <TouchableOpacity 
        activeOpacity={1} 
        onPress={onPress}
        style={[styles.capsuleButton, isActive && styles.capsuleButtonActive]}
      >
        <LinearGradient
          colors={getGradientColors()}
          style={styles.capsuleGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          {/* Highlight overlay for 3D effect */}
          <View style={styles.capsuleHighlight} />
          
          <View style={styles.contentRow}>
            <Text style={[styles.capsuleText, isActive && styles.capsuleTextActive]}>
              {label}
            </Text>
            <View style={[
              styles.countBadge,
              isActive && styles.activeCountBadge,
            ]}>
              <Text style={[
                styles.countText,
                isActive && styles.activeCountText,
              ]}>
                {count}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  capsuleWrapper: {
    flex: 1,
    height: gameScale(38),
  },
  capsuleShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    borderRadius: gameScale(12),
  },
  capsuleShadowActive: {
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  capsuleButton: {
    flex: 1,
    marginBottom: gameScale(4),
    borderRadius: gameScale(12),
  },
  capsuleButtonActive: {
    marginBottom: 0,
    marginTop: gameScale(4),
  },
  capsuleGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: gameScale(12),
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
    borderTopLeftRadius: gameScale(12),
    borderTopRightRadius: gameScale(12),
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gameScale(6),
    zIndex: 2,
  },
  capsuleText: {
    fontFamily: 'Grobold',
    fontSize: gameScale(12),
    color: 'rgba(255, 255, 255, 1)',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 2,
  },
  capsuleTextActive: {
    color: '#ffffff',
    fontFamily: 'Grobold',
    textShadowOffset: { width: 1, height: 1 },
  },
  countBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: gameScale(6),
    paddingVertical: gameScale(2),
    borderRadius: gameScale(8),
    minWidth: gameScale(20),
    alignItems: 'center',
  },
  activeCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  countText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: gameScale(9),
    fontFamily: 'Grobold',
  },
  activeCountText: {
    color: '#ffffff',
  },
});

export default MissionTabButton;