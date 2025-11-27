import React from 'react';
import { TouchableOpacity, Text, Image, ActivityIndicator, View } from 'react-native';

const ActionButton = ({
  currentHero,
  onSelectCharacter,
  onShowBuyModal,
  coinIcon,
  styles,
  disabled,
  selecting
}) => {
  if (!currentHero) {
    return null; // Don't render anything if there's no hero data
  }

  // Case 1: Character is already purchased
  if (currentHero.is_purchased) {
    if (currentHero.is_selected) {
      return (
        <View style={[styles.selectButton, { backgroundColor: '#0a3d62', borderColor: '#4CAF50' }]}>
          <Text style={styles.buttonText}>Selected</Text>
        </View>
      );
    }
    // Sub-case: Character is purchased but not selected
    return (
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => onSelectCharacter(currentHero.character_name)}
        disabled={disabled}
      >
        {selecting ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.buttonText}>Select</Text>
        )}
      </TouchableOpacity>
    );
  }

  // Case 2: Character is not purchased yet
  return (
    <TouchableOpacity
      style={styles.buyButton}
      onPress={() => onShowBuyModal(true)}
      disabled={disabled}
    >
      <Image source={{ uri: coinIcon }} style={styles.coinIcon} />
      <Text style={styles.buttonText}>
         {currentHero.character_price}
      </Text>
    </TouchableOpacity>
  );
};

export default ActionButton;