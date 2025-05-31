import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ROUTES, HEADER_OPTIONS } from './constants';

// 인증 관련 화면들
import JwtPhoneLoginScreen from '../screens/JwtPhoneLoginScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';

const Stack = createStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator 
      initialRouteName={ROUTES.AUTH.LOGIN}
      screenOptions={HEADER_OPTIONS.AUTH}
    >
      <Stack.Screen 
        name={ROUTES.AUTH.LOGIN} 
        component={JwtPhoneLoginScreen}
        options={{ title: '로그인' }}
      />
      <Stack.Screen 
        name={ROUTES.AUTH.PROFILE_SETUP} 
        component={ProfileSetupScreen}
        options={{ title: '프로필 설정' }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator; 