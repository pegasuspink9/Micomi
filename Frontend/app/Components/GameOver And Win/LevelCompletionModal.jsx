import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions,
  Pressable
} from 'react-native';
import { scale, RESPONSIVE, wp, hp } from '../Responsiveness/gameResponsive';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const LevelCompletionModal = ({
  visible = false,
  onRetry = null,
  onHome = null,
  onNextLevel = null,
  completionRewards = null,
  nextLevel = null,
  isLoading = false
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    let animationTimeout;
    
    if (visible) {
      animationTimeout = setTimeout(() => {
        startEntranceAnimation();
      }, 0);
    } else {
      resetAnimations();
    }

    return () => {
      if (animationTimeout) {
        clearTimeout(animationTimeout);
      }
    };
  }, [visible]);

  const startEntranceAnimation = () => {
    setIsAnimating(true);
    
    scaleAnim.setValue(0.3);
    opacityAnim.setValue(0);
    slideUpAnim.setValue(SCREEN_HEIGHT);

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(slideUpAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsAnimating(false);
    });
  };

  const resetAnimations = () => {
    scaleAnim.setValue(0.3);
    opacityAnim.setValue(0);
    slideUpAnim.setValue(SCREEN_HEIGHT);
    setIsAnimating(false);
  };

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: opacityAnim,
        }
      ]}
    >
      <Animated.View
        style={[
          styles.modalContent,
          {
            transform: [
              { scale: scaleAnim },
              { translateY: slideUpAnim },
            ],
          }
        ]}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00ff00" />
            <Text style={styles.loadingText}>Loading next level...</Text>
          </View>
        ) : (
          <View style={styles.buttonGridContainer}>
            {/* NEXT LEVEL BUTTON */}
            {nextLevel ? (
              <Pressable
                style={({ pressed }) => [
                  styles.buttonListItemContainer,
                  pressed && styles.buttonListItemPressed
                ]}
                onPress={onNextLevel}
                disabled={isAnimating}
              >
                <View style={styles.buttonInner}>
                  <View style={styles.buttonHighlight} />
                  <View style={styles.buttonShadow} />
                  <Text style={styles.buttonText}>→</Text>
                </View>
              </Pressable>
            ) : null}

            {/* RETRY BUTTON */}
            <Pressable
              style={({ pressed }) => [
                styles.buttonListItemContainer,
                pressed && styles.buttonListItemPressed
              ]}
              onPress={onRetry}
              disabled={isAnimating}
            >
              <View style={styles.buttonInner}>
                <View style={styles.buttonHighlight} />
                <View style={styles.buttonShadow} />
                <Text style={styles.buttonText}>↻</Text>
              </View>
            </Pressable>

            {/* HOME BUTTON */}
            <Pressable
              style={({ pressed }) => [
                styles.buttonListItemContainer,
                pressed && styles.buttonListItemPressed
              ]}
              onPress={onHome}
              disabled={isAnimating}
            >
              <View style={styles.buttonInner}>
                <View style={styles.buttonHighlight} />
                <View style={styles.buttonShadow} />
                <Text style={styles.buttonText}>⌂</Text>
              </View>
            </Pressable>
          </View>
        )}
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 99999,
    elevation: 99999,
    paddingBottom: hp(18), // Position at same location as GridContainer
  },

  modalContent: {
    width: '100%',
    alignItems: 'center',
  },

  buttonGridContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: scale(20),
    paddingHorizontal: wp(10),
    backgroundColor: 'transparent',
  },

  buttonListItemContainer: {
    flex: 1,
    width: wp(20),
    borderRadius: RESPONSIVE.borderRadius.sm,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#4a90e2',
    borderTopWidth: scale(2),
    borderTopColor: '#93c5fd',
    borderLeftWidth: scale(2),
    borderLeftColor: '#93c5fd',
    borderBottomWidth: scale(3),
    borderBottomColor: '#1e3a8a',
    borderRightWidth: scale(3),
    borderRightColor: '#1e3a8a',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: scale(4),
    },
    shadowOpacity: 0.3,
    shadowRadius: scale(6),
    elevation: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonListItemPressed: {
    transform: [{ translateY: scale(0.5) }],
    shadowOffset: {
      width: 0,
      height: scale(2),
    },
    shadowOpacity: 0.2,
    borderTopWidth: scale(3),
    borderTopColor: '#1e3a8a',
    borderLeftWidth: scale(3),
    borderLeftColor: '#1e3a8a',
    borderBottomWidth: scale(1),
    borderBottomColor: '#93c5fd',
    borderRightWidth: scale(1),
    borderRightColor: '#93c5fd',
  },

  buttonInner: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RESPONSIVE.borderRadius.xs,
    paddingVertical: scale(24),
    paddingHorizontal: scale(36),
    backgroundColor: '#014656ae',
    borderTopWidth: scale(1),
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderLeftWidth: scale(1),
    borderLeftColor: 'rgba(255, 255, 255, 0.2)',
    borderBottomWidth: scale(1),
    borderBottomColor: 'rgba(0, 0, 0, 0.3)',
    borderRightWidth: scale(1),
    borderRightColor: 'rgba(0, 0, 0, 0.2)',
  },

  buttonHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderTopLeftRadius: RESPONSIVE.borderRadius.xs,
    borderTopRightRadius: RESPONSIVE.borderRadius.xs,
    pointerEvents: 'none',
  },

  buttonShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderBottomLeftRadius: RESPONSIVE.borderRadius.xs,
    borderBottomRightRadius: RESPONSIVE.borderRadius.xs,
    pointerEvents: 'none',
  },

  buttonText: {
    fontSize: scale(80),
    top: scale(-10),
    fontWeight: 'bold',
    color: '#fcfcfcff',
    textAlign: 'center',
    fontFamily: 'MusicVibes',
    textShadowColor: '#000000ff',
    textShadowOffset: { width: scale(1), height: scale(1) },
    textShadowRadius: scale(2),
    zIndex: 1,
  },

  loadingContainer: {
    alignItems: 'center',
    paddingVertical: RESPONSIVE.margin.xl,
    paddingHorizontal: scale(40),
    backgroundColor: 'rgba(12, 73, 139, 0.9)',
    borderRadius: RESPONSIVE.borderRadius.md,
    borderTopWidth: scale(2),
    borderBottomWidth: scale(2),
    borderLeftWidth: scale(2),
    borderRightWidth: scale(2),
    borderColor: 'rgba(0, 255, 0, 0.8)',
  },

  loadingText: {
    fontSize: scale(16),
    fontFamily: 'DynaPuff',
    color: '#00ff00',
    textAlign: 'center',
    marginTop: RESPONSIVE.margin.md,
    textShadowColor: 'rgba(0, 255, 0, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: scale(3),
  },
});

export default LevelCompletionModal;