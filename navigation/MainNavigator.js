import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// 메인 탭 네비게이션
import MainTabs from './MainTabs';
// ProfileTestScreen 추가
import ProfileTestScreen from '../screens/ProfileTestScreen';

const Stack = createStackNavigator();

const MainNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      {/* 여기에 메인 탭 외의 화면들을 추가할 수 있습니다 (예: 상세 프로필, 채팅 창 등) */}
      <Stack.Screen name="ProfileTest" component={ProfileTestScreen} />
    </Stack.Navigator>
  );
};

export default MainNavigator;