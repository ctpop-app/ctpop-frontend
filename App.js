// App.js
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar, View, Text, StyleSheet, LogBox, TouchableOpacity } from 'react-native';
import 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';

// State management
import useUserStore from './store/userStore';
import { useAuth } from './hooks/useAuth';
import { useSocket } from './hooks/useSocket';

// 서버 설정
import { discoverServer } from './utils/discovery';
import { updateApiUrl, initializeConfig, testServerConnection } from './utils/config';

// 네비게이션
import MainNavigator from './navigation/MainNavigator';
import AuthNavigator from './navigation/AuthNavigator';
import SplashScreen from './screens/SplashScreen';
import ProfileSetupScreen from './screens/ProfileSetupScreen';
import { ROUTES, HEADER_OPTIONS } from './navigation/constants';

// 전역 스타일
import { COLORS } from './components/profile-setup/constants';
import { refreshAccessToken, isRefreshTokenExpired, clearTokens } from './services/authService';
import { AUTH_KEYS } from './utils/constants';
import ErrorScreen from './components/ErrorScreen';

const Stack = createStackNavigator();

// 앱 초기화 함수
const initializeApp = async (setIsLoading, setError, checkAuth, clearTokens, connect) => {
  try {
    console.log('앱 초기화 시작');
    setIsLoading(true);
    
    // 1. 서버 설정 초기화
    console.log('서버 설정 초기화 시작');
    await initializeConfig();
    console.log('서버 설정 초기화 완료');
    
    // 2. 서버 연결 테스트 (현재 설정된 URL 사용)
    console.log('서버 연결 테스트 시작');
    const isServerAvailable = await testServerConnection();
    if (!isServerAvailable) {
      throw new Error('서버에 연결할 수 없습니다.');
    }
    console.log('서버 연결 테스트 완료');
    
    // 3. 인증 상태 확인
    console.log('인증 상태 확인 시작');
    const isAuth = await checkAuth();
    if (!isAuth) {
      console.log('인증 실패, 토큰만 삭제');
      await clearTokens();
    }
    console.log('인증 상태 확인 완료:', isAuth); 

    // 4. 소켓 연결
    if (isAuth) {
      console.log('소켓 연결 시작');
      connect();
      console.log('소켓 연결 완료');
    }

  } catch (err) {
    console.error('앱 초기화 실패:', err);
    setError(err.message || '앱 초기화 중 오류가 발생했습니다.');
  } finally {
    setIsLoading(false);
  }
};

export default function App() {
  // 상태 관리
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { checkAuth } = useAuth();
  const { connect, disconnect } = useSocket();
  
  // Zustand store 사용
  const userStore = useUserStore();
  const isAuthenticated = userStore.isAuthenticated;
  const hasProfile = userStore.hasProfile;

  // 앱 초기화
  useEffect(() => {
    const init = async () => {
      try {
        await initializeApp(setIsLoading, setError, checkAuth, clearTokens, connect);
      } catch (err) {
        console.error('앱 초기화 실패:', err);
        setError(err.message || '앱 초기화 중 오류가 발생했습니다.');
        setIsLoading(false);
      }
    };
    
    init();
  }, []);

  // 앱 종료 시 소켓 연결 해제
  useEffect(() => {
    return () => {
      if (isAuthenticated) {
        disconnect();
      }
    };
  }, [isAuthenticated, disconnect]);

  // 재시도 핸들러
  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    initializeApp(setIsLoading, setError, checkAuth, clearTokens, connect);
  }, [checkAuth, clearTokens, connect]);

  // 디버그 로그
  console.log('=== 렌더링 상태 ===');
  console.log('isLoading:', isLoading);
  console.log('error:', error);
  console.log('isAuthenticated:', isAuthenticated);
  console.log('hasProfile:', hasProfile);

  return (
    <NavigationContainer>
      <StatusBar 
        style="auto" 
        backgroundColor={COLORS.background.primary}
        barStyle="dark-content"
      />
      <Stack.Navigator 
        screenOptions={{
          ...HEADER_OPTIONS.MAIN,
          cardStyle: { backgroundColor: COLORS.background.primary },
          animationEnabled: true,
          gestureEnabled: false
        }}
      >
        {error ? (
          <Stack.Screen 
            name={ROUTES.ERROR} 
            options={{ 
              headerShown: false,
              animationEnabled: false
            }}
          >
            {() => <ErrorScreen error={error} onRetry={handleRetry} />}
          </Stack.Screen>
        ) : isLoading ? (
          <Stack.Screen 
            name={ROUTES.SPLASH} 
            options={{ 
              headerShown: false,
              animationEnabled: false
            }}
          >
            {() => <SplashScreen />}
          </Stack.Screen>
        ) : !isAuthenticated ? (
          <Stack.Screen name={ROUTES.ROOT.AUTH}>
            {() => <AuthNavigator />}
          </Stack.Screen>
        ) : !hasProfile ? (
          <Stack.Screen name={ROUTES.AUTH.PROFILE_SETUP}>
            {() => <ProfileSetupScreen />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name={ROUTES.ROOT.MAIN}>
            {() => <MainNavigator />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorHint: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 