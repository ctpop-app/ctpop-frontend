// App.js
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { StatusBar, View, Text, StyleSheet } from 'react-native';
import 'react-native-gesture-handler';

// State management
import useUserStore from './store/userStore';

// Auth service
import * as authApi from './api/auth';
import { profileService } from './services/profileService';

// 디스커버리 서비스와 설정
import { discoverServer } from './utils/discovery';
import { updateApiUrl } from './utils/config';

// 네비게이션 컴포넌트들
import JwtPhoneLoginScreen from './screens/JwtPhoneLoginScreen';
import ProfileSetupScreen from './screens/ProfileSetupScreen';
import MainNavigator from './navigation/MainNavigator';
import SplashScreen from './screens/SplashScreen';
import AuthNavigator from './navigation/AuthNavigator';
import { ROUTES } from './navigation/constants';

const Stack = createStackNavigator();

// 에러 화면 컴포넌트
const ErrorScreen = ({ error }) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorTitle}>초기화 오류</Text>
    <Text style={styles.errorMessage}>{error}</Text>
    <Text style={styles.errorHint}>앱을 다시 시작하거나 네트워크 연결을 확인해주세요.</Text>
  </View>
);

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const { user, setUser } = useUserStore();
  const [hasProfile, setHasProfile] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [serverDiscovered, setServerDiscovered] = useState(false);

  // 서버 디스커버리 및 초기화
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('서버 디스커버리 실행 중...');
        // 서버 디스커버리 실행
        const apiUrl = await discoverServer();
        
        if (apiUrl) {
          // 발견된 서버로 API URL 업데이트
          updateApiUrl(apiUrl);
          setServerDiscovered(true);
          console.log('서버 디스커버리 성공:', apiUrl);
        } else {
          console.warn('서버를 찾을 수 없음. 기본 설정 사용.');
        }
        
        // 인증 상태 확인 진행
        checkAuthentication();
      } catch (err) {
        console.error('앱 초기화 오류:', err);
        setError('앱 초기화 중 오류가 발생했습니다.');
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // 인증 상태 확인
  const checkAuthentication = async () => {
    try {
      console.log('인증 상태 확인 중...');
      
      // 인증 확인 및 토큰 갱신 시도
      const authenticated = await authApi.isAuthenticated();
      
      if (authenticated) {
        console.log('인증된 사용자 발견');
        
        try {
          // 토큰 정보 가져오기
          const { phoneNumber } = await authApi.getAuthInfo();
          
          // 토큰 갱신 시도
          const newToken = await authApi.refreshToken();
          
          if (newToken) {
            // Firestore에서 프로필 확인
            const profileCheck = await profileService.checkProfileExists(phoneNumber);
            
            if (profileCheck.success) {
              if (profileCheck.exists) {
                // 프로필이 존재하면 Main으로 이동
                console.log('기존 프로필이 있어 메인 화면으로 이동합니다.');
                setUser({ uid: phoneNumber, phoneNumber });
                setIsLoggedIn(true);
                setHasProfile(true);
                
                // 프로필 데이터 저장
                useUserStore.getState().updateUserProfile(phoneNumber, profileCheck.data);
              } else {
                // 프로필이 없으면 로그아웃 처리
                console.log('프로필이 없어 로그아웃 처리합니다.');
                await handleLogout();
              }
            } else {
              // 프로필 확인 실패 시 로그아웃 처리
              console.error('프로필 확인 중 오류:', profileCheck.error);
              await handleLogout();
            }
          } else {
            // 토큰 갱신 실패 - 로그아웃 처리
            await handleLogout();
          }
        } catch (error) {
          console.error('인증 정보 처리 중 오류:', error);
          await handleLogout();
        }
      } else {
        console.log('인증되지 않은 사용자');
        await handleLogout();
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('인증 확인 오류:', error);
      await handleLogout();
    } finally {
      setIsLoading(false);
    }
  };

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      // 로그아웃 처리
      await authApi.logout();
      
      // 사용자 상태 초기화
      setUser(null);
      setIsLoggedIn(false);
      setHasProfile(false);
      
      console.log('로그아웃 처리 완료');
    } catch (error) {
      console.error('로그아웃 처리 중 오류:', error);
      // 에러가 발생하더라도 로컬 상태는 초기화
      setUser(null);
      setIsLoggedIn(false);
      setHasProfile(false);
    }
  };

  // 오류 발생 시 표시할 화면
  if (error) {
    return <ErrorScreen error={error} />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoading ? (
          <Stack.Screen name={ROUTES.SPLASH} component={SplashScreen} />
        ) : user && isLoggedIn ? (
          <Stack.Screen name={ROUTES.MAIN.STACK} component={MainNavigator} />
        ) : (
          <Stack.Screen name={ROUTES.AUTH.LOGIN} component={AuthNavigator} />
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
  },
}); 