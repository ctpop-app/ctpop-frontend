import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as authApi from '../api/auth';
import { profile } from '../api/profile';  // profile 객체를 직접 import
import { isValidPhoneNumber, isValidOtpCode, storeTokens, clearTokens } from '../services/authService';
import useUserStore from '../store/userStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_KEYS } from '../utils/constants';
import { jwtDecode } from 'jwt-decode';
import * as userService from '../services/userService';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Zustand store 사용
  const userStore = useUserStore();
  const user = userStore.user;
  const isAuthenticated = userStore.isAuthenticated;
  const hasProfile = userStore.hasProfile;
  const setUser = userStore.setUser;
  const setUserProfile = userStore.setUserProfile;
  const setHasProfile = userStore.setHasProfile;
  const clearUser = userStore.clearUser;

  // 인증 상태 객체
  const authState = {
    user,
    isAuthenticated,
    hasProfile
  };

  // 서버 연결 테스트
  const handleTestConnection = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await authApi.testConnection();
      if (result.success) {
        Alert.alert('성공', result.message);
      } else {
        Alert.alert('오류', result.message);
      }
      return result.success;
    } catch (error) {
      const message = error.message || '서버 연결에 실패했습니다.';
      Alert.alert('오류', message);
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // OTP 전송
  const handleSendOtp = useCallback(async () => {
    if (!phoneNumber) {
      Alert.alert('오류', '전화번호를 입력해주세요.');
      return false;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      if (!isValidPhoneNumber(phoneNumber)) {
        const message = '유효하지 않은 전화번호 형식입니다.';
        Alert.alert('오류', message);
        setError(message);
        return false;
      }

      const result = await authApi.sendOtp(phoneNumber);
      
      if (result.success) {
        setOtpSent(true);
        Alert.alert('성공', '인증번호가 전송되었습니다.');
        return true;
      } else {
        Alert.alert('오류', result.message || 'OTP 전송에 실패했습니다.');
        setError(result.message);
        return false;
      }
    } catch (error) {
      const message = error.message || 'OTP 전송 중 오류가 발생했습니다.';
      Alert.alert('오류', message);
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [phoneNumber]);

  // OTP 확인
  const handleVerifyOtp = useCallback(async () => {
    if (!phoneNumber || !verificationCode) {
      Alert.alert('오류', '전화번호와 인증번호를 모두 입력해주세요.');
      return false;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      if (!isValidPhoneNumber(phoneNumber)) {
        const message = '유효하지 않은 전화번호 형식입니다.';
        Alert.alert('오류', message);
        setError(message);
        return false;
      }

      if (!isValidOtpCode(verificationCode)) {
        const message = '유효하지 않은 인증번호 형식입니다.';
        Alert.alert('오류', message);
        setError(message);
        return false;
      }

      const result = await authApi.verifyOtp(phoneNumber, verificationCode);
      
      if (result.success) {
        // 토큰이 있으면 인증 성공으로 간주
        if (result.data.accessToken) {
          console.log('인증 성공 - 토큰 저장 시작');
          console.log('액세스 토큰:', result.data.accessToken ? '있음' : '없음');
          console.log('리프레시 토큰:', result.data.refreshToken ? '있음' : '없음');
          
          // 1. 토큰 저장
          const storeResult = await storeTokens(result.data.accessToken, result.data.refreshToken);
          console.log('토큰 저장 결과:', storeResult ? '성공' : '실패');
          
          // 저장된 토큰 확인
          const storedAccessToken = await AsyncStorage.getItem(AUTH_KEYS.ACCESS_TOKEN);
          const storedRefreshToken = await AsyncStorage.getItem(AUTH_KEYS.REFRESH_TOKEN);
          console.log('저장된 액세스 토큰:', storedAccessToken ? '있음' : '없음');
          console.log('저장된 리프레시 토큰:', storedRefreshToken ? '있음' : '없음');
          
          // 2. JWT 토큰에서 UUID 추출
          const decodedToken = jwtDecode(result.data.accessToken);
          
          // 3. 사용자 정보 생성 (UUID만 사용)
          const user = {
            uuid: decodedToken.uuid,
            createdAt: new Date().toISOString()
          };
          
          // 4. 사용자 정보 저장
          await authApi.storeUser(user);
          
          // 5. 서버에 인증 상태 확인
          const isAuth = await authApi.isAuthenticated();
          if (isAuth) {
            setUser(user);
            Alert.alert('성공', '인증되었습니다.');
            return true;
          } else {
            // 인증 실패 시 토큰 삭제
            await clearTokens();
            Alert.alert('오류', '인증 상태 확인에 실패했습니다.');
            return false;
          }
        }
      } else {
        Alert.alert('오류', result.message || 'OTP 확인에 실패했습니다.');
        setError(result.message);
        return false;
      }
    } catch (error) {
      const message = error.message || 'OTP 확인 중 오류가 발생했습니다.';
      Alert.alert('오류', message);
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [phoneNumber, verificationCode, setUser]);

  // 인증번호 재전송
  const handleResendOtp = useCallback(() => {
    setOtpSent(false);
    setVerificationCode('');
  }, []);

  // 로그아웃
  const handleLogout = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await authApi.logout();
      if (result.success) {
        await clearTokens();
        clearUser();
        return true;
      } else {
        Alert.alert('오류', result.message || '로그아웃에 실패했습니다.');
        setError(result.message);
        return false;
      }
    } catch (error) {
      const message = error.message || '로그아웃 중 오류가 발생했습니다.';
      Alert.alert('오류', message);
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [clearUser]);

  // 인증 상태 확인
  const checkAuth = useCallback(async () => {
    console.log('checkAuth 시작');
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. 토큰 확인
      const accessToken = await AsyncStorage.getItem(AUTH_KEYS.ACCESS_TOKEN);
      const refreshToken = await AsyncStorage.getItem(AUTH_KEYS.REFRESH_TOKEN);
      console.log('액세스 토큰 확인:', accessToken ? '있음' : '없음');
      console.log('리프레시 토큰 확인:', refreshToken ? '있음' : '없음');

      if (!accessToken || !refreshToken) {
        console.log('토큰이 없습니다.');
        return false;
      }

      // 2. 리프레시 토큰 만료 확인
      try {
        const decodedRefreshToken = jwtDecode(refreshToken);
        const currentTime = Date.now() / 1000;
        
        if (decodedRefreshToken.exp < currentTime) {
          console.log('리프레시 토큰이 만료되었습니다.');
          await clearTokens();  // 토큰 만료 시에만 토큰 삭제
          return false;
        }
        console.log('리프레시 토큰 유효함');
      } catch (decodeError) {
        console.error('리프레시 토큰 디코딩 오류:', decodeError);
        return false;
      }

      // 3. 액세스 토큰 만료 확인
      try {
        const decodedAccessToken = jwtDecode(accessToken);
        const currentTime = Date.now() / 1000;
        
        // 액세스 토큰이 만료되었을 때만 갱신 시도
        if (decodedAccessToken.exp < currentTime) {
          console.log('액세스 토큰이 만료되어 갱신을 시도합니다.');
          const tokenRefreshResult = await authApi.refreshToken(refreshToken);
          
          if (!tokenRefreshResult.success) {
            console.log('토큰 리프레시 실패');
            return false;
          }
          
          // 새로운 토큰 저장
          if (tokenRefreshResult.data.accessToken) {
            await AsyncStorage.setItem(AUTH_KEYS.ACCESS_TOKEN, tokenRefreshResult.data.accessToken);
            // 리프레시 토큰은 새로운 것이 있을 때만 업데이트
            if (tokenRefreshResult.data.refreshToken) {
              await AsyncStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, tokenRefreshResult.data.refreshToken);
            }
            console.log('토큰 리프레시 성공');
          }
        } else {
          console.log('액세스 토큰이 유효합니다.');
        }
      } catch (error) {
        console.log('액세스 토큰 확인 중 오류:', error);
        return false;
      }

      // 4. 사용자 정보 확인
      const user = await AsyncStorage.getItem(AUTH_KEYS.USER);
      console.log('사용자 정보 확인:', user ? '있음' : '없음');
      if (user) {
        const parsedUser = JSON.parse(user);
        setUser(parsedUser);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('인증 확인 중 오류:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [setUser, clearTokens]);

  return {
    isLoading,
    error,
    phoneNumber,
    setPhoneNumber,
    verificationCode,
    setVerificationCode,
    otpSent,
    setOtpSent,
    handleSendOtp,
    handleVerifyOtp,
    handleResendOtp,
    handleLogout,
    checkAuth,
    authState,
    handleTestConnection,
    setUser,
    storeTokens,
    clearTokens
  };
}; 