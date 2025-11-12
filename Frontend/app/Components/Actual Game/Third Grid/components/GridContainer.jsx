import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Image, ActivityIndicator } from 'react-native';
import { scale, scaleWidth, scaleHeight, RESPONSIVE, wp, hp } from '../../../Responsiveness/gameResponsive';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');


const GridContainer = ({ children, lowerChildren, mainHeight, cardImageUrl, showCardInGrid = false }) => {
  const [imageSource, setImageSource] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previousUrl, setPreviousUrl] = useState(null);
  
  const dropAnim = useRef(new Animated.Value(-500)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const url = cardImageUrl;

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
  }, [cardImageUrl, showCardInGrid]);
  const animatedStyle = {
    transform: [
      { translateY: dropAnim },
    ],
    opacity: opacityAnim,
  };

  return (
    <View style={styles.containerWrapper}>
      <View style={[styles.thirdGrid, { height: mainHeight }]}>
      
      {imageSource && showCardInGrid && (
          <Animated.Image
            source={imageSource}
            style={[styles.cardImageInGrid, animatedStyle]}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            resizeMode="contain"
          />
        )}

        {loading && showCardInGrid && (
          <ActivityIndicator 
            size="large" 
            color="#ffffff" 
            style={styles.loaderInGrid}
          />
        )}
        
        
      <View style={styles.simpleFrame}>
      </View>
      
      <View style={styles.outerFrame}>
          <View style={styles.innerContent}>
            <View style={styles.innerBorder}>
              <View style={styles.backlightOverlay} />
              <View style={styles.topHighlight} />
              <View style={styles.bottomShadow} />
              <View style={styles.leftHighlight} />
              <View style={styles.rightShadow} />
              {children}
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

   cardImageOnly: {
    width: wp(20),
    height: hp(18),
  },

  loader: {
    position: 'absolute',
    top: hp(11),
    right: wp(12),
    zIndex: 1,
  },


  lowerGrid: {
    height: hp(12),
    width: wp(90),
    alignSelf: 'center',
    backgroundColor: 'transparent',
  },

  cardImageOnly: {
    width: wp(20),
    height: hp(18),
  },

  loader: {
    position: 'absolute',
    top: hp(11),
    right: wp(12),
    zIndex: 1,
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
});

export default GridContainer;