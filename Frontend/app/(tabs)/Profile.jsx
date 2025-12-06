import React, { useState } from "react";
import { 
  Text, 
  View, 
  ScrollView, 
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ImageBackground
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';

import { gameScale } from '../Components/Responsiveness/gameResponsive';
import { usePlayerProfile } from '../hooks/usePlayerProfile';

// Import all Profile components
import PlayerInfoSection from '../Components/Profile Components/PlayerInfoSection';
import StatsGridSection from '../Components/Profile Components/StatsGridSection';
import InventorySection from '../Components/Profile Components/InventorySection';

export default function Profile() {
  const playerId = 11;
  const {
    playerData,
    loading,
    error,
    loadPlayerProfile,
    clearError
  } = usePlayerProfile(playerId);

  const [inventoryTab, setInventoryTab] = useState('Badges');

  // Simplified loading - assets are already cached from Map API
  if (loading || !playerData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <LinearGradient 
          colors={['#0a192f', '#172b4aff', '#0a192f']}
          style={styles.gradientBackground}
        >
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading Profile...</Text>
        </LinearGradient>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <LinearGradient 
          colors={['#0a192f', '#172b4aff', '#0a192f']}
          style={styles.gradientBackground}
        >
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => {
            clearError();
            loadPlayerProfile();
          }}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={['#0a192f', '#172b4aff', '#0a192f']}
        style={styles.gradientBackground}
      >
        <View style={styles.backgroundOverlay} />
        
        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <PlayerInfoSection 
            playerName={playerData.playerName}
            username={playerData.username}
            selectedBadge={playerData.selectedBadge}
            playerLevel={playerData.playerLevel}
            expPoints={playerData.expPoints}
          />
          
          <StatsGridSection 
            coins={playerData.coins}
            currentStreak={playerData.currentStreak}
            expPoints={playerData.expPoints}
            mapsOpened={playerData.mapsOpened}
            statsIcons={playerData.statsIcons}
            hero={playerData.heroSelected}
            background={playerData.background}
          />
          
          <InventorySection 
            activeTab={inventoryTab}
            setActiveTab={setInventoryTab}
            badges={playerData.badges}
            potions={playerData.potions}
          />
          
          <View style={{ height: gameScale(16) }} />
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{
    flex:1
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: gameScale(14),
    fontFamily: 'Computerfont',
    marginTop: gameScale(20),
  },
  errorText: {
    color: 'red',
    fontSize: gameScale(14),
    fontFamily: 'Computerfont',
    textAlign: 'center',
    marginBottom: gameScale(20),
  },
  retryButton: {
    backgroundColor: 'rgba(0, 93, 200, 0.8)',
    padding: gameScale(15),
    borderRadius: gameScale(10),
    borderWidth: gameScale(1),
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  retryButtonText: {
    color: 'white',
    fontSize: gameScale(12),
    fontFamily: 'Computerfont',
  },
  gradientBackground: {
    flex: 1,
    width: '100%',
    height: '100%'
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  scrollContainer: {
    flex: 1
  },
});