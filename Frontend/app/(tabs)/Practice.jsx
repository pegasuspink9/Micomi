import React from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { gameScale } from '../Components/Responsiveness/gameResponsive';

export default function PracticeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar hidden={true} />
      <View style={styles.container}>
        <Text style={styles.headerTitle}>Practice Hub</Text>
        
        <View style={styles.menuContainer}>
          
          {/* Story Mode Box */}
          <Pressable 
            style={({ pressed }) => [
              styles.boxButton,
              { backgroundColor: '#ffbd2e', borderBottomColor: '#cc9625' },
              pressed && styles.boxButtonPressed
            ]}
            onPress={() => router.push('/StoryMode')} // Placeholder for future route
          >
            <Text style={styles.boxText}>Story Mode</Text>
          </Pressable>

          {/* Study Box */}
          <Pressable 
            style={({ pressed }) => [
              styles.boxButton,
              { backgroundColor: '#27ca3f', borderBottomColor: '#1e9e31' },
              pressed && styles.boxButtonPressed
            ]}
            onPress={() => router.push('/Study')} // Placeholder for future route
          >
            <Text style={styles.boxText}>Study</Text>
          </Pressable>

          {/* PlayGround Box */}
          <Pressable 
            style={({ pressed }) => [
              styles.boxButton,
              { backgroundColor: '#4dabf7', borderBottomColor: '#3b8bd4' },
              pressed && styles.boxButtonPressed
            ]}
            onPress={() => router.push('../../Components/Practice Components/CodePlayGround')} // Placeholder for future route
          >
            <Text style={styles.boxText}>PlayGround</Text>
          </Pressable>

        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  container: {
    flex: 1,
    padding: gameScale(20),
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: gameScale(32),
    fontFamily: 'Grobold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: gameScale(40),
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: gameScale(4) },
    textShadowRadius: gameScale(4),
  },
  menuContainer: {
    gap: gameScale(20),
  },
  boxButton: {
    width: '100%',
    paddingVertical: gameScale(25),
    borderRadius: gameScale(16),
    borderWidth: gameScale(2),
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderBottomWidth: gameScale(8), 
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: gameScale(6) },
    shadowOpacity: 0.4,
    shadowRadius: gameScale(8),
    elevation: 10,
  },
  boxButtonPressed: {
    borderBottomWidth: gameScale(2), 
    transform: [{ translateY: gameScale(6) }], 
  },
  boxText: {
    color: '#ffffff',
    fontSize: gameScale(24),
    fontFamily: 'Grobold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: gameScale(2) },
    textShadowRadius: gameScale(2),
  },
});