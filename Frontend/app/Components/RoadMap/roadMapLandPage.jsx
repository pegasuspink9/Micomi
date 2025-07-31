import React from 'react';
import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from 'expo-router';

// Import the universal component
import UniversalMapLevel from "./MapLevel/universalMapLevel";
import MapHeader from '../Map/mapHeader';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RoadMapLandPage() {
  const { mapName } = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerOverlay}>
        <MapHeader />
      </View>
      
      <View style={styles.body}>
        <UniversalMapLevel />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  body: {
    flex: 1,
    backgroundColor: 'white',
    position: 'relative'
  },
  headerOverlay: {
    position: 'absolute',
    top: 30,
    left: 0,
    right: 0,
    zIndex: 100,
  }
});