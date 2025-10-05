import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TabLayout() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
    <Tabs
      screenOptions={{
        tabBarStyle: styles.tabBar,
        headerShown: false
      }}
    >
      <Tabs.Screen
        name="Practice"
        options={{
          title: '',
          tabBarIcon: ({ _, size }) => (
             <Image 
              source={{uri: 'https://github.com/user-attachments/assets/f4f6677b-a571-4deb-86a7-77493befd93c'}} 
              style={styles.mapIconPractice} 
            />
          ),
        }}
      />

       <Tabs.Screen
        name="Map"
        options={{
          title: '',
          tabBarIcon: ({ _, size }) => (
              <Image 
              source={{uri: 'https://github.com/user-attachments/assets/d1ce0b07-6a4a-4923-b6bb-792eac2e7117'}} 
              style={styles.mapIcon} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="Leaderboards"
        options={{
          title: '',
          tabBarIcon: ({ color, size }) => (
              <Image 
              source={{uri: 'https://github.com/user-attachments/assets/803566b0-4d71-4d04-8fef-c88c6ebe2cd8'}} 
              style={styles.mapIcon} 
            />
          ),
        }}
      />
       <Tabs.Screen
        name="Profile"
        options={{
          title: '',
          tabBarIcon: ({ _, size }) => (
              <Image 
              source={{uri: 'https://github.com/user-attachments/assets/c05034ae-bdab-4144-8fb7-f3c44c7ac630'}} 
              style={styles.mapIcon} 
            />
          ),
        }}
      />
    </Tabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingTop: 0,
  },
  tabBar:{
    backgroundColor: 'rgba(19, 140, 65, 0.23)',
    height: 80,
    paddingTop: 20,
    borderTopColor: 'rgba(19, 140, 65, 0.5)',
  },
  mapIcon: {
    width: 70,
    height: 70,
  },
  mapIconPractice: {
    width: 90,
    height: 90,
  }
});