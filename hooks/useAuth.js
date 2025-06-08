import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as authApi from '../api/auth';
import { isValidPhoneNumber, isValidOtpCode } from '../services/authService';
import useUserStore from '../store/userStore';
import { profileService } from '../services/profileService';
import { userService } from '../services/userService';
import { formatDate } from '../utils/dateUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_KEYS } from '../utils/constants';
import * as authService from '../services/authService';

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
      const result = await authService.sendOtp(phoneNumber);
      if (result.success) {
        setOtpSent(true);
        return true;
      } else {
        setError(result.message || '인증번호 전송에 실패했습니다.');
        return false;
      }
    } catch (error) {
      console.error('OTP 전송 에러:', error);
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
      return false;
    }

    try {
      setError(null);
      const result = await authService.verifyOtp(phoneNumber, verificationCode);
      
      if (result.success) {
        const user = await authService.getStoredUser();
        setUser(user);
        return true;
      } else {
        setError(result.message || '인증에 실패했습니다.');
        return false;
      }
    } catch (error) {
      console.error('OTP 검증 에러:', error);
      setError('인증 중 오류가 발생했습니다.');
      return false;
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
          createdAt: formatDate(new Date())
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
    setIsLoading(true);
    setError(null);
    try {
      console.log('인증 상태 확인 시작');
      
      // 1. 리프레시 토큰 확인
      const refreshToken = await AsyncStorage.getItem(AUTH_KEYS.REFRESH_TOKEN);
      console.log('저장된 리프레시 토큰:', refreshToken ? '있음' : '없음');
      
      if (!refreshToken) {
        console.log('리프레시 토큰 없음 - 로그아웃 필요');
        return false;
      }

      // 2. 토큰 유효성 검증 및 갱신
      console.log('토큰 검증 시작');
      const result = await authService.validateAndRefreshToken();
      console.log('토큰 검증 결과:', result);
      
      if (!result.success) {
        console.log('토큰 검증 실패 - 로그아웃 필요');
        return false;
      }

      // 3. 사용자 정보 확인
      console.log('사용자 정보 확인 시작');
      const user = await authService.getStoredUser();
      console.log('저장된 사용자 정보:', user);
      
      if (!user) {
        console.log('사용자 정보 없음 - 로그아웃 필요');
        return false;
      }

      // 4. 프로필 확인
      console.log('프로필 확인 시작');
      const hasProfile = await profileService.checkProfileExists(user.uuid);
      console.log('프로필 존재 여부:', hasProfile);
      setHasProfile(hasProfile);

      console.log('인증 상태 확인 완료 - 성공');
      return true;
    } catch (error) {
      console.error('인증 확인 중 예상치 못한 에러 발생:', error);
      setError('인증 확인 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
      return isAuthenticated;
    } finally {
      setIsLoading(false);
    }
  }, [setHasProfile, isAuthenticated]);

  // OTP 재전송
  const handleResendOtp = useCallback(() => {
    setVerificationCode('');
    setOtpSent(false);
  }, []);

  // 프로필 로드
  const loadUserProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!user?.uuid) return;
      
      const profile = await profileService.getProfile(user.uuid);
      if (profile) {
        setUserProfile(profile);
      }
      return profile;
    } catch (error) {
      console.error('프로필 로드 실패:', error);
      setError('프로필 정보를 불러오는데 실패했습니다.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.uuid, setUserProfile]);

  // 프로필 수정
  const handleEditProfile = useCallback(() => {
    const currentProfile = userStore.getState().userProfile;
    if (!currentProfile) {
      Alert.alert('오류', '프로필 정보를 불러올 수 없습니다.');
      return null;
    }

    if (!currentProfile.uuid) {
      console.error('Invalid userProfile: missing uuid field', currentProfile);
      Alert.alert('오류', '프로필 정보가 올바르지 않습니다.');
      return null;
    }

    // Date 객체를 문자열로 변환
    return {
      ...currentProfile,
      createdAt: formatDate(currentProfile.createdAt),
      updatedAt: formatDate(currentProfile.updatedAt),
      lastActive: formatDate(currentProfile.lastActive)
    };
  }, []);

  // 회원 탈퇴
  const handleWithdraw = useCallback(async () => {
    if (!user?.uuid) return false;

    setIsLoading(true);
    setError(null);
    try {
      // 프로필 비활성화
      await profileService.deactivateProfile(user.uuid);
      
      // 사용자 비활성화
      await userService.deactivateUser(user.uuid);
      
      // 로컬 상태 초기화
      await handleLogout();
      
      return true;
    } catch (error) {
      console.error('회원 탈퇴 실패:', error);
      setError('회원 탈퇴 중 오류가 발생했습니다.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.uuid, handleLogout]);

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
    loadUserProfile,
    handleEditProfile,
    handleWithdraw
  };
}; 