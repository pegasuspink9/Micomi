import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Modal,
  ImageBackground
} from 'react-native';
import { useRouter } from 'expo-router';
import { usePlayerProfile } from '../../hooks/usePlayerProfile';
import {
  scale,
  wp,
  RESPONSIVE,
  layoutHelpers,
} from '../Responsiveness/gameResponsive';

export default function PotionsView() {
  const router = useRouter();
  const playerId = 11;
  const { playerData, loading } = usePlayerProfile(playerId);
  const [selectedPotion, setSelectedPotion] = useState(null);
  const [showModal, setShowModal] = useState(false);

  if (loading || !playerData) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading potions...</Text>
      </SafeAreaView>
    );
  }

  const getTotalPotions = () => {
    return playerData.potions.reduce((total, potion) => total + potion.count, 0);
  };

  const handlePotionPress = (potion) => {
    setSelectedPotion(potion);
    setShowModal(true);
  };

  const handleUsePotion = () => {
    if (selectedPotion && selectedPotion.count > 0) {
      console.log(`Used ${selectedPotion.name}`);
      setShowModal(false);
    }
  };

  const getBackgroundColor = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('health')) return 'rgba(156, 167, 83, 0.66)';
    if (lowerName.includes('mana')) return 'rgba(29, 29, 85, 0.8)'; 
    if (lowerName.includes('strength')) return 'rgba(121, 94, 14, 0.8)';
    if (lowerName.includes('freeze')) return 'rgba(68, 68, 255, 0.8)';
    if (lowerName.includes('hint')) return 'rgba(0, 255, 0, 0.8)';
    return 'rgba(156, 39, 176, 0.8)'; 
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={{ uri: playerData.containerBackground }} style={styles.backgroundContainer} resizeMode="cover">
        <View style={styles.backgroundOverlay} />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Potion Inventory</Text>
          <View style={styles.headerStats}>
            <Text style={styles.statsText}>{getTotalPotions()}</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Summary */}
          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>Total Potions: {getTotalPotions()}</Text>
            <Text style={styles.summarySubtext}>Tap a potion to view details</Text>
          </View>

          {/* Potions Grid */}
          <View style={styles.potionsGrid}>
            {playerData.potions.map((potion) => (
              <PotionCard 
                key={potion.id} 
                potion={potion} 
                onPress={() => handlePotionPress(potion)}
                backgroundColor={getBackgroundColor(potion.name)}
              />
            ))}
          </View>

          <View style={{ height: layoutHelpers.gap.xl }} />
        </ScrollView>

        {/* Potion Detail Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showModal}
          onRequestClose={() => setShowModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              {selectedPotion && (
                <>
                  <View style={[styles.modalHeader, { borderColor: selectedPotion.color }]}>
                    <Image 
                      source={{ uri: selectedPotion.icon }} 
                      style={styles.modalIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.modalTitle}>{selectedPotion.name}</Text>
                  </View>

                  <View style={styles.modalContent}>
                    <Text style={styles.modalDescription}>{selectedPotion.description}</Text>
                    
                    <View style={styles.detailsContainer}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Type:</Text>
                        <Text style={[styles.detailValue, { color: selectedPotion.color }]}>
                          {selectedPotion.type}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Price:</Text>
                        <Text style={styles.detailValue}>{selectedPotion.price} coins</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>In Stock:</Text>
                        <Text style={styles.detailValue}>{selectedPotion.count}</Text>
                      </View>
                    </View>

                    <View style={styles.modalButtons}>
                      <TouchableOpacity 
                        style={styles.cancelButton} 
                        onPress={() => setShowModal(false)}
                      >
                        <Text style={styles.cancelButtonText}>Close</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[
                          styles.useButton, 
                          { 
                            backgroundColor: selectedPotion.count > 0 ? selectedPotion.color : '#666',
                            opacity: selectedPotion.count > 0 ? 1 : 0.5
                          }
                        ]} 
                        onPress={handleUsePotion}
                        disabled={selectedPotion.count === 0}
                      >
                        <Text style={styles.useButtonText}>
                          {selectedPotion.count > 0 ? 'Use Potion' : 'Out of Stock'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      </ImageBackground>
    </SafeAreaView>
  );
}

const PotionCard = ({ potion, onPress, backgroundColor }) => {
  return (
    <TouchableOpacity 
      style={styles.potionCardContainer}
      onPress={onPress}
    >
      <View style={styles.potionCardShadow} />
      <View style={[styles.potionCard, { backgroundColor }]}>
        <Image 
          source={{ uri: potion.icon }} 
          style={styles.potionIcon}
          resizeMode="contain"
        />
        
        <Text style={styles.potionName}>{potion.name}</Text>
        
        <View style={[styles.countBadge, { backgroundColor: potion.color }]}>
          <Text style={styles.countText}>{potion.count}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  backgroundContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.54)', 
  },
  loadingText: {
    color: 'white',
    fontSize: RESPONSIVE.fontSize.md,
    textAlign: 'center',
    marginTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE.margin.lg,
    paddingVertical: RESPONSIVE.margin.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  backButton: {
    padding: RESPONSIVE.margin.sm,
  },
  backButtonText: {
    color: '#2ee7ffff',
    fontSize: RESPONSIVE.fontSize.md,
    fontFamily: 'GoldenAge',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: RESPONSIVE.fontSize.xl,
    color: 'white',
    fontFamily: 'MusicVibes',
    fontWeight: 'bold',
  },
  headerStats: {
    backgroundColor: 'rgba(46, 231, 255, 0.2)',
    paddingHorizontal: RESPONSIVE.margin.md,
    paddingVertical: RESPONSIVE.margin.sm,
    borderRadius: RESPONSIVE.borderRadius.md,
    borderWidth: 1,
    borderColor: '#2ee7ffff',
  },
  statsText: {
    color: '#2ee7ffff',
    fontSize: RESPONSIVE.fontSize.md,
    fontFamily: 'FunkySign',
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: RESPONSIVE.margin.md,
  },
  summarySection: {
    alignItems: 'center',
    paddingVertical: layoutHelpers.gap.lg,
  },
  summaryTitle: {
    fontSize: RESPONSIVE.fontSize.lg,
    color: 'white',
    fontFamily: 'MusicVibes',
    fontWeight: 'bold',
    marginBottom: layoutHelpers.gap.xs,
  },
  summarySubtext: {
    fontSize: RESPONSIVE.fontSize.sm,
    color: '#888',
    fontFamily: 'DynaPuff',
  },
  potionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: layoutHelpers.gap.md,
  },
  potionCardContainer: {
    width: wp(40),
    marginBottom: layoutHelpers.gap.md,
    position: 'relative',
  },
  potionCardShadow: {
    position: 'absolute',
    top: scale(4),
    left: scale(1),
    right: -scale(1),
    bottom: -scale(15),
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: RESPONSIVE.borderRadius.lg,
    zIndex: 1,
  },
  potionCard: {
    borderRadius: RESPONSIVE.borderRadius.lg,
    padding: RESPONSIVE.margin.md,
    borderWidth: 2,
    borderColor: '#dfdfdfff',
    shadowColor: '#ffffffff',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 8,
    zIndex: 2,
    position: 'relative',
    alignItems: 'center',
    height: scale(140),
    justifyContent: 'center',
  },
  potionIcon: {
    width: scale(60),
    height: scale(60),
    marginBottom: layoutHelpers.gap.sm,
  },
  potionName: {
    fontSize: RESPONSIVE.fontSize.sm,
    color: 'rgba(53, 53, 53, 1)',
    textAlign: 'center',
    fontFamily: 'FunkySign',
    fontWeight: 'bold',
    position: 'absolute',
    bottom: scale(10),
  },
  countBadge: {
    position: 'absolute',
    top: scale(8),
    right: scale(8),
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: RESPONSIVE.borderRadius.sm,
  },
  countText: {
    fontSize: RESPONSIVE.fontSize.sm,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'FunkySign',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'rgba(27, 98, 124, 0.95)',
    borderRadius: RESPONSIVE.borderRadius.xl,
    width: wp(85),
    maxHeight: '80%',
    borderWidth: 2,
    borderColor: '#dfdfdfff',
  },
  modalHeader: {
    alignItems: 'center',
    padding: RESPONSIVE.margin.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    borderTopLeftRadius: RESPONSIVE.borderRadius.xl,
    borderTopRightRadius: RESPONSIVE.borderRadius.xl,
  },
  modalIcon: {
    width: scale(80),
    height: scale(80),
    marginBottom: layoutHelpers.gap.md,
  },
  modalTitle: {
    fontSize: RESPONSIVE.fontSize.xl,
    color: 'white',
    fontFamily: 'MusicVibes',
    fontWeight: 'bold',
  },
  modalContent: {
    padding: RESPONSIVE.margin.lg,
  },
  modalDescription: {
    fontSize: RESPONSIVE.fontSize.md,
    color: '#ccc',
    fontFamily: 'DynaPuff',
    textAlign: 'center',
    marginBottom: layoutHelpers.gap.lg,
  },
  detailsContainer: {
    marginBottom: layoutHelpers.gap.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layoutHelpers.gap.sm,
  },
  detailLabel: {
    fontSize: RESPONSIVE.fontSize.md,
    color: '#888',
    fontFamily: 'FunkySign',
  },
  detailValue: {
    fontSize: RESPONSIVE.fontSize.md,
    color: 'white',
    fontFamily: 'FunkySign',
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 0.4,
    backgroundColor: '#666',
    paddingVertical: RESPONSIVE.margin.md,
    borderRadius: RESPONSIVE.borderRadius.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: RESPONSIVE.fontSize.md,
    fontFamily: 'FunkySign',
    fontWeight: 'bold',
  },
  useButton: {
    flex: 0.55,
    paddingVertical: RESPONSIVE.margin.md,
    borderRadius: RESPONSIVE.borderRadius.md,
    alignItems: 'center',
  },
  useButtonText: {
    color: 'white',
    fontSize: RESPONSIVE.fontSize.md,
    fontFamily: 'FunkySign',
    fontWeight: 'bold',
  },
});