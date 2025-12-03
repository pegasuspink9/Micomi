import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gameScale } from '../Responsiveness/gameResponsive';

const StatCard = ({ icon, label, value }) => (
  <View style={styles.statCardContainer}>
    <View style={styles.statCardBorderOuter}>
      <View style={styles.statCardBorderMiddle}>
        <LinearGradient
          colors={['#091f29', '#1b627c', '#1b627c']} 
          start={{ x: 0, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.statCard}
        >
          <View style={styles.statIconContainer}>
            <Image 
              source={{ uri: icon }} 
              style={styles.statIconImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.statTextContainer}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        </LinearGradient>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  statCardContainer: {
    width: '90%',
    alignSelf: 'center'
  },
  statCardBorderOuter: {
    borderRadius: gameScale(16),
    borderWidth: gameScale(1),
    borderColor: '#050404ff', 
  },
  statCardBorderMiddle: {
    borderRadius: gameScale(14),
    borderWidth: gameScale(1),
    borderColor: '#0063afff',
  },
  statCard: {
    width: '100%', 
    borderRadius: gameScale(12),
    borderWidth: gameScale(1), 
    borderColor: '#ffffffff',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  statTextContainer: {
    alignItems: 'center',
    marginVertical: gameScale(3),
    paddingBottom: gameScale(4),
  },
  statValue: {
    fontSize: gameScale(24),
    fontFamily: 'Grobold',
    color: '#ffffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0},
    textShadowRadius: 7,
  },
  statIconContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    width: '100%',
    paddingVertical: gameScale(12), 
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: gameScale(1),
    borderBottomColor: 'rgba(46, 231, 255, 0.3)',
  },
  statIconImage: {
    width: gameScale(50),
    height: gameScale(50),
  },
  statLabel: {
    fontSize: gameScale(10),
    color: '#ffffffa2',
    fontFamily: 'FunkySign',
  },
});

export default StatCard;