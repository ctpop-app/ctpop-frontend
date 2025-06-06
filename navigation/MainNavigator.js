import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ROUTES, HEADER_OPTIONS } from './constants';

// 메인 관련 화면들
import MainTabs from './MainTabs';
import ProfileTestScreen from '../screens/ProfileTestScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';

const Stack = createStackNavigator();

const MainNavigator = () => {
  return (
    <Stack.Navigator 
      initialRouteName={ROUTES.MAIN.MAIN_TABS}
      screenOptions={HEADER_OPTIONS.MAIN}
    >
      <Stack.Screen 
        name={ROUTES.MAIN.MAIN_TABS} 
        component={MainTabs}
        options={{ title: '홈' }}
      />
      <Stack.Screen 
        name={ROUTES.MAIN.PROFILE_TEST} 
        component={ProfileTestScreen}
        options={{ title: '프로필 테스트' }}
      />
      <Stack.Screen 
        name={ROUTES.MAIN.PROFILE_EDIT} 
        component={ProfileEditScreen}
        options={{ title: '프로필 수정' }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;