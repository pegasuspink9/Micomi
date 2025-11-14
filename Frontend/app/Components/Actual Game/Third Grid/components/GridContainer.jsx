import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Image, ActivityIndicator, Pressable, Text } from 'react-native';
import { scale, scaleWidth, scaleHeight, RESPONSIVE, wp, hp } from '../../../Responsiveness/gameResponsive';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const GridContainer = ({ 
  children, 
  lowerChildren, 
  mainHeight, 
  cardImageUrl, 
  showCardInGrid = false,
  isProceedMode = false,
  onProceed = null,
  isLevelComplete = false,
  onRetry = null,
  onHome = null,
  onNextLevel = null,
  hasNextLevel = false
}) => {
  const [imageSource, setImageSource] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previousUrl, setPreviousUrl] = useState(null);
  
  const dropAnim = useRef(new Animated.Value(-500)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const url = cardImageUrl;

    if (isProceedMode) {
      setImageSource(null);
      setPreviousUrl(null);
      dropAnim.setValue(-500);
      opacityAnim.setValue(0);
      return;
    }

    if (showCardInGrid && !previousUrl) {
      setPreviousUrl(null);
    }
    
    if (url && cardImageUrl && showCardInGrid && url !== previousUrl) {
      console.log('📸 Grid card image updated:', url);
      setImageSource({ uri: url });
      setPreviousUrl(url);
      
      dropAnim.setValue(-100);
      opacityAnim.setValue(0);
      
      Animated.parallel([
        Animated.timing(dropAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
    if (!showCardInGrid) {
      setImageSource(null);
      setPreviousUrl(null);
      dropAnim.setValue(-500);
      opacityAnim.setValue(0);
    }
  }, [cardImageUrl, showCardInGrid, isProceedMode]);

  const animatedStyle = {
    transform: [
      { translateY: dropAnim },
    ],
    opacity: opacityAnim,
  };

  return (
    <View style={styles.containerWrapper}>
      <View style={[
        styles.thirdGrid, 
        { height: mainHeight },
        isProceedMode && styles.thirdGridProceed
      ]}>
      
        {imageSource && showCardInGrid && !isProceedMode && (
          <Animated.Image
            source={imageSource}
            style={[styles.cardImageInGrid, animatedStyle]}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            resizeMode="contain"
          />
        )}

        {loading && showCardInGrid && !isProceedMode && (
          <ActivityIndicator 
            size="large" 
            color="#ffffff" 
            style={styles.loaderInGrid}
          />
        )}
        
        {!isProceedMode && (
          <View style={styles.simpleFrame}>
          </View>
        )}
        
        <View style={[
          styles.outerFrame,
          (isProceedMode || isLevelComplete) && styles.outerFrameProceed
        ]}>
          <View style={[
            styles.innerContent,
            (isProceedMode || isLevelComplete) && styles.innerContentProceed
          ]}>
            <View style={[
              styles.innerBorder,
              (isProceedMode || isLevelComplete) && styles.innerBorderProceed
            ]}>
              <View style={styles.backlightOverlay} />
              <View style={styles.topHighlight} />
              <View style={styles.bottomShadow} />
              <View style={styles.leftHighlight} />
              <View style={styles.rightShadow} />
              
              {/* LEVEL COMPLETE BUTTONS */}
              {isLevelComplete ? (
                <View style={styles.completionButtonFrame}>
                  <View style={styles.completionButtonsContainer}>
                    {/* NEXT LEVEL BUTTON */}
                     {hasNextLevel ? (
                      <View style={styles.completionButtonWrapper}>
                        <Pressable
                          style={({ pressed }) => [
                            styles.completionListItemContainer,
                            pressed && styles.completionListItemPressed
                          ]}
                          onPress={onNextLevel}
                        >
                          <View style={styles.completionInnerButton}>
                            <View style={styles.completionButtonHighlight} />
                            <View style={styles.completionButtonShadow} />
                            <MaterialCommunityIcons name="skip-next" size={24} color="white" />
                          </View>
                        </Pressable>
                      </View>
                    ) : null}

                    {/* RETRY BUTTON */}
                     <View style={styles.completionButtonWrapper}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.completionListItemContainer,
                          pressed && styles.completionListItemPressed
                        ]}
                        onPress={onRetry}
                      >
                        <View style={styles.completionInnerButton}>
                          <View style={styles.completionButtonHighlight} />
                          <View style={styles.completionButtonShadow} />
                          <FontAwesome name="repeat" size={scale(24)} color="#ffffffff" />
                        </View>
                      </Pressable>
                    </View>

                    {/* HOME BUTTON */}
                    <View style={styles.completionButtonWrapper}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.completionListItemContainer,
                          pressed && styles.completionListItemPressed
                        ]}
                        onPress={onHome}
                      >
                        <View style={styles.completionInnerButton}>
                          <View style={styles.completionButtonHighlight} />
                          <View style={styles.completionButtonShadow} />
                          <MaterialIcons name="home" size={scale(28)} color="#ffffffff" />
                        </View>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ) : isProceedMode ? (
                /* PROCEED BUTTON */
                <View style={styles.proceedButtonFrame}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.proceedListItemContainer,
                      pressed && styles.proceedListItemPressed
                    ]}
                    onPress={() => {
                      console.log('✅ Proceeding to next challenge...');
                      onProceed?.();
                    }}
                  >
                    <View style={styles.proceedInnerButton}>
                      <View style={styles.proceedButtonHighlight} />
                      <View style={styles.proceedButtonShadow} />
                      <Text style={styles.proceedButtonText}>&gt;</Text>
                    </View>
                  </Pressable>
                </View>
              ) : (
                children
              )}
            </View>
          </View>
        </View>
      </View>
      <View style={styles.lowerGrid}>
        <View style={styles.outerFrame}>
          <View style={styles.innerContent}>
            <View style={styles.innerBorder}>
              <View style={styles.backlightOverlay} />
              <View style={styles.topHighlight} />
              <View style={styles.bottomShadow} />
              <View style={styles.leftHighlight} />
              <View style={styles.rightShadow} />
              {lowerChildren}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  containerWrapper: {
    position: 'absolute', 
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: hp(32),
    backgroundColor: 'transparent',
  },

  thirdGrid: {
    height: hp(15),
    backgroundColor: 'transparent',
    marginBottom: hp(-4),
    zIndex: 10,
    position: 'relative',
  },

  thirdGridProceed: {
    marginBottom: hp(-10),
    justifyContent: 'center',
    alignItems: 'center',
  },

  simpleFrame: {
    width: wp(20),
    height: hp(5),
    position: 'absolute',
    backgroundColor: '#061e52ff',
    top: hp(-1),
    right: wp(2),
    borderRadius: SCREEN_WIDTH * 0.01,
    padding: scale(2),
    shadowColor: '#052a53ff',
    shadowOffset: {
      width: 0,
      height: scale(12),
    },
    shadowOpacity: 0.6,
    shadowRadius: scale(16),
    elevation: 20,
    borderTopWidth: scale(3),
    borderTopColor: '#87ceeb',
    borderLeftWidth: scale(2),
    borderLeftColor: '#87ceeb',
    borderBottomWidth: scale(5),
    borderBottomColor: '#2c5282',
    borderRightWidth: scale(4),
    borderRightColor: '#2c5282',
  },

  cardImageInGrid: {
    width: wp(20),
    height: hp(18),
    position: 'absolute',
    top: hp(-10),
    right: wp(2),
  },
   
  loaderInGrid: {
    position: 'absolute',
    top: hp(8),
    right: wp(2),
    zIndex: 21,
  },

  lowerGrid: {
    height: hp(12),
    width: wp(90),
    alignSelf: 'center',
    backgroundColor: 'transparent',
  },

  outerFrame: {
    flex: 1,
    backgroundColor: '#b4bdc6ff',
    borderRadius: SCREEN_WIDTH * 0.03,
    padding: scale(2),
    shadowColor: '#052a53ff',
    shadowOffset: {
      width: 0,
      height: scale(12),
    },
    shadowOpacity: 0.6,
    shadowRadius: scale(16),
    elevation: 20,
    borderTopWidth: scale(3),
    borderTopColor: '#87ceeb',
    borderLeftWidth: scale(2),
    borderLeftColor: '#87ceeb',
    borderBottomWidth: scale(5),
    borderBottomColor: '#2c5282',
    borderRightWidth: scale(4),
    borderRightColor: '#2c5282',
  },

  outerFrameProceed: {
    borderTopColor: '#87ceeb',
    borderLeftColor: '#87ceeb',
    borderBottomColor: '#87ceeb',
    borderRightColor: '#87ceeb',
    shadowColor: '#87ceeb',
    shadowOpacity: 0.8,
  },

  innerContent: {
    flex: 1,
    backgroundColor: '#052a53ff',
    borderRadius: SCREEN_WIDTH * 0.045,
    padding: RESPONSIVE.margin.sm,
    shadowColor: '#1a365d',
    shadowOffset: {
      width: 0,
      height: scale(8),
    },
    shadowOpacity: 0.5,
    shadowRadius: scale(12),
    elevation: 18,
  },

  innerContentProceed: {
    backgroundColor: '#0a3a66',
  },

  innerBorder: {
    flex: 1,
    backgroundColor: '#000000fc',
    borderRadius: SCREEN_WIDTH * 0.03,
    position: 'relative',
    overflow: 'hidden',
    shadowOpacity: 0.3,
    shadowRadius: scale(6),
    elevation: 8,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },

  innerBorderProceed: {
    backgroundColor: '#1a1a2e',
    borderWidth: scale(2),
    borderColor: '#13447196',
  },

  backlightOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(135, 206, 235, 0.15)', 
    borderRadius: SCREEN_WIDTH * 0.03,
    pointerEvents: 'none',
  },

  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: scale(30),
    borderTopLeftRadius: SCREEN_WIDTH * 0.03,
    borderTopRightRadius: SCREEN_WIDTH * 0.03,
    pointerEvents: 'none',
  },

  bottomShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: scale(24),
    borderBottomLeftRadius: SCREEN_WIDTH * 0.03,
    borderBottomRightRadius: SCREEN_WIDTH * 0.03,
    pointerEvents: 'none',
  },

  leftHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: scale(16),
    borderTopLeftRadius: SCREEN_WIDTH * 0.03,
    borderBottomLeftRadius: SCREEN_WIDTH * 0.03,
    pointerEvents: 'none',
  },

  rightShadow: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: scale(12),
    borderTopLeftRadius: SCREEN_WIDTH * 0.03,
    borderBottomRightRadius: SCREEN_WIDTH * 0.03,
    pointerEvents: 'none',
  },

  // PROCEED BUTTON STYLES
  proceedButtonFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: RESPONSIVE.margin.xs,
    backgroundColor: '#000000ff',
    borderRadius: RESPONSIVE.borderRadius.sm,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: scale(6),
    },
    shadowOpacity: 0.4,
    shadowRadius: scale(8),
    elevation: 12,
    borderTopWidth: scale(1),
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderLeftWidth: scale(1),
    borderLeftColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: scale(3),
    borderBottomColor: 'rgba(0, 0, 0, 0.4)',
    borderRightWidth: scale(2),
    borderRightColor: 'rgba(0, 0, 0, 0.3)',
  },

  proceedListItemContainer: {
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

  proceedListItemPressed: {
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

  proceedInnerButton: {
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

  proceedButtonHighlight: {
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

  proceedButtonShadow: {
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

  proceedButtonText: {
    fontSize: scale(80),
    width: scale(100),
    color: '#fcfcfcff',
    alignItems: 'center',
    textAlign: 'center',
    fontFamily: 'MusicVibes',
    textShadowColor: '#000000ff',
    textShadowOffset: { width: scale(1), height: scale(1) },
    textShadowRadius: scale(2),
    zIndex: 1,
    position: 'absolute'
  },

  // COMPLETION BUTTONS STYLES - Reuse proceed button styles
  proceedInnerButton: {
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

  proceedButtonHighlight: {
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

  proceedButtonShadow: {
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

  proceedButtonText: {
    fontSize: scale(80),
    width: scale(100),
    color: '#fcfcfcff',
    alignItems: 'center',
    textAlign: 'center',
    fontFamily: 'MusicVibes',
    textShadowColor: '#000000ff',
    textShadowOffset: { width: scale(1), height: scale(1) },
    textShadowRadius: scale(2),
    zIndex: 1,
    position: 'absolute'
  },

  // NEW COMPLETION STYLES (replaces the old ones)
  completionButtonFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0e2135da',
    borderRadius: RESPONSIVE.borderRadius.sm,
  },

  completionButtonsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: scale(15),
    paddingVertical: scale(12),
    paddingHorizontal: scale(20),
    backgroundColor: 'transparent',
    borderRadius: RESPONSIVE.borderRadius.md,
    alignSelf: 'center',
  },

  completionButtonWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    aspectRatio: 1,
  },

  completionListItemContainer: {
    width: '100%',
    height: hp(6), // CHANGED from aspectRatio: 1
    aspectRatio: 1,
    borderRadius: RESPONSIVE.borderRadius.sm,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#2d5f3f',
    borderTopWidth: scale(2),
    borderTopColor: '#4caf50',
    borderLeftWidth: scale(2),
    borderLeftColor: '#4caf50',
    borderBottomWidth: scale(3),
    borderBottomColor: '#1b3d2a',
    borderRightWidth: scale(3),
    borderRightColor: '#1b3d2a',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: scale(3),
    },
    shadowOpacity: 0.3,
    shadowRadius: scale(4),
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  completionListItemPressed: {
    transform: [{ scale: 0.95 }],
    shadowOffset: {
      width: 0,
      height: scale(1),
    },
    shadowOpacity: 0.2,
    borderTopWidth: scale(3),
    borderTopColor: '#1b3d2a',
    borderLeftWidth: scale(3),
    borderLeftColor: '#1b3d2a',
    borderBottomWidth: scale(1),
    borderBottomColor: '#4caf50',
    borderRightWidth: scale(1),
    borderRightColor: '#4caf50',
  },

  completionInnerButton: {
    flex: 1,
    width: '100%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RESPONSIVE.borderRadius.xs,
    backgroundColor: '#1a3d2a',
    borderTopWidth: scale(1),
    borderTopColor: 'rgba(76, 175, 80, 0.4)',
    borderBottomWidth: scale(1),
    borderBottomColor: 'rgba(0, 0, 0, 0.4)',
  },

  completionButtonHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderTopLeftRadius: RESPONSIVE.borderRadius.xs,
    borderTopRightRadius: RESPONSIVE.borderRadius.xs,
    pointerEvents: 'none',
  },

  completionButtonShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '15%',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderBottomLeftRadius: RESPONSIVE.borderRadius.xs,
    borderBottomRightRadius: RESPONSIVE.borderRadius.xs,
    pointerEvents: 'none',
  },

 
});

export default GridContainer;