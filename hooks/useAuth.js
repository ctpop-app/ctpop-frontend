import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as authApi from '../api/auth';
import { isValidPhoneNumber, isValidOtpCode } from '../services/authService';
import useUserStore from '../store/userStore';
import { profileService } from '../services/profileService';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Zustand store 사용
  const userStore = useUserStore();
  const { user, isAuthenticated, hasProfile, setUser, setUserProfile, setHasProfile, clearUser } = userStore;

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
      return false;
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      setError('유효하지 않은 전화번호 형식입니다.');
      return false;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await authApi.sendOtp(phoneNumber);
      if (result.success) {
        setOtpSent(true);
        return true;
      } else {
        setError(result.message || '인증번호 전송에 실패했습니다.');
        return false;
      }
    } catch (error) {
      setError(error.message || '인증번호 전송 중 오류가 발생했습니다.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [phoneNumber]);

  // OTP 확인
  const handleVerifyOtp = useCallback(async () => {
    if (!verificationCode) {
      setError('인증번호를 입력해주세요.');
      return { success: false };
    }

    if (!isValidOtpCode(verificationCode)) {
      setError('유효하지 않은 인증번호 형식입니다.');
      return { success: false };
    }

    setIsLoading(true);
    setError(null);
    try {
      console.log('OTP 검증 시작');
      const result = await authApi.verifyOtp(phoneNumber, verificationCode);
      console.log('OTP 검증 결과:', result);
      
      if (result.success) {
        console.log('사용자 정보 가져오기 시작');
        const user = await authApi.getStoredUser();
        console.log('저장된 사용자 정보:', user);
        
        if (user) {
          console.log('사용자 정보 설정 시작');
          // 사용자 정보 설정
          setUser(user);
          console.log('사용자 정보 설정 완료');
          
          // Firestore에서 프로필 존재 여부 확인
          console.log('프로필 존재 여부 확인 시작');
          const hasProfile = await profileService.checkProfileExists(user.uuid);
          console.log('프로필 존재 여부:', hasProfile);
          setHasProfile(hasProfile);
          
          // 상태 확인
          console.log('현재 상태:', {
            isAuthenticated,
            hasProfile,
            user
          });
        } else {
          console.error('사용자 정보가 없습니다.');
        }
      } else {
        setError(result.message);
      }
      return result;
    } catch (error) {
      console.error('OTP 검증 에러:', error);
      setError(error.message);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, [phoneNumber, verificationCode, setUser, setHasProfile, isAuthenticated, hasProfile]);

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
          createdAt: new Date().toISOString()
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
      const result = await authApi.logout();
      console.log('authApi.logout 결과:', result);
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
    setIsLoading(true);
    setError(null);
    try {
      const isAuth = await authApi.isAuthenticated();
      return isAuth;
    } catch (error) {
      setError(error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // OTP 재전송
  const handleResendOtp = useCallback(() => {
    setVerificationCode('');
    setOtpSent(false);
  }, []);

  // 토큰 검증 및 갱신
  const validateAndRefreshToken = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await authApi.validateAndRefreshToken();
      if (!result.success && result.shouldLogout) {
        await handleLogout();
      }
      return result;
    } catch (error) {
      setError(error.message);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, [handleLogout]);

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
    authenticateWithRefreshToken,
    getAccessToken,
    handleLogout,
    checkAuth,
    handleResendOtp,
    validateAndRefreshToken
  };
}; 