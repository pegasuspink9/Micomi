import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  scale,
  wp,
  RESPONSIVE,
  layoutHelpers,
} from '../Responsiveness/gameResponsive';

// Mock extended potions data
const allPotionsData = [
  { 
    id: 1, 
    name: "Health Potion", 
    count: 12, 
    icon: "https://via.placeholder.com/80x80/ff4444/FFFFFF?text=HP", 
    color: "#ff4444",
    description: "Restores 50 HP instantly",
    rarity: "Common",
    effect: "+50 Health",
    duration: "Instant"
  },
  { 
    id: 2, 
    name: "Mana Potion", 
    count: 8, 
    icon: "https://via.placeholder.com/80x80/4444ff/FFFFFF?text=MP", 
    color: "#4444ff",
    description: "Restores 30 MP instantly",
    rarity: "Common",
    effect: "+30 Mana",
    duration: "Instant"
  },
  { 
    id: 3, 
    name: "Strength Potion", 
    count: 3, 
    icon: "https://via.placeholder.com/80x80/ff8800/FFFFFF?text=STR", 
    color: "#ff8800",
    description: "Increases damage for 5 minutes",
    rarity: "Rare",
    effect: "+25% Damage",
    duration: "5 minutes"
  },
  { 
    id: 4, 
    name: "Speed Potion", 
    count: 5, 
    icon: "https://via.placeholder.com/80x80/00ff00/000000?text=SPD", 
    color: "#00ff00",
    description: "Increases movement speed temporarily",
    rarity: "Uncommon",
    effect: "+30% Speed",
    duration: "3 minutes"
  },
  { 
    id: 5, 
    name: "Invisibility Potion", 
    count: 1, 
    icon: "https://via.placeholder.com/80x80/888888/FFFFFF?text=INV", 
    color: "#888888",
    description: "Become invisible to enemies",
    rarity: "Epic",
    effect: "Stealth Mode",
    duration: "30 seconds"
  },
  { 
    id: 6, 
    name: "Fire Resistance", 
    count: 7, 
    icon: "https://via.placeholder.com/80x80/ff6600/FFFFFF?text=FR", 
    color: "#ff6600",
    description: "Immune to fire damage",
    rarity: "Uncommon",
    effect: "Fire Immunity",
    duration: "2 minutes"
  },
];

export default function PotionsView() {
  const router = useRouter();
  const [selectedPotion, setSelectedPotion] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'Common': return '#CCCCCC';
      case 'Uncommon': return '#4CAF50';
      case 'Rare': return '#2196F3';
      case 'Epic': return '#9C27B0';
      case 'Legendary': return '#FF9800';
      default: return '#CCCCCC';
    }
  };

  const getTotalPotions = () => {
    return allPotionsData.reduce((total, potion) => total + potion.count, 0);
  };

  const handlePotionPress = (potion) => {
    setSelectedPotion(potion);
    setShowModal(true);
  };

  const handleUsePotion = () => {
    if (selectedPotion && selectedPotion.count > 0) {
      // Logic to use potion would go here
      console.log(`Used ${selectedPotion.name}`);
      setShowModal(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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
          <Text style={styles.summarySubtext}>Tap a potion to view details and use</Text>
        </View>

        {/* Potions Grid */}
        <View style={styles.potionsGrid}>
          {allPotionsData.map((potion) => (
            <PotionCard 
              key={potion.id} 
              potion={potion} 
              onPress={() => handlePotionPress(potion)}
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
                  <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(selectedPotion.rarity) }]}>
                    <Text style={styles.rarityText}>{selectedPotion.rarity}</Text>
                  </View>
                </View>

                <View style={styles.modalContent}>
                  <Text style={styles.modalDescription}>{selectedPotion.description}</Text>
                  
                  <View style={styles.detailsContainer}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Effect:</Text>
                      <Text style={[styles.detailValue, { color: selectedPotion.color }]}>
                        {selectedPotion.effect}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Duration:</Text>
                      <Text style={styles.detailValue}>{selectedPotion.duration}</Text>
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
    </SafeAreaView>
  );
}

const PotionCard = ({ potion, onPress }) => {
  const rarityColor = getRarityColor(potion.rarity);
  
  return (
    <TouchableOpacity 
      style={[styles.potionCard, { borderColor: potion.color }]}
      onPress={onPress}
    >
      <View style={[styles.rarityIndicator, { backgroundColor: rarityColor }]} />
      
      <Image 
        source={{ uri: potion.icon }} 
        style={styles.potionIcon}
        resizeMode="contain"
      />
      
      <Text style={styles.potionName}>{potion.name}</Text>
      
      <View style={[styles.countBadge, { backgroundColor: potion.color }]}>
        <Text style={styles.countText}>{potion.count}</Text>
      </View>
      
      <View style={styles.rarityContainer}>
        <Text style={[styles.rarityLabel, { color: rarityColor }]}>
          {potion.rarity}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const getRarityColor = (rarity) => {
  switch (rarity) {
    case 'Common': return '#CCCCCC';
    case 'Uncommon': return '#4CAF50';
    case 'Rare': return '#2196F3';
    case 'Epic': return '#9C27B0';
    case 'Legendary': return '#FF9800';
    default: return '#CCCCCC';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE.margin.lg,
    paddingVertical: RESPONSIVE.margin.md,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: RESPONSIVE.margin.sm,
  },
  backButtonText: {
    color: '#4CAF50',
    fontSize: RESPONSIVE.fontSize.md,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: RESPONSIVE.fontSize.xl,
    color: 'white',
    fontWeight: 'bold',
  },
  headerStats: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: RESPONSIVE.margin.md,
    paddingVertical: RESPONSIVE.margin.sm,
    borderRadius: RESPONSIVE.borderRadius.md,
  },
  statsText: {
    color: '#FFD700',
    fontSize: RESPONSIVE.fontSize.md,
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
    fontWeight: 'bold',
    marginBottom: layoutHelpers.gap.xs,
  },
  summarySubtext: {
    fontSize: RESPONSIVE.fontSize.sm,
    color: '#888',
  },
  potionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  potionCard: {
    width: wp(45),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RESPONSIVE.borderRadius.lg,
    padding: RESPONSIVE.margin.md,
    marginBottom: layoutHelpers.gap.md,
    borderWidth: 2,
    position: 'relative',
    alignItems: 'center',
  },
  rarityIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: scale(4),
    borderTopLeftRadius: RESPONSIVE.borderRadius.lg,
    borderTopRightRadius: RESPONSIVE.borderRadius.lg,
  },
  potionIcon: {
    width: scale(60),
    height: scale(60),
    marginBottom: layoutHelpers.gap.sm,
  },
  potionName: {
    fontSize: RESPONSIVE.fontSize.sm,
    color: 'white',
    textAlign: 'center',
    marginBottom: layoutHelpers.gap.sm,
    fontWeight: 'bold',
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
    fontSize: RESPONSIVE.fontSize.xs,
    fontWeight: 'bold',
    color: 'white',
  },
  rarityContainer: {
    alignItems: 'center',
  },
  rarityLabel: {
    fontSize: RESPONSIVE.fontSize.xs,
    fontWeight: 'bold',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'rgba(15, 15, 15, 0.95)',
    borderRadius: RESPONSIVE.borderRadius.xl,
    width: wp(85),
    maxHeight: '80%',
    borderWidth: 2,
    borderColor: '#333',
  },
  modalHeader: {
    alignItems: 'center',
    padding: RESPONSIVE.margin.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
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
    fontWeight: 'bold',
    marginBottom: layoutHelpers.gap.sm,
  },
  rarityBadge: {
    paddingHorizontal: RESPONSIVE.margin.md,
    paddingVertical: RESPONSIVE.margin.sm,
    borderRadius: RESPONSIVE.borderRadius.md,
  },
  rarityText: {
    fontSize: RESPONSIVE.fontSize.sm,
    color: 'white',
    fontWeight: 'bold',
  },
  modalContent: {
    padding: RESPONSIVE.margin.lg,
  },
  modalDescription: {
    fontSize: RESPONSIVE.fontSize.md,
    color: '#ccc',
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
  },
  detailValue: {
    fontSize: RESPONSIVE.fontSize.md,
    color: 'white',
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
    fontWeight: 'bold',
  },
});