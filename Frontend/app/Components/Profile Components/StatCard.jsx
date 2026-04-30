import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gameScale } from '../Responsiveness/gameResponsive';

const StatCard = ({ icon, label, value, displayValueInIcon = false, hideIcon = false }) => (
  <View style={styles.statCardContainer}>
    <View style={styles.statCardBorderOuter}>
      <View style={styles.statCardBorderMiddle}>
        <LinearGradient
          colors={['#091f29', '#1b627c', '#1b627c']} 
          start={{ x: 0, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.statCard}
        >
          {/* --- TOP SECTION (Above Divider) --- */}
          <View style={styles.statIconContainer}>
            {!hideIcon ? (
              // Classic Mode
              <>
                <Image 
                  source={typeof icon === 'string' ? { uri: icon } : icon} 
                  style={styles.statIconImage}
                  resizeMode="contain"
                />
                {displayValueInIcon ? (
                  <View style={styles.iconValueOverlay}>
                    <Text style={styles.iconValueText}>{value}</Text>
                  </View>
                ) : null}
              </>
            ) : (
              // Rank Mode (Top Section Display)
              // MODIFIED: Check if value is simple text/number OR a custom component
              typeof value === 'string' || typeof value === 'number' ? (
                <Text
                  style={[styles.statValue, styles.rankStatValue]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.6}
                >
                  {value}
                </Text>
              ) : (
                // Render custom component directly (e.g., Image + Text combination)
                value
              )
            )}
          </View>

          {/* --- BOTTOM SECTION (Below Divider) --- */}
          <View style={styles.statTextContainer}>
            {!hideIcon && !displayValueInIcon ? (
              <Text
                style={styles.statValue}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {value}
              </Text>
            ) : null}

            <Text
              style={[styles.statLabel, hideIcon && styles.rankStatLabel]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {label}
            </Text>
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
  // The container for the top half, which includes the bottom border divider
  statIconContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    width: '100%',
    paddingVertical: gameScale(12), 
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: gameScale(1), // THE DIVIDER
    borderBottomColor: 'rgba(46, 231, 255, 0.3)',
    minHeight: gameScale(80), // Ensure consistent height for Rank mode value display
  },
  statTextContainer: {
    alignItems: 'center',
    marginVertical: gameScale(3),
    paddingBottom: gameScale(4),
    justifyContent: 'center', // Center content vertically in the bottom space
    flex: 1, // Take up remaining space
  },
  statValue: {
    fontSize: gameScale(24),
    fontFamily: 'Grobold',
    color: '#ffffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0},
    textShadowRadius: 7,
  },
  rankStatValue: {
    textAlign: 'center',
     fontSize: gameScale(30), 
  },
  statIconImage: {
    width: gameScale(55),
    height: gameScale(55),
  },
  iconValueOverlay: {
    position: 'absolute',
    bottom: gameScale(4),
    alignSelf: 'center',
    paddingHorizontal: gameScale(6),
    paddingVertical: gameScale(1),
    borderRadius: gameScale(8),
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  iconValueText: {
    fontSize: gameScale(12),
    fontFamily: 'Grobold',
    color: '#ffffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  statLabel: {
    fontSize: gameScale(10),
    color: '#ffffffa2',
    fontFamily: 'FunkySign',
  },
  rankStatLabel: {
    fontSize: gameScale(15), // Slightly larger label for rank mode
    textAlign: 'center',
    color: '#d9eeff',
    marginTop: gameScale(2),
  },
});

export default StatCard;