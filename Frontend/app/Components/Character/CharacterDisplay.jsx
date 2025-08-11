import React, { useRef, useEffect } from 'react';
import { View, Image, Animated } from 'react-native';
import LottieView from 'lottie-react-native';

export default function CharacterDisplay({ 
  currentHero, 
  selectedHero, 
  isCharacterAnimating,
  onAnimationFinish,
  styles 
}) {
  const imageOpacity = useRef(new Animated.Value(0)).current;
  const lottieOpacity = useRef(new Animated.Value(1)).current;
  const entranceOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    lottieOpacity.setValue(1);
    imageOpacity.setValue(0);
    entranceOpacity.setValue(0);

    Animated.timing(entranceOpacity, {
      toValue: 1,
      duration: 4000,
      useNativeDriver: true,
    }).start();
  }, [selectedHero]);

  const handleAnimationFinish = () => {
    Animated.parallel([
      Animated.timing(lottieOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(imageOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start(() => {
      onAnimationFinish();
    });
  };

  return (
    <View style={styles.characterDisplay}>
      <Animated.View style={{ 
        position: 'absolute', 
        opacity: Animated.multiply(lottieOpacity, entranceOpacity) 
      }}>
        <LottieView
          key={selectedHero}
          source={{ uri: currentHero.heroLottie }}
          style={[
            styles.characterImage, 
            { 
              mixBlendMode: 'screen', 
              backgroundColor: 'transparent',
              ...(currentHero.heroLottieStyle || {})
            }
          ]}
          autoPlay={true}
          loop={false}
          speed={-1}
          resizeMode='contain'
          cacheComposition={true}
          renderMode='HARDWARE'
          onAnimationFinish={handleAnimationFinish}
        />
      </Animated.View>

      <Animated.View style={{ position: 'absolute', opacity: imageOpacity }}>
        <Image
          source={{ uri: currentHero.characterImageDisplay }}
          style={[
            styles.characterImage, 
            { backgroundColor: 'transparent', opacity: 1 }
          ]}
          resizeMode='contain'
        />
      </Animated.View>
    </View>
  );
}