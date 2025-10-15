/**
 * Elderly Connect - Help Post Management App
 * Main Application Component
 */

import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import PostsScreen from './src/screens/PostsScreen';
import CreatePostScreen from './src/screens/CreatePostScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({route}) => ({
            tabBarIcon: ({focused, color, size}) => {
              let iconName: string;

              if (route.name === 'Posts') {
                iconName = focused ? 'post' : 'post-outline';
              } else if (route.name === 'Create') {
                iconName = focused ? 'plus-circle' : 'plus-circle-outline';
              } else {
                iconName = focused ? 'cog' : 'cog-outline';
              }

              return <Icon name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#4A90E2',
            tabBarInactiveTintColor: 'gray',
            headerStyle: {
              backgroundColor: '#4A90E2',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 20,
            },
            tabBarStyle: {
              paddingBottom: 5,
              paddingTop: 5,
              height: 60,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '600',
            },
          })}>
          <Tab.Screen 
            name="Posts" 
            component={PostsScreen}
            options={{title: 'My Help Posts'}}
          />
          <Tab.Screen 
            name="Create" 
            component={CreatePostScreen}
            options={{title: 'New Request'}}
          />
          <Tab.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{title: 'Settings'}}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;

