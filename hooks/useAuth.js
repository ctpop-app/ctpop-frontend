import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as authApi from '../api/auth';
import { profile } from '../api/profile';  // profile 객체를 직접 import
import { isValidPhoneNumber, isValidOtpCode, storeTokens, clearTokens } from '../services/authService';
import useUserStore from '../store/userStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_KEYS } from '../utils/constants';

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
          // 1. 토큰 저장
          await storeTokens(result.data.accessToken, result.data.refreshToken);
          
          // 2. 사용자 정보 생성
          const user = {
            phone: phoneNumber,
            uuid: result.data.uuid,
            createdAt: new Date().toISOString()
          };
          
          // 3. 사용자 정보 저장
          await authApi.storeUser(user);
          
          // 4. 서버에 인증 상태 확인
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
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. 토큰 확인
      const accessToken = await AsyncStorage.getItem(AUTH_KEYS.ACCESS_TOKEN);
      if (!accessToken) {
        console.log('액세스 토큰이 없습니다.');
        return false;
      }

      // 2. 서버에 인증 상태 확인
      const isAuth = await authApi.isAuthenticated();
      if (!isAuth) {
        console.log('서버 인증 실패');
        await clearTokens();
        clearUser();
        return false;
      }

      // 3. 사용자 정보 확인
      const user = await AsyncStorage.getItem(AUTH_KEYS.USER);
      if (user) {
        const parsedUser = JSON.parse(user);
        setUser(parsedUser);

        // 4. 프로필 정보 확인
        try {
          console.log('프로필 확인 시작 - UUID:', parsedUser.uuid);
          const profileResult = await profile.getProfile(parsedUser.uuid);
          console.log('프로필 확인 결과:', profileResult);
          
          if (profileResult.success) {
            setUserProfile(profileResult.data);
            console.log('프로필 정보 로드 완료:', profileResult.data);
          } else {
            console.log('프로필이 없습니다:', profileResult.error);
            setUserProfile(null);
          }
        } catch (error) {
          console.log('프로필 정보 확인 실패:', error);
          setUserProfile(null);
        }
      }

      return true;
    } catch (error) {
      console.error('인증 상태 확인 오류:', error);
      await clearTokens();
      clearUser();
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [setUser, setUserProfile, clearUser]);

  return {
    isLoading,
    error,
    phoneNumber,
    setPhoneNumber,
    verificationCode,
    setVerificationCode,
    otpSent,
    handleSendOtp,
    handleVerifyOtp,
    handleResendOtp,
    handleLogout,
    checkAuth,
    authState,
    handleTestConnection
  };
}; 