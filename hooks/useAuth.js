import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as authApi from '../api/auth';
import { isValidPhoneNumber, isValidOtpCode } from '../services/authService';
import useUserStore from '../store/userStore';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    hasProfile: false,
    phoneNumber: null
  });

  const { setUser: setUserStore } = useUserStore();

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
      // 전화번호 유효성 검사
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
      // 전화번호와 인증번호 유효성 검사
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
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: true,
          phoneNumber: phoneNumber
        }));
        if (result.data.user) {
          setUser(result.data.user);
          await authApi.storeUser(result.data.user);
          setUserStore(result.data.user);
        }
        return true;
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
  }, [phoneNumber, verificationCode, setUserStore]);

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
        setUser(null);
        setAuthState({
          isAuthenticated: false,
          hasProfile: false,
          phoneNumber: null
        });
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
  }, []);

  // 인증 상태 확인
  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const isAuth = await authApi.isAuthenticated();
      
      if (isAuth) {
        const storedUser = await authApi.getStoredUser();
        if (storedUser) {
          setUser(storedUser);
          setAuthState(prev => ({
            ...prev,
            isAuthenticated: true,
            hasProfile: storedUser.hasProfile || false,
            phoneNumber: storedUser.phoneNumber
          }));
        }
      } else {
        // 인증되지 않은 경우 상태 초기화
        setAuthState({
          isAuthenticated: false,
          hasProfile: false,
          phoneNumber: null
        });
      }
      
      return isAuth;
    } catch (error) {
      const message = error.message || '인증 상태 확인 중 오류가 발생했습니다.';
      setError(message);
      // 에러 발생 시 상태 초기화
      setAuthState({
        isAuthenticated: false,
        hasProfile: false,
        phoneNumber: null
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    user,
    authState,
    phoneNumber,
    setPhoneNumber,
    verificationCode,
    setVerificationCode,
    otpSent,
    handleTestConnection,
    handleSendOtp,
    handleVerifyOtp,
    handleResendOtp,
    handleLogout,
    checkAuth
  };
}; 