import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';

// 가져올 화면들을 임포트합니다 (없는 경우를 대비한 임시 컴포넌트)
import HomeScreen from '../screens/HomeScreen';
import MessageScreen from '../screens/MessageScreen';
import SettingsScreen from '../screens/SettingsScreen';

// 임시 화면 컴포넌트
const TemporaryScreen = ({ name }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>{name} 화면</Text>
  </View>
);

const Tab = createBottomTabNavigator();

const MainTabs = () => {
  // 화면들이 존재하는지 확인
  const HomeComponent = typeof HomeScreen !== 'undefined' ? HomeScreen : () => <TemporaryScreen name="홈" />;
  const MessageComponent = typeof MessageScreen !== 'undefined' ? MessageScreen : () => <TemporaryScreen name="메시지" />;
  const SettingsComponent = typeof SettingsScreen !== 'undefined' ? SettingsScreen : () => <TemporaryScreen name="설정" />;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubble' : 'chatbubble-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeComponent} 
        options={{ tabBarLabel: '홈' }}
      />
      <Tab.Screen 
        name="Messages" 
        component={MessageComponent}
        options={{ tabBarLabel: '메시지' }} 
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsComponent}
        options={{ tabBarLabel: '설정' }} 
      />
    </Tab.Navigator>
  );
};

export default MainTabs; 