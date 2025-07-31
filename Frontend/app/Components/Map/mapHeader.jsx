
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import React, { useState } from 'react';

export default function MapHeader() {

   const [playerData, setPlayerData] = useState({
      name: 'Noel Cant Code',
      level: 10,
      coins: 200,
      lives: 10
    });
  


  return (
    <View style={styles.header}>
      <View style={styles.playerInfo}>
        <View style={styles.avatar}>
          <Ionicons name="person-circle" size={40} color="#fff" />
        </View>
        <View style={styles.playerDetails}>
          <Text style={styles.playerName}>{playerData.name}</Text>
          <Text style={styles.playerLevel}>Lvl {playerData.level}</Text>
        </View>
      </View>
      
      <View style={styles.resources}>
        <View style={styles.resourceItem}>
          <FontAwesome name="money" size={20} color="#FFD700" />
          <Text style={styles.resourceText}>{playerData.coins}</Text>
        </View>
        <View style={styles.resourceItem}>
          <Ionicons name="heart" size={20} color="#FF6B6B" />
          <Text style={styles.resourceText}>{playerData.lives}</Text>
        </View>
      </View>

      <View style={styles.headerIcons}>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="settings" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
  },
  avatar: {
    marginRight: 5,
  },
  playerDetails: {
    flexDirection: 'column',
  },
  playerName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    fontStyle: 'FunkySign', // Use the custom fons
  },
  playerLevel: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  resources: {
    flexDirection: 'row',
    gap: 10,
    width: '40%',
    paddingBottom: 12,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  resourceText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 10,
    width: '11%',
    height: '100%',
  },
  iconButton: {
    padding: 5,
  },
});