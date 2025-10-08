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
        style={[currentHero.is_purchased ? styles.selectButton : styles.buyButton]}
        onPress={currentHero.is_purchased
          ? (currentHero.is_selected ? null : () => onHeroSelection(currentHero.character_name))
          : () => onShowBuyModal(true)
        }
      >
        {currentHero.is_purchased ? (
          <Text style={styles.buttonText}>
            {currentHero.is_selected ? "Selected" : "Select"}
          </Text>
        ) : (
          <>
            <Image source={{ uri: coinIcon }} style={styles.coinIcon} />
            <Text style={styles.buttonText}>{currentHero.character_price}</Text>
          </>
        )}
      </TouchableOpacity>
  );
}