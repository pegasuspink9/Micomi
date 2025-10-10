import React from 'react';
import { TouchableOpacity, Text, Image, View } from 'react-native';

const ActionButton = ({ 
  currentHero, 
  onHeroSelection, 
  onShowBuyModal, 
  coinIcon, 
  styles, 
  disabled = false 
}) => {
  if (!currentHero) return null;

  // Show select button for purchased characters that are not selected
  if (currentHero.is_purchased && !currentHero.is_selected) {
    return (
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => onHeroSelection(currentHero.character_name)}
        disabled={disabled}
      >
        <Text style={styles.buttonText}>
          {disabled ? 'Selecting...' : 'Select'}
        </Text>
      </TouchableOpacity>
    );
  }

  // Show "Selected" for currently selected character
  if (currentHero.is_purchased && currentHero.is_selected) {
    return (
      <View style={[styles.selectButton, { backgroundColor: 'rgba(76, 175, 80, 0.8)' }]}>
        <Text style={styles.buttonText}>Selected</Text>
      </View>
    );
  }

  // Show buy button for unpurchased characters
  if (!currentHero.is_purchased) {
    return (
      <TouchableOpacity
        style={styles.buyButton}
        onPress={() => onShowBuyModal(true)}
        disabled={disabled}
      >
        <Image source={{ uri: coinIcon }} style={styles.coinIcon} />
        <Text style={styles.buttonText}>
          {disabled ? 'Purchasing...' : `Buy ${currentHero.character_price}`}
        </Text>
      </TouchableOpacity>
    );
  }

  return null;
};

export default ActionButton;