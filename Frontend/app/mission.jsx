import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import MissionSection from './Components/Mission Components/MissionSection';
import BackButton from './Components/Actual Game/Back/BackButton';
import { gameScale } from './Components/Responsiveness/gameResponsive';

export default function MissionPage() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <BackButton 
        containerStyle={{
          position: 'absolute',
          zIndex: 20,
          top: gameScale(5),
          left: gameScale(-25)
        }}
      />

      <MissionSection />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a192f',
  },
});
