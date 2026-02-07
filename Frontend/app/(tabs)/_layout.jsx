import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { gameScale } from '../Components/Responsiveness/gameResponsive';
import TabBarIconWrapper from '../Components/Tabs Components/TabBarIconWrapper';
import CustomTabBarButton from '../Components/Tabs Components/CustomTabBarButton';

const practiceIconUri = require('../Components/Tabs Components/PracticeIcon.png');
const mapIconUri = require('../Components/Tabs Components/MapIcon.png');
const leaderboardsIconUri = require('../Components/Tabs Components/LeaderboardIcon.png');
const profileIconUri = require('../Components/Tabs Components/ProfileIcon.png');

const backgroundIcon = require('../Components/Tabs Components/BackgroundIcon.png');

export default function TabLayout() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
    <Tabs
      initialRouteName="map" 
      screenOptions={{
        tabBarStyle: styles.tabBar,
        headerShown: false,
        tabBarItemStyle: styles.tabBarItem
      }}
    >
     <Tabs.Screen
        name="Practice" // This ensures the tab is visible and uses Practice.jsx
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
        name="map"
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
        name="leaderboards"
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
        name="profile"
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