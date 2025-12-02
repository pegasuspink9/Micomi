import React, { useState } from "react";
import { 
  Text, 
  View, 
  ScrollView, 
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
  TouchableOpacity
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';

import AssetDownloadProgress from '../Components/RoadMap/LoadingState/assetDownloadProgress';
import { gameScale } from '../Components/Responsiveness/gameResponsive';
import { usePlayerProfile } from '../hooks/usePlayerProfile';

// Import all Profile components - Fixed imports
import Tabs from '../Components/Profile Components/Tabs';
import PlayerInfoSection from '../Components/Profile Components/PlayerInfoSection';
import StatsGridSection from '../Components/Profile Components/StatsGridSection';
import InventorySection from '../Components/Profile Components/InventorySection';
import QuestsSection from '../Components/Profile Components/QuestsSection';

export default function Profile() {
  const playerId = 11;
  const {
    playerData,
    loading,
    error,
    assetsLoading,
    assetsProgress,
    loadPlayerProfile,
    clearError
  } = usePlayerProfile(playerId);

  const [activeTab, setActiveTab] = useState('Profile');
  const [inventoryTab, setInventoryTab] = useState('Badges');

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  if (assetsLoading) {
    return (
      <>
        <View style={styles.container}>
          <ImageBackground 
            source={{ uri: 'https://res.cloudinary.com/dm8i9u1pk/image/upload/v1759901895/labBackground_otqad4.jpg' }} 
            style={styles.ImageBackgroundContainer} 
            resizeMode="cover"
          >
            <View style={styles.backgroundOverlay} />
          </ImageBackground>
        </View>
        <AssetDownloadProgress
          visible={assetsLoading}
          progress={assetsProgress}
          currentAsset={assetsProgress.currentAsset}
        />
      </>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => {
          clearError();
          loadPlayerProfile();
        }}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!playerData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>No player data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={['#0a192f', '#172b4aff', '#0a192f']} // Dark navy gradient
        style={styles.gradientBackground}
      >
        <View style={styles.backgroundOverlay} />
        
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {activeTab === 'Profile' && (
          <ScrollView 
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <PlayerInfoSection 
              playerName={playerData.playerName}
              username={playerData.username}
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
            
            <QuestsSection quests={playerData.quests} />
            
            <View style={{ height: gameScale(16) }} />
          </ScrollView>
        )}

        {activeTab === 'Missions' && (
          <View style={[styles.centered, { flex: 1 }]}>
            <Text style={styles.loadingText}>Missions Content Goes Here</Text>
          </View>
        )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.2)', // Adjusted for subtle depth
  },
  scrollContainer: {
    flex: 1
  },
});