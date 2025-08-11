import React from 'react';
import { TouchableOpacity, Text, Image } from 'react-native';

export default function ActionButton({ 
  currentHero, 
  onHeroSelection, 
  onShowBuyModal, 
  coinIcon,
  styles 
}) {
  return (
    <TouchableOpacity
      style={[currentHero.isPurchased ? styles.selectButton : styles.buyButton]}
      onPress={currentHero.isPurchased
        ? (currentHero.isSelected ? null : () => onHeroSelection(currentHero.name))
        : () => onShowBuyModal(true)
      }
    >
      {currentHero.isPurchased ? (
        <Text style={styles.buttonText}>
          {currentHero.isSelected ? "Selected" : "Select"}
        </Text>
      ) : (
        <>
          <Image source={{ uri: coinIcon }} style={styles.coinIcon} />
          <Text style={styles.buttonText}>{currentHero.buy}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}