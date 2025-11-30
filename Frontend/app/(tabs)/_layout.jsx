import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { gameScale } from '../Components/Responsiveness/gameResponsive';
import TabBarIconWrapper from '../Components/Tabs Components/TabBarIconWrapper';
import CustomTabBarButton from '../Components/Tabs Components/CustomTabBarButton';

const practiceIconUri = 'https://github.com/user-attachments/assets/f4f6677b-a571-4deb-86a7-77493befd93c';
const mapIconUri = 'https://github.com/user-attachments/assets/d1ce0b07-6a4a-4923-b6bb-792eac2e7117';
const leaderboardsIconUri = 'https://github.com/user-attachments/assets/803566b0-4d71-4d04-8fef-c88c6ebe2cd8';
const profileIconUri = 'https://github.com/user-attachments/assets/c05034ae-bdab-4144-8fb7-f3c44c7ac630';

const backgroundIcon = require('../Components/Tabs Components/BackgroundIcon.png');




export default function TabLayout() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
    <Tabs
      screenOptions={{
        tabBarStyle: styles.tabBar,
        headerShown: false,
        tabBarItemStyle: styles.tabBarItem
      }}
    >
      <Tabs.Screen
        name="Practice"
        options={{
          title: '',
          tabBarItemStyle: [styles.tabBarItem, { borderLeftWidth: 0 }],
          tabBarButton: (props) => <CustomTabBarButton {...props} />, 
          tabBarIcon: ({ focused }) => ( 
             <TabBarIconWrapper
                source={practiceIconUri}
                backgroundSource={backgroundIcon}
                imageStyle={styles.mapIconPractice}
                focused={focused}
             />
          ),
        }}
      />

       <Tabs.Screen
        name="Map"
        options={{
          title: '',
          tabBarButton: (props) => <CustomTabBarButton {...props} />, 
          tabBarIcon: ({ focused }) => (
              <TabBarIconWrapper
                source={mapIconUri}
                backgroundSource={backgroundIcon}
                imageStyle={styles.mapIcon}
                focused={focused}
              />
          ),
        }}
      />
      <Tabs.Screen
        name="Leaderboards"
        options={{
          title: '',
          tabBarButton: (props) => <CustomTabBarButton {...props} />, 
          tabBarIcon: ({ focused }) => (
              <TabBarIconWrapper
                source={leaderboardsIconUri}
                backgroundSource={backgroundIcon}
                imageStyle={styles.mapIcon}
                focused={focused}
              />
          ),
        }}
      />
       <Tabs.Screen
        name="Profile"
        options={{
          title: '',
          tabBarButton: (props) => <CustomTabBarButton {...props} />, 
          tabBarIcon: ({ focused }) => (
              <TabBarIconWrapper
                source={profileIconUri}
                backgroundSource={backgroundIcon}
                imageStyle={styles.mapIcon}
                focused={focused}
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
    backgroundColor: '#058bb0', // Main blue color
    height: gameScale(55),
    flexDirection: 'row',
    borderTopWidth: gameScale(3),
    borderTopColor: '#2d91a5a3', 
    

    shadowOpacity: 0,
    elevation: 0,
  },
  tabBarItem: {
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center',

    borderRightWidth: gameScale(2),
    borderRightColor: '#035C74',

    borderLeftWidth: gameScale(2),
    borderLeftColor: '#0AC9F0',
  },
  mapIcon: {
    width: gameScale(80),
    height: gameScale(80),
  },
  mapIconPractice: {
    width: gameScale(90), 
    height: gameScale(90), 
  }
});