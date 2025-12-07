import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Animated, Text, Image } from 'react-native';
import { gameScale } from '../../../Responsiveness/gameResponsive';


const Coin = ({ 
  coins = 0,
  onCoinsChange = null,
  animated = true
}) => {
  const [animatedValue] = useState(new Animated.Value(1));
  const [previousCoins, setPreviousCoins] = useState(coins);

  // 3-Layer border colors - Gold/Orange theme for coins
  const borderColors = {
    outerBg: '#5f4a1e',
    outerBorderTop: '#332a0d',
    outerBorderBottom: '#876d2d',
    middleBg: '#4a3a15',
    middleBorderTop: '#d9a84a',
    middleBorderBottom: '#291f0a',
    innerBg: 'rgba(217, 168, 74, 0.15)',
    innerBorder: 'rgba(217, 168, 74, 0.3)',
  };

  // Animate coin when value changes
  useEffect(() => {
    if (animated && coins !== previousCoins) {
      const isIncrease = coins > previousCoins;
      
      if (isIncrease) {
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1.3,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 0.7,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
      
      setPreviousCoins(coins);
      
      if (onCoinsChange) {
        onCoinsChange(coins);
      }
    }
  }, [coins, previousCoins, animated, onCoinsChange]);

  return (
    <View style={styles.container}>
      {/* 3-Layer Border - Outer */}
      <View style={[
        styles.borderOuter,
        {
          backgroundColor: borderColors.outerBg,
          borderTopColor: borderColors.outerBorderTop,
          borderLeftColor: borderColors.outerBorderTop,
          borderBottomColor: borderColors.outerBorderBottom,
          borderRightColor: borderColors.outerBorderBottom,
        }
      ]}>
        {/* 3-Layer Border - Middle */}
        <View style={[
          styles.borderMiddle,
          {
            backgroundColor: borderColors.middleBg,
            borderTopColor: borderColors.middleBorderTop,
            borderLeftColor: borderColors.middleBorderTop,
            borderBottomColor: borderColors.middleBorderBottom,
            borderRightColor: borderColors.middleBorderBottom,
          }
        ]}>
          {/* 3-Layer Border - Inner */}
          <View style={[
            styles.borderInner,
            {
              backgroundColor: borderColors.innerBg,
              borderColor: borderColors.innerBorder,
            }
          ]}>
            <Animated.View
              style={[
                styles.coinRow,
                {
                  transform: animated 
                    ? [{ scale: animatedValue }]
                    : [{ scale: 1 }]
                }
              ]}
            >
              <Image 
                source={{ uri: 'https://github.com/user-attachments/assets/cdbba724-147a-41fa-89c5-26e7252c66cd' }} 
                style={styles.coinImage} 
              />
              <Text style={styles.coinText}>{coins}</Text>
            </Animated.View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: gameScale(30),
    left: gameScale(34),
    zIndex: 10,
  },
  
  // 3-Layer Border styles
  borderOuter: {
    borderRadius: gameScale(14),
    borderWidth: gameScale(1),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: gameScale(2) },
    shadowOpacity: 0.3,
    shadowRadius: gameScale(4),
    elevation: 4,
  },
  borderMiddle: {
    borderRadius: gameScale(12),
    borderWidth: gameScale(1),
  },
  borderInner: {
    borderRadius: gameScale(10),
    borderWidth: gameScale(1),
    paddingHorizontal: gameScale(15),
  },

  coinImage: {
    width: gameScale(16),
    height: gameScale(16),
    resizeMode: 'contain',
  },
  coinRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinText: {
    fontSize: gameScale(10), 
    fontFamily: 'DynaPuff',
    color: '#ffffffff',
    marginLeft: gameScale(4),
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: gameScale(1), height: gameScale(1) }, 
    textShadowRadius: gameScale(2),
  },
});

export default Coin;