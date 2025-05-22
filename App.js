// App.js
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { StatusBar, View, Text, StyleSheet, Alert } from 'react-native';
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

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const { setUser, fetchUserProfile } = useUserStore();
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
        
        // 토큰 정보 가져오기
        const { phoneNumber } = await authApi.getAuthInfo();
        
        // 토큰 갱신 시도
        const newToken = await authApi.refreshToken();
        
        if (newToken) {
          // 사용자 정보 설정
          setUser({ uid: phoneNumber, phoneNumber });
          setIsLoggedIn(true);
          
          // Firestore에서 프로필 확인
          const profileCheck = await profileService.checkProfileExists(phoneNumber);
          
          if (profileCheck.success) {
            if (profileCheck.exists) {
              // 프로필이 존재하면 Main으로 이동
              console.log('기존 프로필이 있어 메인 화면으로 이동합니다.');
              setHasProfile(true);
              
              // 프로필 데이터 저장
              useUserStore.getState().updateUserProfile(phoneNumber, profileCheck.data);
            } else {
              // 프로필이 없으면 프로필 설정 필요
              console.log('프로필이 없어 프로필 설정이 필요합니다.');
              setHasProfile(false);
            }
          } else {
            // 프로필 확인 실패 시 기본적으로 프로필 설정 화면으로 이동
            console.error('프로필 확인 중 오류:', profileCheck.error);
            setHasProfile(false);
          }
        } else {
          // 토큰 갱신 실패 - 로그아웃 상태로 처리
          setIsLoggedIn(false);
        }
      } else {
        console.log('인증되지 않은 사용자');
        setIsLoggedIn(false);
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('인증 확인 오류:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 오류 발생 시 표시할 화면
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>초기화 오류</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Text style={styles.errorHint}>앱을 다시 시작하거나 네트워크 연결을 확인해주세요.</Text>
      </View>
    );
  }

  // 로딩 중인 경우
  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          hasProfile ? (
            <Stack.Screen name="Main" component={MainNavigator} />
          ) : (
            <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
          )
        ) : (
          <Stack.Screen name="Login" component={JwtPhoneLoginScreen} />
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 15,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorHint: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
}); 