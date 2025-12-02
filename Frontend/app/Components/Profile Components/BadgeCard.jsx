import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { gameScale } from '../Responsiveness/gameResponsive';

const BadgeCard = ({ badge }) => (
  <View style={[
    styles.badgeCard,
    { opacity: badge.earned ? 1 : 0.4 }
  ]}>
    <Image 
      source={{ uri: badge.icon }} 
      style={[
        styles.badgeIconImage,
        !badge.earned && { tintColor: 'rgba(0, 0, 0, 0.7)' }
      ]}
      resizeMode="contain"
    />
  </View>
);

const styles = StyleSheet.create({
  badgeCard: {
    alignItems: 'center',
    width: '100%',
  },
  badgeIconImage: {
    width: gameScale(120), 
    height: gameScale(120),
    shadowColor: '#000000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 2,
    elevation: 3,
    overflow: 'hidden',
  },
});

export default BadgeCard;