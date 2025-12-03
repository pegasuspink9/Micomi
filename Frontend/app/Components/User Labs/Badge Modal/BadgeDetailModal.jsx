import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { gameScale } from '../../Responsiveness/gameResponsive';
import { playerService } from '../../../services/playerService';

const BadgeDetailModal = ({ visible, badge, onClose, playerId = 11, onBadgeApplied }) => {
  const [isApplying, setIsApplying] = useState(false);

  if (!badge) return null;

  const handleApplyBadge = async () => {
    if (!badge.id || !playerId) {
      console.error('Missing badge ID or player ID');
      return;
    }

    try {
      setIsApplying(true);
      
      await playerService.selectBadge(playerId, badge.id);
      
      console.log(`🎖️ Badge "${badge.name}" applied successfully`);
      
      // Notify parent component that badge was applied
      if (onBadgeApplied) {
        onBadgeApplied(badge);
      }
      
      // Close the modal after successful application
      onClose();
      
    } catch (error) {
      console.error('Failed to apply badge:', error);
      Alert.alert(
        'Error',
        'Failed to apply badge. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsApplying(false);
    }
  };


  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          
          {/* ✅ UNIFIED FLOATING VIEW FOR ALL BADGES */}
          <View style={styles.floatingContainer}>
            <Image
              source={{ uri: badge.icon }}
              style={[
                styles.floatingIcon,
                !badge.earned && { tintColor: 'rgba(0, 0, 0, 1)', opacity: 1 }
              ]}
              resizeMode="contain"
            />
            <ScrollView style={styles.floatingTextScrollView} contentContainerStyle={{ alignItems: 'center' }} showsVerticalScrollIndicator={false}>
              <Text style={styles.floatingName}>{badge.name}</Text>
              <Text style={styles.floatingDescription}>{badge.description}</Text>
               
              {badge.earned ? (
              <>
              <Text style={styles.floatingEarnedText}>
              Earned: {new Date(badge.earnedDate).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric'
                  })}
              </Text>
              
              <View style={styles.buttonContainer}>
                {/* Apply Button */}
                <View style={styles.buttonLayer1}>
                  <View style={styles.buttonLayer2}>
                    <TouchableOpacity 
                      style={[styles.buttonLayer3, styles.applyButton]} 
                      activeOpacity={0.8}
                      onPress={handleApplyBadge}
                      disabled={isApplying}
                    >
                      {isApplying ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={styles.buttonText}>Apply Badge</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
                
                {/* Cancel Button */}
                <View style={styles.buttonLayer1}>
                  <View style={styles.buttonLayer2}>
                    <TouchableOpacity 
                      style={[styles.buttonLayer3, styles.cancelButton]} 
                      activeOpacity={0.8} 
                      onPress={onClose}
                      disabled={isApplying}
                    >
                      <Text style={styles.buttonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
                </>
              ) : (
                <>
                  {badge.conditions && (
                    <Text style={[styles.floatingDescription, {fontSize: gameScale(13), fontStyle: 'DynaPuff'}]}>
                      {'To unlock:\n'}{badge.conditions}
                    </Text>
                  )}
                </>
              )}
            </ScrollView>
          </View>
          
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};


const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: gameScale(20),
  },
  floatingContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingIcon: {
    width: gameScale(250),
    height: gameScale(250),
    marginBottom: gameScale(20),
  },
  floatingTextScrollView: {
    maxHeight: gameScale(200),
  },
  floatingName: {
    fontSize: gameScale(22),
    fontFamily: 'MusicVibes',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: gameScale(12),
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  floatingDescription: {
    fontSize: gameScale(14),
    fontFamily: 'DynaPuff',
    color: '#dddddd',
    textAlign: 'center',
    marginBottom: gameScale(10),
    paddingHorizontal: gameScale(10),
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  floatingEarnedText: {
    fontSize: gameScale(12),
    fontFamily: 'DynaPuff',
    color: '#ffffffff',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: gameScale(20),
    width: '100%',
  },

   buttonLayer1: {
    backgroundColor: '#1a1a1a',
    borderRadius: gameScale(25),
    padding: gameScale(2),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
    marginHorizontal: gameScale(8),
  },
  buttonLayer2: {
    backgroundColor: '#2a2a2a',
    borderRadius: gameScale(23),
    borderWidth: gameScale(1),
    borderTopColor: 'rgba(255, 255, 255, 1)',
    borderLeftColor: 'rgba(255, 255, 255, 1)',
    borderBottomColor: 'rgba(255, 255, 255, 1)',
    borderRightColor: 'rgba(255, 255, 255, 1)',
  },
  buttonLayer3: {
    borderRadius: gameScale(22),
    paddingVertical: gameScale(8),
    paddingHorizontal: gameScale(18),
    borderWidth: gameScale(1),
    borderColor: 'rgba(0, 0, 0, 0.4)',
  },
  
  applyButton: {
    backgroundColor: '#2b5c2cca', 
  },
  cancelButton: {
    backgroundColor: '#757575', 
  },
  buttonText: {
    color: '#ffffffff',
    fontSize: gameScale(12),
    fontFamily: 'MusicVibes'
  },
});

export default BadgeDetailModal;