import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import * as authApi from '../api/auth';
import { isValidOtpCode } from '../services/authService';
import { isValidPhoneNumber } from '../utils/phoneUtils';
import useUserStore from '../store/userStore';
import { profileService } from '../services/profileService';
import { getCurrentKST } from '../utils/dateUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_KEYS } from '../utils/constants';
import * as authService from '../services/authService';
import { useProfile } from './useProfile';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Zustand store 사용
  const { user, isAuthenticated, hasProfile, setUser, setUserProfile, setHasProfile, clearUser, userProfile } = useUserStore();
  const { exists: checkProfileExists, get: loadUserProfile } = useProfile();

  // 슈퍼패스 인증 (개발용)
  const handleSuperPass = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.getSuperPassToken();
      console.log('슈퍼패스 응답:', response);
      if (response.refreshToken) {
        // 리프레시 토큰 저장
        await authApi.storeTokens(null, response.refreshToken);
        
        const user = {
          uuid: response.uuid,
          createdAt: getCurrentKST(),
          hasProfile: false
        };
        await authApi.storeUser(user);
        setUser(user);
        Alert.alert('성공', '슈퍼패스 인증이 완료되었습니다.');
        return { success: true };
      } else {
        const errorMessage = '슈퍼패스 인증에 실패했습니다.';
        setError(errorMessage);
        Alert.alert('오류', errorMessage);
        return { success: false };
      }
    } catch (error) {
      console.error('슈퍼패스 에러:', error);
      const errorMessage = '슈퍼패스 인증에 실패했습니다.';
      setError(errorMessage);
      Alert.alert('오류', errorMessage);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  // 서버 연결 테스트
  const handleTestConnection = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await authApi.testConnection();
      if (result.success) {
        Alert.alert('성공', '서버 연결이 성공적으로 이루어졌습니다.');
      } else {
        Alert.alert('실패', result.message || '서버 연결에 실패했습니다.');
        setError(result.message || result.error);
      }
      return result.success;
    } catch (error) {
      const errorMessage = error.message || '서버 연결 중 오류가 발생했습니다.';
      Alert.alert('오류', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // OTP 전송
  const handleSendOtp = useCallback(async () => {
    if (!phoneNumber) {
      setError('전화번호를 입력해주세요.');
      Alert.alert('오류', '전화번호를 입력해주세요.');
      return false;
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      setError('유효하지 않은 전화번호 형식입니다.');
      Alert.alert('오류', '유효하지 않은 전화번호 형식입니다.');
      return false;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await authService.sendOtp(phoneNumber);
      if (result.success) {
        setOtpSent(true);
        Alert.alert('성공', '인증번호가 전송되었습니다.');
        return true;
      } else {
        const errorMessage = result.message || '인증번호 전송에 실패했습니다.';
        setError(errorMessage);
        Alert.alert('오류', errorMessage);
        return false;
      }
    } catch (error) {
      console.error('OTP 전송 에러:', error);
      const errorMessage = error.message || '인증번호 전송 중 오류가 발생했습니다.';
      setError(errorMessage);
      Alert.alert('오류', errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [phoneNumber]);

  // OTP 확인
  const handleVerifyOtp = useCallback(async () => {
    if (!verificationCode) {
      setError('인증번호를 입력해주세요.');
      Alert.alert('오류', '인증번호를 입력해주세요.');
      return { success: false };
    }

    try {
      setError(null);
      const result = await authService.verifyOtp(phoneNumber, verificationCode);
      
      if (result.success) {
        const user = await authService.getStoredUser();
        setUser(user);
        Alert.alert('성공', '인증되었습니다.');
        return { success: true };
      } else {
        const errorMessage = result.message || '인증에 실패했습니다.';
        setError(errorMessage);
        Alert.alert('오류', errorMessage);
        return { success: false };
      }
    } catch (error) {
      console.error('OTP 검증 에러:', error);
      const errorMessage = '인증 중 오류가 발생했습니다.';
      setError(errorMessage);
      Alert.alert('오류', errorMessage);
      return { success: false };
    }
  }, [phoneNumber, verificationCode]);

  // 리프레시 토큰으로 인증
  const authenticateWithRefreshToken = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await authApi.authenticateWithRefreshToken();
      if (result.success) {
        // 사용자 정보 업데이트
        const user = {
          uuid: result.data.uuid,
          createdAt: user?.createdAt || getCurrentKST()
        };
        setUser(user);
      } else {
        setError(result.message);
      }
      return result;
    } catch (error) {
      setError(error.message);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  // 액세스 토큰 발급
  const getAccessToken = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await authApi.getAccessToken();
      if (!result.success) {
        setError(result.message);
      }
      return result;
    } catch (error) {
      setError(error.message);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 로그아웃
  const handleLogout = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('handleLogout 시작');
      const result = await authService.logout();
      console.log('authService.logout 결과:', result);
      if (result.success) {
        console.log('clearUser 호출 전');
        clearUser();
        console.log('clearUser 호출 후');
        setPhoneNumber('');
        setVerificationCode('');
        setOtpSent(false);
      } else {
        setError(result.message);
      }
      return result.success;
    } catch (error) {
      console.error('handleLogout 에러:', error);
      setError(error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [clearUser]);

  // 인증 상태 확인
  const checkAuth = useCallback(async () => {
    try {
      const isAuth = await authService.isAuthenticated();
      if (!isAuth) {
        clearUser();
        return false;
      }

      const user = await authService.getStoredUser();
      if (!user) {
        clearUser();
        return false;
      }

      // 🚨 서버 검증
      let serverValidation = await authService.validateAndRefreshToken();
      
      if (!serverValidation.success) {
        console.log('서버 검증 실패, 잠시 후 재시도...');
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 4000));
        
        // 1회 재시도
        serverValidation = await authService.validateAndRefreshToken();
        
        if (!serverValidation.success) {
          console.log('서버 검증 최종 실패, 오류 화면 표시');
          await authService.clearTokens(); // 토큰만 삭제
          throw new Error('서버 연결에 실패했습니다. 네트워크 연결을 확인해주세요.');
        }
      }

      setUser(user);
      const hasProfile = await checkProfileExists();
      setHasProfile(hasProfile);
      return true;
    } catch (error) {
      console.error('인증 상태 확인 실패:', error);
      throw error; // App.js에서 ErrorScreen으로 처리
    }
  }, [setUser, setHasProfile, clearUser, checkProfileExists]);

  // OTP 재전송
  const handleResendOtp = useCallback(() => {
    setVerificationCode('');
    setOtpSent(false);
  }, []);

  // 프로필 수정
  const handleEditProfile = useCallback(() => {
    if (!userProfile) {
      Alert.alert('오류', '프로필 정보를 불러올 수 없습니다.');
      return null;
    }

    if (!userProfile.uuid) {
      console.error('Invalid userProfile: missing uuid field', userProfile);
      Alert.alert('오류', '프로필 정보가 올바르지 않습니다.');
      return null;
    }

    // createdAt은 수정하지 않고 원래 값 유지
    return {
      ...userProfile,
      updatedAt: getCurrentKST()
    };
  }, [userProfile]);

  useEffect(() => {
    if (isAuthenticated && !hasProfile) {
      checkProfileExists();
    }
  }, [isAuthenticated, hasProfile, checkProfileExists]);

  return {
    isLoading,
    error,
    phoneNumber,
    setPhoneNumber,
    verificationCode,
    setVerificationCode,
    otpSent,
    setOtpSent,
    user,
    isAuthenticated,
    hasProfile,
    handleTestConnection,
    handleSendOtp,
    handleVerifyOtp,
    handleSuperPass,
    authenticateWithRefreshToken,
    getAccessToken,
    handleLogout,
    checkAuth,
    handleResendOtp,
    loadUserProfile,
    handleEditProfile,
    clearUser
  };
}; 