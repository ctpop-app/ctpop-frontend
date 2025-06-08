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

// 서버 설정
import { discoverServer } from './utils/discovery';
import { updateApiUrl, initializeConfig } from './utils/config';

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

const Stack = createStackNavigator();

// 에러 화면 컴포넌트
const ErrorScreen = ({ error, onRetry }) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorTitle}>초기화 오류</Text>
    <Text style={styles.errorMessage}>{error}</Text>
    <Text style={styles.errorHint}>앱을 다시 시작하거나 네트워크 연결을 확인해주세요.</Text>
    {onRetry && (
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryButtonText}>다시 시도</Text>
      </TouchableOpacity>
    )}
  </View>
);

// 앱 초기화 함수
const initializeApp = async (setIsLoading, setError, checkAuth, clearTokens, clearUser) => {
  try {
    console.log('앱 초기화 시작');
    setIsLoading(true);
    
    // 1. 서버 설정 초기화
    console.log('서버 설정 초기화 시작');
    await initializeConfig();
    console.log('서버 설정 초기화 완료');
    
    // 2. 서버 디스커버리
    console.log('서버 디스커버리 시작');
    const apiUrl = await discoverServer();
    if (!apiUrl) {
      throw new Error('서버를 찾을 수 없습니다.');
    }
    updateApiUrl(apiUrl);
    console.log('서버 디스커버리 완료:', apiUrl);
    
    // 3. 인증 상태 확인
    console.log('인증 상태 확인 시작');
    const isAuth = await checkAuth();
    if (!isAuth) {
      console.log('인증 실패, 사용자 정보 및 토큰 삭제');
      await clearUser();
      await clearTokens();
    }
    console.log('인증 상태 확인 완료:', isAuth);

  } catch (err) {
    console.error('앱 초기화 실패:', err);
    setError(err.message || '앱 초기화 중 오류가 발생했습니다.');
    await clearUser();
    await clearTokens();
  } finally {
    setIsLoading(false);
  }
};

const checkInitialAuth = async () => {
  try {
    const result = await authApi.validateAndRefreshToken();
    
    if (result.success) {
      // 토큰이 유효하고 갱신된 경우
      const user = await authApi.getStoredUser();
      if (user) {
        setUser(user);
      }
    } else if (result.shouldLogout) {
      // 토큰이 유효하지 않거나 만료된 경우
      await authApi.logout();
      clearUser();
    }
  } catch (error) {
    console.error('초기 인증 확인 실패:', error);
    // 에러 발생 시 로그아웃 처리
    await authApi.logout();
    clearUser();
  }
};

export default function App() {
  // 상태 관리
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { checkAuth } = useAuth();
  
  // Zustand store 사용
  const userStore = useUserStore();
  const isAuthenticated = userStore.isAuthenticated;
  const hasProfile = userStore.hasProfile;
  const clearUser = userStore.clearUser;

  // 앱 초기화
  useEffect(() => {
    const init = async () => {
      try {
        await initializeApp(setIsLoading, setError, checkAuth, clearTokens, clearUser);
      } catch (err) {
        console.error('앱 초기화 실패:', err);
        setError(err.message || '앱 초기화 중 오류가 발생했습니다.');
        setIsLoading(false);
      }
    };
    
    init();
  }, []);

  // 재시도 핸들러
  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    initializeApp(setIsLoading, setError, checkAuth, clearTokens, clearUser);
  }, [checkAuth, clearTokens, clearUser]);

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