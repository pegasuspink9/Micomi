import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

const BackButton = ({ 
  onPress, 
  width = 120, 
  height = 60, 
  style, 
  tintColor,
  tintOpacity = 0.5, // Added tintOpacity for control
  containerStyle = { 
    position: 'absolute', 
    top: 20, 
    left: 20 
  } 
}) => {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <TouchableOpacity 
      onPress={handlePress} 
      activeOpacity={0.9} 
      style={[
        containerStyle, 
        { width, height }, 
        style
      ]}
    >
      <View style={styles.imageContainer}>
        {/* Layer 1: The Original Image (Preserves details like highlights/shadows) */}
        <Image
          source={require('./BackArrow.png')}
          style={styles.image}
          contentFit="contain"
        />
        
        {/* Layer 2: The Tinted Overlay (Applied with partial opacity to 'stain' the image) */}
        {tintColor && (
          <Image
            source={require('./BackArrow.png')}
            style={[
              styles.image, 
              StyleSheet.absoluteFill, 
              { tintColor, opacity: tintOpacity }
            ]}
            contentFit="contain"
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default BackButton;