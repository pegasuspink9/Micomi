import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Animated, Text, Dimensions, Image } from 'react-native';

const { width } = Dimensions.get('window');

const Coin = ({ 
  coins = 0,
  onCoinsChange = null,
  animated = true
}) => {
  const [animatedValue] = useState(new Animated.Value(1));
  const [previousCoins, setPreviousCoins] = useState(coins);

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
      <View style={styles.coinRow}>
        <Image source={{ uri: 'https://github.com/user-attachments/assets/cdbba724-147a-41fa-89c5-26e7252c66cd' }} style={styles.coinImage} />
        <Text style={styles.coinText}>{coins}</Text>
        <Animated.View
          style={[
            styles.coinContainer,
            {
              transform: animated 
                ? [{ scale: animatedValue }]
                : [{ scale: 1 }]
            }
          ]}
        >
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: 'rgba(252, 159, 20, 0.9)',
    top: width * 0.1,
    left: width * 0.1,
    alignItems: 'flex-end',
    borderRadius: 18,
    paddingLeft: 20,
    borderWidth: 2,
    borderColor: '#ffffffff',
  },
  coinImage: {
    width: width * 0.04, 
    height: width * 0.04, 
    resizeMode: 'contain',
  },
  coinRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinText: {
    fontSize: 10,
    fontFamily: 'DynaPuff',
    color: '#ffffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  coinContainer: {
    marginLeft: 2,
  },
});

export default Coin;