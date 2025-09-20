import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const DogCharacter = ({ isPaused }) => {
  const dogProps = {
    source: { uri: "https://lottie.host/061dbe35-d766-447b-aab3-3f16f2b6983d/gsWwaleGkQ.lottie" },
    style: [
      styles.dogRunImage,
      isPaused && styles.pausedElement
    ],
    autoPlay: !isPaused,
    loop: !isPaused,
    speed: isPaused ? 1 : 0.6,
    imageAssetsFolder: '',
    onAnimationLoaded: () => {
      console.log('Dog Lottie loaded');
    }
  };

  return (
    <View style={[styles.dogRun, isPaused && styles.pausedElement]}>
      <LottieView {...dogProps} />
    </View>
  );
};

const styles = StyleSheet.create({
  dogRun: {
    position: 'absolute',
    left: 0,
    top: SCREEN_HEIGHT * 0.07,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  
  dogRunImage: {
    width: SCREEN_WIDTH * 0.36,
    height: SCREEN_HEIGHT * 0.36,
  },
  
  pausedElement: {
    opacity: 0.6,
  },
});

export default DogCharacter;
