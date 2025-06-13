import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ROUTES, HEADER_OPTIONS } from './constants';

// 메인 관련 화면들
import MainTabs from './MainTabs';
import ProfileTestScreen from '../screens/ProfileTestScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';
import ProfileDetailScreen from '../screens/ProfileDetailScreen';
import BoardWriteScreen from '../screens/BoardWriteScreen';
import BoardScreen from '../screens/BoardScreen';
import BlockedListScreen from '../screens/BlockedListScreen';

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
      <Stack.Screen 
        name="ProfileDetail" 
        component={ProfileDetailScreen}
        options={{ 
          title: '프로필',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#fff',
            elevation: 0,
            shadowOpacity: 0
          }
        }}
      />
      <Stack.Screen 
        name="BoardWrite" 
        component={BoardWriteScreen}
        options={{ 
          title: '토크 작성',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#fff',
            elevation: 0,
            shadowOpacity: 0
          }
        }}
      />
      <Stack.Screen 
        name={ROUTES.MAIN.BOARD} 
        component={BoardScreen}
        options={{ 
          title: '토크',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#fff',
            elevation: 0,
            shadowOpacity: 0
          }
        }}
      />
      <Stack.Screen 
        name="BlockedList" 
        component={BlockedListScreen}
        options={{ 
          title: '차단 목록',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#fff',
            elevation: 0,
            shadowOpacity: 0
          }
        }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;