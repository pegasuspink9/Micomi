import React from 'react';
import { View, Text, StyleSheet, Dimensions, Image, Animated, ScrollView } from 'react-native';
import { gameService } from '../../../services/gameService'; 

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ShopLevelModal = ({ potionShopData, opacityAnim, bounceAnim }) => {
  return (
    <Animated.View style={[styles.shopContent, { opacity: opacityAnim, transform: [{ scale: bounceAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }) }] }]}>
      <Text style={styles.shopDescription}>Welcome to the Potion Shop! Purchase potions to aid your journey.</Text>
      <ScrollView style={styles.potionList}>
        {potionShopData.map((potion) => (
          <View key={potion.potion_id} style={styles.potionItem}>
            <Image source={{ uri: potion.potion_url }} style={styles.potionImage} />
            <View style={styles.potionDetails}>
              <Text style={styles.potionName}>{gameService.getPotionDisplayName(potion.potion_type)}</Text>
              <Text style={styles.potionPrice}>{potion.potion_price} coins</Text>
              <Text style={styles.potionOwned}>Owned: {potion.player_owned_quantity}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  shopContent: {
    alignItems: 'center',
    marginTop: -16,
    padding: 10,
  },
  shopDescription: {
    fontSize: SCREEN_WIDTH * 0.03,
    color: '#ffffffff',
    textAlign: 'center',
    fontFamily: 'DynaPuff',
    marginBottom: 10,
  },
  potionList: {
    maxHeight: SCREEN_HEIGHT * 0.2,
    width: '100%',
  },
  potionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  potionImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  potionDetails: {
    flex: 1,
  },
  potionName: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'DynaPuff',
  },
  potionPrice: {
    color: '#ffd700',
    fontSize: 12,
    fontFamily: 'DynaPuff',
  },
  potionOwned: {
    color: '#ccc',
    fontSize: 12,
    fontFamily: 'DynaPuff',
  },
});

export default ShopLevelModal;