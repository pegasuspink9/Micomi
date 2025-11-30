import React from 'react';
import { StyleSheet, View, Image, Pressable, ImageBackground, Animated } from 'react-native'; 
import { gameScale } from '../Responsiveness/gameResponsive';

const TabBarIconWrapper = ({ source, backgroundSource, imageStyle, focused }) => {
  return (
    <View style={styles.container}>
      <ImageBackground 
        source={backgroundSource} 
        style={styles.backgroundIcon}
        resizeMode="contain"
      />
      
      <Image 
        source={{ uri: source }} 
        style={[
          styles.icon, 
          imageStyle, 
          focused ? styles.iconFocused : styles.iconDefault
        ]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: gameScale(50),
    height: gameScale(50),
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundIcon: {
    width: '100%',
    height: '100%',
  },
  icon: {
    position: 'absolute',
  },
  iconDefault: {
    bottom: gameScale(6),
  },
  iconFocused: {
    bottom: gameScale(19),
  },
});
export default TabBarIconWrapper;