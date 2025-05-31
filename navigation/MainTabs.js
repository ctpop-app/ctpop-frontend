import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { ROUTES, TAB_OPTIONS } from './constants';

// 메인 탭 화면들
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
  // 화면 컴포넌트 준비
  const screens = {
    [ROUTES.MAIN.HOME]: HomeScreen || (() => <TemporaryScreen name="홈" />),
    [ROUTES.MAIN.MESSAGES]: MessageScreen || (() => <TemporaryScreen name="메시지" />),
    [ROUTES.MAIN.SETTINGS]: SettingsScreen || (() => <TemporaryScreen name="설정" />)
  };

  return (
    <Tab.Navigator
      initialRouteName={ROUTES.MAIN.HOME}
      screenOptions={({ route }) => ({
        ...TAB_OPTIONS[route.name],
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      {Object.entries(screens).map(([name, component]) => (
        <Tab.Screen
          key={name}
          name={name}
          component={component}
        />
      ))}
    </Tab.Navigator>
  );
};

export default MainTabs; 