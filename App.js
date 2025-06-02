// App.js
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
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
import { refreshAccessToken } from './services/authService';
import { AUTH_KEYS } from './utils/constants';

const Stack = createStackNavigator();

// 경고 메시지 무시 설정
LogBox.ignoreLogs([
  'Sending `onAnimatedValueUpdate` with no listeners registered',
  'Non-serializable values were found in the navigation state',
]);

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

export default function App() {
  // 상태 관리
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { authState, checkAuth } = useAuth();
  const { setUser, checkProfileStatus, clearUser, hasProfile } = useUserStore();

  // 앱 초기화
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('=== 앱 초기화 시작 ===');
        setIsLoading(true);
        
        // 1. 서버 설정 초기화
        console.log('1. 서버 설정 초기화');
        await initializeConfig();
        
        // 2. 서버 디스커버리
        console.log('2. 서버 디스커버리');
        const apiUrl = await discoverServer();
        if (apiUrl) {
          console.log('서버 URL:', apiUrl);
          updateApiUrl(apiUrl);
        }
        
        // 3. 인증 상태 확인
        console.log('3. 인증 상태 확인');
        const isAuthenticated = await checkAuth();
        console.log('인증 상태 확인 결과:', isAuthenticated);
        console.log('현재 authState:', authState);

        if (isAuthenticated && authState.user) {
          // 4. 프로필 상태 확인
          console.log('4. 프로필 상태 확인');
          const hasProfile = await checkProfileStatus(authState.user.uuid);
          console.log('프로필 상태:', hasProfile);
        } else {
          clearUser();
        }

        // 5. 토큰 갱신 시도
        const accessToken = await AsyncStorage.getItem(AUTH_KEYS.ACCESS_TOKEN);
        if (accessToken) {
          const result = await refreshAccessToken();
          if (result.success) {
            console.log('토큰 갱신 성공');
          }
        }
      } catch (err) {
        console.error('앱 초기화 실패:', err);
        setError(err.message || '앱 초기화 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [checkAuth, authState, checkProfileStatus, clearUser]);

  // 재시도 핸들러
  const handleRetry = () => {
    console.log('재시도 요청');
    setError(null);
  };

  // 화면 선택 로직
  let currentScreen = null;

  if (error) {
    currentScreen = (
      <Stack.Screen name={ROUTES.ERROR} options={{ headerShown: false }}>
        {() => <ErrorScreen error={error} onRetry={handleRetry} />}
      </Stack.Screen>
    );
  } else if (isLoading) {
    currentScreen = (
      <Stack.Screen name={ROUTES.SPLASH} options={{ headerShown: false }}>
        {() => <SplashScreen />}
      </Stack.Screen>
    );
  } else if (authState.isAuthenticated && hasProfile) {
    // 인증됨 + 프로필 있음 -> 메인 화면
    currentScreen = (
      <Stack.Screen name={ROUTES.MAIN.STACK} options={{ headerShown: false }}>
        {() => <MainNavigator />}
      </Stack.Screen>
    );
  } else {
    // 인증 안됨 또는 프로필 없음 -> 로그인 화면
    currentScreen = (
      <Stack.Screen name="AuthFlow" options={{ headerShown: false }}>
        {() => <AuthNavigator />}
      </Stack.Screen>
    );
  }

  console.log('=== 렌더링 상태 ===');
  console.log('isLoading:', isLoading);
  console.log('error:', error);
  console.log('authState:', authState);
  console.log('hasProfile:', hasProfile);
  console.log('선택된 화면:', currentScreen?.props?.name);

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
          cardStyle: { backgroundColor: COLORS.background.primary }
        }}
      >
        {currentScreen}
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