import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator } from 'react-native'; // ✅ Add ActivityIndicator
import { 
  scale, 
  scaleWidth, 
  scaleHeight, 
  RESPONSIVE 
} from '../Responsiveness/gameResponsive';

const GameOverModal = ({
  visible = false,
  onRetry = null,
  onHome = null,
  characterName = 'Character',
  enemyName = 'Enemy',
  isRetrying = false
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.gameOverTitle}>GAME OVER</Text>
          
          <Text style={styles.defeatMessage}>
            {characterName} was defeated by {enemyName}
          </Text>
          
          {isRetrying ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.loadingText}>Restarting level...</Text>
            </View>
          ) : (
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.retryButton} 
                onPress={onRetry}
              >
                <Text style={styles.buttonText}>RETRY</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.homeButton} 
                onPress={onHome}
              >
                <Text style={styles.buttonText}>HOME</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: RESPONSIVE.borderRadius.lg,
    padding: RESPONSIVE.margin.xl,
    alignItems: 'center',
    width: scaleWidth(280),
    borderWidth: scale(2),
    borderColor: '#ff4444',
  },

  gameOverTitle: {
    fontSize: RESPONSIVE.fontSize.header,
    fontFamily: 'DynaPuff',
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: RESPONSIVE.margin.lg,
  },

  defeatMessage: {
    fontSize: RESPONSIVE.fontSize.md,
    fontFamily: 'DynaPuff',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: RESPONSIVE.margin.xl,
  },

  buttonContainer: {
    width: '100%',
    gap: RESPONSIVE.margin.md,
  },

  retryButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: RESPONSIVE.margin.md,
    paddingHorizontal: RESPONSIVE.margin.xl,
    borderRadius: RESPONSIVE.borderRadius.md,
    alignItems: 'center',
  },

  homeButton: {
    backgroundColor: '#2196F3',
    paddingVertical: RESPONSIVE.margin.md,
    paddingHorizontal: RESPONSIVE.margin.xl,
    borderRadius: RESPONSIVE.borderRadius.md,
    alignItems: 'center',
  },

  buttonText: {
    fontSize: RESPONSIVE.fontSize.lg,
    fontFamily: 'DynaPuff',
    color: '#ffffff',
    fontWeight: 'bold',
  },

  loadingContainer: {
    alignItems: 'center',
    paddingVertical: RESPONSIVE.margin.xl,
  },

  loadingText: {
    fontSize: RESPONSIVE.fontSize.md,
    fontFamily: 'DynaPuff',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: RESPONSIVE.margin.md,
  },
});

export default GameOverModal;