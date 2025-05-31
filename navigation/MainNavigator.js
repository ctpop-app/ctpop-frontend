import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ROUTES, HEADER_OPTIONS } from './constants';

// 메인 관련 화면들
import MainTabs from './MainTabs';
import ProfileTestScreen from '../screens/ProfileTestScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';

const Stack = createStackNavigator();

const MainNavigator = () => {
  return (
    <Stack.Navigator 
      initialRouteName={ROUTES.MAIN.STACK}
      screenOptions={HEADER_OPTIONS.MAIN}
    >
      <Stack.Screen 
        name={ROUTES.MAIN.STACK} 
        component={MainTabs}
        options={{ title: '홈' }}
      />
      <Stack.Screen 
        name={ROUTES.MAIN.PROFILE_TEST} 
        component={ProfileTestScreen}
        options={{ title: '프로필 테스트' }}
      />
      <Stack.Screen 
        name={ROUTES.AUTH.PROFILE_SETUP} 
        component={ProfileSetupScreen}
        options={{ title: '프로필 설정' }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;