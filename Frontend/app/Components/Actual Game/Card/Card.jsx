import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Image, 
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from 'react-native';

import { scale, hp, wp } from '../../Responsiveness/gameResponsive';

const PLACEHOLDER_IMAGE = 'https://res.cloudinary.com/dpbocuozx/image/upload/v1760942690/b86116f4-4c3c-4f9c-bec3-7628482673e8_eh6biu.png';

const Card = ({ 
  visible, 
  imageUrl, 
  onClose,
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

  //  Update image source
  useEffect(() => {
    const url = imageUrl || PLACEHOLDER_IMAGE;
    
    if (url !== previousUrl) {
      console.log('📸 Card image URL updated:', url);
      setImageSource({ uri: url });
      setPreviousUrl(url);
    }
  }, [imageUrl, previousUrl]);

  useEffect(() => {
    if (visible && imageSource) {
      console.log('📸 Triggering entrance animation');
      dropAnim.setValue(-500);
      opacityAnim.setValue(0);
      flipAnim.setValue(0);
      hopAnim.setValue(0);
      rotateAnim.setValue(0);
      
      Animated.parallel([
        Animated.spring(dropAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, imageSource, dropAnim, opacityAnim]);

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
      ]),
    ]).start(() => {
      flipAnim.setValue(0);
      hopAnim.setValue(0);
      rotateAnim.setValue(0);
      dropAnim.setValue(-500);
      opacityAnim.setValue(0);
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
        </Animated.View>
      ) : (
        <View style={styles.imageWrapper}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}
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
  imageWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: wp(70),
    height: hp(50),
  },
  loader: {
    position: 'absolute',
    zIndex: 1,
  },
});

export default Card;