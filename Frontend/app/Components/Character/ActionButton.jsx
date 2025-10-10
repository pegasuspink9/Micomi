import React from 'react';
import { TouchableOpacity, Text, Image, View, ActivityIndicator } from 'react-native';

export default function ActionButton({ 
  currentHero, 
  onSelectCharacter, 
  onShowBuyModal, 
  coinIcon, 
  styles, 
  disabled,
  selecting 
}) {
  if (!currentHero) return null;

  // Show buy button if character is not purchased
  if (!currentHero.is_purchased) {
    return (
      <TouchableOpacity
        style={styles.buyButton}
        onPress={onShowBuyModal}
        disabled={disabled}
      >
        <Image source={{ uri: coinIcon }} style={styles.coinIcon} />
        <Text style={styles.buttonText}>Buy {currentHero.character_price}</Text>
      </TouchableOpacity>
    );
  }

  // Show "Selected" for currently selected character (non-clickable)
  if (currentHero.is_selected) {
    return (
      <View style={[
        styles.selectButton, 
        { backgroundColor: 'rgba(76, 175, 80, 0.8)', borderColor: '#4CAF50' }
      ]}>
        <Text style={styles.buttonText}>Selected</Text>
      </View>
    );
  }

  // Show select button for purchased but not selected characters
  return (
    <TouchableOpacity
      style={styles.selectButton}
      onPress={() => onSelectCharacter(currentHero.character_name)}
      disabled={disabled || selecting}
    >
      {selecting ? (
        <ActivityIndicator size="small" color="white" />
      ) : (
        <Text style={styles.buttonText}>Select</Text>
      )}
    </TouchableOpacity>
  );
}