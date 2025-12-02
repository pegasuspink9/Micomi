import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { gameScale } from '../Responsiveness/gameResponsive';
import QuestCard from './QuestCard';

const QuestsSection = ({ quests }) => {
  const router = useRouter();
  
  return (
    <View style={styles.questsSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quests & Missions</Text>
        <TouchableOpacity 
          onPress={() => router.push('/Components/User Labs/QuestsView')}
          style={styles.viewAllButton}
        >
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      {quests.slice(0, 2).map((quest) => ( 
        <QuestCard key={quest.id} quest={quest} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  questsSection: {
    marginBottom: gameScale(16),
    padding: gameScale(16),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: gameScale(8),
  },
  sectionTitle: {
    fontSize: gameScale(40),
    color: 'white',
    fontFamily: 'MusicVibes',
    marginBottom: gameScale(20),
    textShadowColor: '#000000ff',
  },
  viewAllButton: {
    paddingHorizontal: gameScale(12),
    paddingVertical: gameScale(6),
    borderColor: '#2ee7ffff',
  },
  viewAllText: {
    fontSize: gameScale(12),
    color: '#ffffffff',
    fontFamily: 'GoldenAge',
  },
});

export default QuestsSection;