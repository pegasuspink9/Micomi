import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

const BackButton = ({ 
  onPress, 
  width = 120, 
  height = 60, 
  style, 
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
      <Image
        source={require('./BackArrow.png')}
        style={styles.image}
        contentFit="contain"
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
});

export default BackButton;