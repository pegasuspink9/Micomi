import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Image, ActivityIndicator, Pressable, Text } from 'react-native';
import { scale, scaleWidth, scaleHeight, RESPONSIVE, wp, hp } from '../../../Responsiveness/gameResponsive';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const GridContainer = ({ 
  children, 
  lowerChildren, 
  mainHeight, 
  cardImageUrl, 
  showCardInGrid = false,
  isProceedMode = false,
  onProceed = null // NEW: Accept proceed callback
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
          isProceedMode && styles.outerFrameProceed
        ]}>
          <View style={[
            styles.innerContent,
            isProceedMode && styles.innerContentProceed
          ]}>
            <View style={[
              styles.innerBorder,
              isProceedMode && styles.innerBorderProceed
            ]}>
              <View style={styles.backlightOverlay} />
              <View style={styles.topHighlight} />
              <View style={styles.bottomShadow} />
              <View style={styles.leftHighlight} />
              <View style={styles.rightShadow} />
              
              {/* NEW: Render proceed button directly in proceed mode */}
                 {isProceedMode ? (
                <View style={styles.proceedButtonFrame}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.proceedListItemContainer,
                      pressed && styles.proceedListItemPressed
                    ]}
                    onPress={() => {
                      console.log(' Proceeding to next challenge...');
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



  


  proceedButtonText: {
    fontSize: scale(80),
    top: scale(-10),
    color: '#fcfcfcff',
    alignItems: 'center',
    textAlign: 'center',
    fontFamily: 'MusicVibes',
    textShadowColor: '#000000ff',
    textShadowOffset: { width: scale(1), height: scale(1) },
    textShadowRadius: scale(2),
    zIndex: 1,
  },
});

export default GridContainer;