import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Image, 
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Text,
} from 'react-native';
import {soundManager} from '../Sounds/UniversalSoundManager';
import { scale, hp, wp } from '../../Responsiveness/gameResponsive';

const PLACEHOLDER_IMAGE = '';

const Card = ({ 
  visible, 
  imageUrl, 
  cardType = null,
  onClose,
  damage = null,
  autoClose = true,
  autoCloseDuration = 3000
}) => {
  const [loading, setLoading] = useState(false);
  const [autoCloseTimer, setAutoCloseTimer] = useState(null);
  const [imageSource, setImageSource] = useState(null);
  const [previousUrl, setPreviousUrl] = useState(null);
  
  //  Animation refs
  const dropAnim = useRef(new Animated.Value(-500)).current;
  const flipAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const hopAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const cardTypeDropAnim = useRef(new Animated.Value(-200)).current;
  const cardTypeOpacityAnim = useRef(new Animated.Value(0)).current;

  //  Update image source
  useEffect(() => {
    const url = imageUrl || PLACEHOLDER_IMAGE;
    
    if (url !== previousUrl) {
      console.log('📸 Card image URL updated:', url);
      console.log('📸 Card type:', cardType);
      setImageSource({ uri: url });
      setPreviousUrl(url);
    }
  }, [imageUrl, cardType, previousUrl]);

  
  useEffect(() => {
    if (visible && imageSource) {
      console.log('📸 Triggering entrance animation');
      dropAnim.setValue(-600);
      opacityAnim.setValue(0);
      flipAnim.setValue(0);
      hopAnim.setValue(0);
      rotateAnim.setValue(0);
      cardTypeDropAnim.setValue(100);
      cardTypeOpacityAnim.setValue(0);
      
      Animated.parallel([
        Animated.spring(dropAnim, {
          toValue: 0,
          tension: 210,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(200),
          Animated.parallel([
            Animated.spring(cardTypeDropAnim, {
              toValue: 0,
              tension: 200,
              friction: 8,
              useNativeDriver: true,
            }),
            Animated.timing(cardTypeOpacityAnim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start();
    }
  }, [visible, imageSource, dropAnim, opacityAnim, cardTypeDropAnim, cardTypeOpacityAnim]);

  useEffect(() => {
    setLoading(false);
  }, [imageSource]);

  useEffect(() => {
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
    }

    if (visible && autoClose && imageSource) {
      console.log(`📸 Auto-closing in ${autoCloseDuration}ms`);
      
      const timer = setTimeout(() => {
        console.log('📸 Auto-closing view with flip and hop animation');
        handleFlipHopAndClose();
      }, autoCloseDuration);
      
      setAutoCloseTimer(timer);
    }

    return () => {
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
      }
    };
  }, [visible, autoClose, autoCloseDuration, imageSource]);

  const handleFlipHopAndClose = () => {
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
      setAutoCloseTimer(null);
    }

    soundManager.playCardFlipSound(1.0);

    Animated.sequence([
      Animated.sequence([
        Animated.timing(hopAnim, {
          toValue: -60,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(hopAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(flipAnim, {
          toValue: 30,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(cardTypeDropAnim, {
          toValue: hp(50),
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(cardTypeOpacityAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      flipAnim.setValue(0);
      hopAnim.setValue(0);
      rotateAnim.setValue(0);
      dropAnim.setValue(-500);
      opacityAnim.setValue(0);
      cardTypeDropAnim.setValue(200);
      cardTypeOpacityAnim.setValue(0); 
      onClose();
    });
  };
    
  const handleClose = () => {
    handleFlipHopAndClose();
  };

  const handleImageError = (error) => {
    console.error('❌ Image failed to load:', error);
    setLoading(false);
    
    if (imageSource?.uri !== PLACEHOLDER_IMAGE) {
      console.log('📸 Falling back to placeholder image');
      setImageSource({ uri: PLACEHOLDER_IMAGE });
    }
  };

  const flipInterpolate = flipAnim.interpolate({
    inputRange: Array.from({ length: 31 }, (_, i) => i),
    outputRange: Array.from({ length: 31 }, (_, i) => i % 2 === 0 ? 1 : 0),
  });

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const animatedStyle = {
    transform: [
      { translateY: Animated.add(dropAnim, hopAnim) },
      { scaleX: flipInterpolate },
      { rotate: rotateInterpolate },
    ],
    opacity: opacityAnim,
  };

  const cardTypeAnimatedStyle = {
    transform: [
      { translateY: cardTypeDropAnim },
    ],
    opacity: cardTypeOpacityAnim,
  };

  if (!visible) {
    return null;
  }

  return (
    <TouchableOpacity 
      style={styles.container}
      activeOpacity={1}
      onPress={handleClose}
    >
      {loading && (
        <ActivityIndicator 
          size="large" 
          color="#ffffff" 
          style={styles.loader}
        />
      )}
      
      <View style={styles.contentWrapper}>

      {imageSource ? (
        <Animated.View style={[styles.imageWrapper, animatedStyle]}>
          <Image
            source={imageSource}
            style={styles.image}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={handleImageError}
            resizeMode="contain"
          />
          {damage && (
            <View style={styles.damageOverlay}>
              <Text style={styles.damageText}>+{damage}</Text>
            </View>
          )}
        </Animated.View>
      ): (
          <View style={styles.imageWrapper}>
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        )}


        
        {cardType && (
          <Animated.View style={[styles.cardTypeContainer, cardTypeAnimatedStyle]}>
            <Text style={styles.cardTypeText}>{cardType}</Text>
          </Animated.View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  contentWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    width: wp(70),
    height: hp(50),
  },
  loader: {
    position: 'absolute',
    zIndex: 1,
  },
  cardTypeContainer: {
    alignItems: 'center',
    paddingVertical: scale(10),
    paddingHorizontal: scale(16),
    marginBottom: scale(20),
    marginTop: scale(-20),
    borderRadius: scale(8),
    minWidth: wp(40),
  },
  cardTypeText: {
    fontSize: scale(35),
    textAlign: 'center',
    color: '#5d9ab3ff',
    textShadowColor: 'rgba(4, 44, 78, 1)',
    fontFamily: 'Grobold',
    textShadowOffset: { width: scale(-2), height: scale(1) },
    textShadowRadius: scale(1),
  },
  damageOverlay: {
    position: 'absolute',
    top: scale(70),
    right: scale(45),
    borderRadius: scale(50),
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
  },
  damageText: {
    color: '#ffffffcf',
    textShadowColor: 'rgba(0, 0, 0, 1)',
    textShadowOffset: { width: scale(1), height: scale(1) },
    textShadowRadius: scale(2),
    fontSize: scale(25),
    fontFamily: 'Grobold',
  },
});

export default Card;