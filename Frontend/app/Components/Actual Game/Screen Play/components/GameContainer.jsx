import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { gameScale } from '../../../Responsiveness/gameResponsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');


const GameContainer = ({ children, borderColor }) => {
  return (
    <View style={styles.outerFrame}>
      {/* 3-Layer Cabinet Border */}
      <View style={styles.containerBorderOuter}>
        <View style={styles.containerBorderMiddle}>
          <View style={styles.containerBorderInner}>
            <View style={[styles.innerBorderContainer, { borderColor }]}>
              {/* 3-Layer Content Border */}
              <View style={styles.contentBorderOuter}>
                <View style={styles.contentBorderMiddle}>
                  <View style={styles.contentBorderInner}>
                    {children}
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: gameScale(43),
  },
  // 3-Layer Cabinet Border (replacing old container)
  containerBorderOuter: {
    flex: 1,
    backgroundColor: '#1e3a5f',
    borderRadius: gameScale(18),
    padding: gameScale(1),
    borderWidth: gameScale(1),
    borderTopColor: '#2d5a87',
    borderLeftColor: '#2d5a87',
    borderBottomColor: '#2d5a87',
    borderRightColor: '#2d5a87',
  },
  containerBorderMiddle: {
    flex: 1,
    backgroundColor: '#152d4a',
    borderRadius: gameScale(16),
    padding: gameScale(1),
    borderWidth: gameScale(1),
    borderTopColor: '#2c75c3ff',
    borderLeftColor: '#2c75c3ff',
    borderBottomColor: '#2c75c3ff',
    borderRightColor: '#2c75c3ff',
  },
  containerBorderInner: {
    flex: 1,
    backgroundColor: 'rgba(74, 144, 217, 0.15)',
    borderRadius: gameScale(14),
    padding: gameScale(4),
    borderWidth: gameScale(1),
    borderColor: 'rgba(74, 144, 217, 0.3)',
  },
  innerBorderContainer: {
    flex: 1,
    borderWidth: gameScale(6),
    overflow: 'hidden',
    borderRadius: gameScale(31),
    position: 'relative',
    backgroundColor: '#a51010ff',
    borderTopWidth: gameScale(6),
    borderTopColor: '#f0f8ffff', 
    borderLeftWidth: gameScale(6),
    borderLeftColor: '#e0f0ffff',
    borderBottomWidth: gameScale(6),
    borderBottomColor: '#1a4a6aff',
    borderRightWidth: gameScale(6),
    borderRightColor: '#0a4166ff',
  },
  // 3-Layer Content Border (replacing old contentContainer)
  contentBorderOuter: {
    flex: 1,
    backgroundColor: '#d0e8f8',
    borderRadius: gameScale(23),
    padding: gameScale(1),
    borderWidth: gameScale(1),
    borderTopColor: '#e8f4ff',
    borderLeftColor: '#e8f4ff',
    borderBottomColor: '#7a9ab8',
    borderRightColor: '#7a9ab8',
    overflow: 'hidden',
  },
  contentBorderMiddle: {
    flex: 1,
    backgroundColor: '#071c2fff',
    borderRadius: gameScale(21),
    padding: gameScale(1),
    borderWidth: gameScale(1),
    borderTopColor: '#5a7a9a',
    borderLeftColor: '#5a7a9a',
    borderBottomColor: '#5a7a9a',
    borderRightColor: '#5a7a9a',
    overflow: 'hidden',
  },
  contentBorderInner: {
    flex: 1,
    backgroundColor: '#f5f9fc',
    borderRadius: gameScale(19),
    borderWidth: gameScale(1),
    borderColor: 'rgba(138, 180, 213, 0.5)',
    overflow: 'hidden',
  },
});


export default GameContainer;