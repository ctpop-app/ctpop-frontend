import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { ROUTES, TAB_OPTIONS } from './constants';
import { Ionicons } from '@expo/vector-icons';

// 메인 탭 화면들
import HomeScreen from '../screens/HomeScreen';
import MessageScreen from '../screens/MessageScreen';
import SettingsScreen from '../screens/SettingsScreen';
import BoardScreen from '../screens/BoardScreen';

// 임시 화면 컴포넌트
const TemporaryScreen = ({ name }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>{name} 화면</Text>
  </View>
);

const Tab = createBottomTabNavigator();

const MainTabs = () => {
  console.log('MainTabs 렌더링');
  console.log('SettingsScreen:', SettingsScreen);

  return (
    <Tab.Navigator
      initialRouteName={ROUTES.MAIN.HOME}
      screenOptions={({ route }) => {
        console.log('Tab.Navigator screenOptions - route:', route.name);
        return {
          ...TAB_OPTIONS[route.name],
          tabBarActiveTintColor: '#FF6B6B',
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
        };
      }}
    >
      <Tab.Screen
        name={ROUTES.MAIN.HOME}
        component={HomeScreen}
        options={{
          tabBarLabel: '홈',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name={focused ? 'home' : 'home-outline'} 
              size={size} 
              color={color} 
            />
          )
        }}
      />
      <Tab.Screen
        name={ROUTES.MAIN.BOARD}
        component={BoardScreen}
        options={{
          tabBarLabel: '토크',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name={focused ? 'chatbubbles' : 'chatbubbles-outline'} 
              size={size} 
              color={color} 
            />
          ),
          headerShown: false
        }}
      />
      <Tab.Screen
        name={ROUTES.MAIN.MESSAGES}
        component={MessageScreen}
        options={{
          tabBarLabel: '메시지',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name={focused ? 'mail' : 'mail-outline'} 
              size={size} 
              color={color} 
            />
          )
        }}
      />
      <Tab.Screen
        name={ROUTES.MAIN.SETTINGS}
        component={SettingsScreen}
        options={{
          tabBarLabel: '설정',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name={focused ? 'settings' : 'settings-outline'} 
              size={size} 
              color={color} 
            />
          )
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabs; 