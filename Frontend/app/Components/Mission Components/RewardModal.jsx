import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TouchableWithoutFeedback, Animated, Easing } from 'react-native';
import { gameScale } from '../Responsiveness/gameResponsive';

export const RewardModal = ({ visible, onClose, rewards }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      fadeAnim.setValue(1);
      
      scaleAnim.setValue(0);

      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }).start();

      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.5,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      return () => pulseLoop.stop();
    }
  }, [visible, scaleAnim, fadeAnim, pulseAnim]);

  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  if (!visible) return null;

  return (
    <View style={modalStyles.overlay}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View 
          style={[
            modalStyles.modalContainer, 
            { 
              opacity: fadeAnim, 
              transform: [{ scale: scaleAnim }] 
            }
          ]}
        >
          <TouchableWithoutFeedback>
            <View style={modalStyles.modalContent}>
              <Text style={modalStyles.title}>REWARDS CLAIMED!</Text>
              
              <View style={modalStyles.rewardsContainer}>
                <View style={modalStyles.rewardItem}>
                  <View style={modalStyles.iconContainer}>
                    <Text style={modalStyles.rewardIcon}>⭐</Text>
                  </View>
                  <Text style={modalStyles.rewardLabel}>EXP</Text>
                  <Text style={modalStyles.rewardValue}>+{rewards?.exp || 0}</Text>
                </View>

                <View style={modalStyles.divider} />

                <View style={modalStyles.rewardItem}>
                  <View style={modalStyles.iconContainer}>
                    <Text style={modalStyles.rewardIcon}>🪙</Text>
                  </View>
                  <Text style={modalStyles.rewardLabel}>COINS</Text>
                  <Text style={modalStyles.rewardValue}>+{rewards?.coins || 0}</Text>
                </View>
              </View>

              <TouchableOpacity onPress={handleClose} style={modalStyles.tapContainer}>
                <Animated.Text style={[modalStyles.tapText, { opacity: pulseAnim }]}>
                  Tap to continue
                </Animated.Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const modalStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: gameScale(15),
  },
  title: {
    fontSize: gameScale(25),
    fontFamily: 'Grobold',
    color: '#fff12fff',
    marginBottom: gameScale(10),
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    textAlign: 'center',
  },
  rewardsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: gameScale(10),
    gap: gameScale(10),
  },
  rewardItem: {
    alignItems: 'center',
  },
  iconContainer: {
    width: gameScale(70),
    height: gameScale(70),
    borderRadius: gameScale(35),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: gameScale(2),
  },
  rewardIcon: {
    fontSize: gameScale(35),
  },
  rewardLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: gameScale(15),
    fontFamily: 'Grobold',
    marginBottom: gameScale(1),
  },
  rewardValue: {
    color: '#fff',
    fontSize: gameScale(20),
    fontFamily: 'Grobold',
  },
  divider: {
    width: gameScale(1),
    height: gameScale(50),
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tapContainer: {
    marginTop: gameScale(5),
    alignItems: 'center',
  },
  tapText: {
    color: 'rgba(255, 255, 255, 1)',
    fontSize: gameScale(15),
    fontFamily: 'Grobold',
    textAlign: 'center',
  },
});