import React, { useState, useCallback } from "react";
import { 
  Text, 
  View, 
  ScrollView, 
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ImageBackground,
  // Modal, // Removed Modal
  FlatList, 
  Image 
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';

import { gameScale } from '../Components/Responsiveness/gameResponsive';
import { usePlayerProfile } from '../hooks/usePlayerProfile';

// Import all Profile components
import PlayerInfoSection from '../Comp\onents/Profile Components/PlayerInfoSection';
import StatsGridSection from '../Components/Profile Components/StatsGridSection';
import InventorySection from '../Components/Profile Components/InventorySection';

export default function Profile() {
  const {
    playerData,
    loading,
    error,
    loadPlayerProfile,
    clearError,
    availableAvatars,
    updateAvatar,
    isSelectingAvatar
  } = usePlayerProfile();

  const [inventoryTab, setInventoryTab] = useState('Badges');
  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);
  const [selectedAvatarId, setSelectedAvatarId] = useState(null);

  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Profile tab focused - refreshing data...');
      loadPlayerProfile();  
    }, [loadPlayerProfile])
  );

  const handleAvatarSelect = async () => {
    if (!selectedAvatarId) return;
    const result = await updateAvatar(selectedAvatarId);
    if (result.success) {
      setIsAvatarModalVisible(false);
      setSelectedAvatarId(null);
    }
  };

  // Simplified loading - assets are already cached from Map API
  if (loading || !playerData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <LinearGradient 
          colors={['#0a192f', '#172b4aff', '#0a192f']}
          style={styles.gradientBackground}
        >
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
        
        {/* Main Content ScrollView */}
        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isAvatarModalVisible} // Disable scrolling when overlay is active
        >
          <PlayerInfoSection 
            playerName={playerData.playerName}
            username={playerData.username}
            selectedBadge={playerData.selectedBadge}
            playerLevel={playerData.playerLevel}
            expPoints={playerData.expPoints}
            maxLevelExp={playerData.maxLevelExp}
            playerAvatar={playerData.playerAvatar}
            onAvatarPress={() => setIsAvatarModalVisible(true)}
          />

          <StatsGridSection 
            coins={playerData.coins}
            currentStreak={playerData.currentStreak}
            expPoints={playerData.expPoints}
            maxStreak={playerData.maxStreak}
            maxLevelExp={playerData.maxLevelExp}
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

        {/* CUSTOM ABSOLUTE VIEW (Replaces Modal) */}
        {isAvatarModalVisible && (
          <View style={styles.modalOverlay}>
            <LinearGradient
              colors={['#1a2a44', '#0d1625']}
              style={styles.modalContent}
            >
              <Text style={styles.modalTitle}>Choose Your Avatar</Text>
              
              <FlatList
                data={availableAvatars}
                numColumns={3}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.avatarGrid}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[
                      styles.avatarOption,
                      selectedAvatarId === item.id && styles.avatarOptionSelected
                    ]}
                    onPress={() => setSelectedAvatarId(item.id)}
                  >
                    <View style={styles.modalAvatarOuter}>
                      <View style={styles.modalAvatarInner}>
                        <Image source={{ uri: item.url }} style={styles.modalAvatarImage} />
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              />

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => {
                    setIsAvatarModalVisible(false);
                    setSelectedAvatarId(null);
                  }}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.modalButton, 
                    styles.confirmButton,
                    (!selectedAvatarId || isSelectingAvatar) && styles.buttonDisabled
                  ]} 
                  onPress={handleAvatarSelect}
                  disabled={!selectedAvatarId || isSelectingAvatar}
                >
                  {isSelectingAvatar ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.buttonText}>Use Avatar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </LinearGradient>
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
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  scrollContainer: {
    flex: 1
  },
  // UPDATED MODAL STYLES FOR ABSOLUTE POSITIONING
  modalOverlay: {
    position: 'absolute', // Make it float
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000, // Ensure it's on top of everything
    backgroundColor: 'rgba(0, 0, 0, 0.85)', // Slightly darker for better contrast
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: gameScale(20),
    padding: gameScale(20),
    borderWidth: gameScale(2),
    borderColor: 'rgba(255, 255, 255, 0.2)',
    // Add shadow/elevation to make it pop over the absolute view
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: gameScale(24),
    fontFamily: 'Grobold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: gameScale(20),
  },
  avatarGrid: {
    alignItems: 'center',
  },
  avatarOption: {
    margin: gameScale(8),
    padding: gameScale(4),
    borderRadius: gameScale(10),
  },
  avatarOptionSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: '#4CAF50',
    borderWidth: gameScale(2),
  },
  modalAvatarOuter: {
    borderWidth: gameScale(1.5), 
    borderColor: 'rgba(255, 255, 255, 0.4)', 
    borderRadius: gameScale(5), 
    padding: gameScale(2), 
    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
  },
  modalAvatarInner: {
    borderWidth: gameScale(0.5), 
    borderColor: 'rgba(255, 255, 255, 0.7)', 
    borderRadius: gameScale(5),
    backgroundColor: 'rgba(0, 0, 0, 0.2)', 
  },
  modalAvatarImage: {
    width: gameScale(70),
    height: gameScale(70),
    borderRadius: gameScale(5),
    resizeMode: 'cover', 
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: gameScale(20),
  },
  modalButton: {
    flex: 1,
    padding: gameScale(12),
    borderRadius: gameScale(10),
    alignItems: 'center',
    marginHorizontal: gameScale(5),
  },
  cancelButton: {
    backgroundColor: '#ff4444',
  },
  confirmButton: {
    backgroundColor: '#005dc8',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontFamily: 'DynaPuff',
    fontSize: gameScale(14),
  },
});