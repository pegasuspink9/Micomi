import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { gameScale } from '../Responsiveness/gameResponsive';

const Tabs = ({ activeTab, setActiveTab }) => {
  return (
    <View style={styles.tabsContainer}>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'Profile' && styles.activeTab]}
        onPress={() => setActiveTab('Profile')}
      >
        <Text style={[styles.tabText, activeTab === 'Profile' && styles.activeTabText]}>
          Profile
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'Missions' && styles.activeTab]}
        onPress={() => setActiveTab('Missions')}
      >
        <Text style={[styles.tabText, activeTab === 'Missions' && styles.activeTabText]}>
          Missions
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: gameScale(30), 
    backgroundColor: 'rgba(10, 20, 40, 0.5)',
  },
  tab: {
    paddingHorizontal: gameScale(20),
    paddingVertical: gameScale(10),
    borderBottomWidth: gameScale(3),
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#9ccbd1ff',
  },
  tabText: {
    color: '#a0a0a0',
    fontSize: gameScale(16),
    fontFamily: 'MusicVibes',
  },
  activeTabText: {
    color: '#ffffff',
  },
});

export default Tabs;