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

  if (!currentHero.is_purchased) {
    return (
      <TouchableOpacity
        style={styles.buyButton}
        onPress={onShowBuyModal}
        disabled={disabled}
      >
        <Image source={{ uri: coinIcon }} style={styles.coinIcon} />
        <Text style={styles.buttonText}>{currentHero.character_price}</Text>
      </TouchableOpacity>
    );
  }

  
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