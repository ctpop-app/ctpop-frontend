import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authApi from '../api/auth';
import { AUTH_KEYS } from '../utils/constants';
import { jwtDecode } from 'jwt-decode';

// Auth token keys in AsyncStorage
const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const PHONE_NUMBER_KEY = 'auth_phone_number';
const AUTH_USER_KEY = '@auth_user';

// 토큰 만료 시간 (밀리초)
const ACCESS_TOKEN_EXPIRY = 30 * 60 * 1000;  // 30분
const REFRESH_TOKEN_EXPIRY = 30 * 24 * 60 * 60 * 1000;  // 30일

/**
 * 서버 연결을 테스트합니다.
 * @returns {Promise<Object>} - 성공 여부와 메시지가 포함된 객체
 */
export const testConnection = async () => {
  return authApi.testConnection();
};

/**
 * 전화번호를 E.164 형식으로 변환
 * @param {string} phone - 변환할 전화번호
 * @returns {string} E.164 형식의 전화번호
 */
export const toE164Format = (phone) => {
  // phone이 문자열이 아니면 빈 문자열로 변환
  const phoneStr = String(phone || '');
  
  // 숫자만 추출
  const numbers = phoneStr.replace(/\D/g, '');
  
  // 010으로 시작하는 경우 82로 변환
  if (numbers.startsWith('010')) {
    return '82' + numbers.substring(1);
  }
  
  // 이미 82로 시작하는 경우 그대로 반환
  if (numbers.startsWith('82')) {
    return numbers;
  }
  
  // 그 외의 경우 82를 추가
  return '82' + numbers;
};

/**
 * 전화번호 유효성 검사
 * @param {string} phone - 검사할 전화번호
 * @returns {boolean} 유효성 여부
 */
export const isValidPhoneNumber = (phoneNumber) => {
  const phoneRegex = /^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$/;
  return phoneRegex.test(phoneNumber);
};

/**
 * OTP 코드 유효성 검사
 * @param {string} code - 검사할 OTP 코드
 * @returns {boolean} 유효성 여부
 */
export const isValidOtpCode = (code) => {
  return code.length === 6 && /^\d+$/.test(code);
};

/**
 * 전화번호로 인증번호를 발송합니다
 * @param {string} phoneNumber - 국가 코드가 포함된 전화번호
 * @returns {Promise<Object>} - 상태와 메시지가 포함된 응답
 */
export const sendOtp = async (phoneNumber) => {
  const formattedPhone = toE164Format(phoneNumber);
  return authApi.sendOtp(formattedPhone);
};

/**
 * 인증번호를 확인합니다
 * @param {string} phoneNumber - 전화번호
 * @param {string} code - 인증번호
 * @returns {Promise<Object>} - 인증 결과
 */
export const verifyOtp = async (phoneNumber, code) => {
  const formattedPhone = toE164Format(phoneNumber);
  return authApi.verifyOtp(formattedPhone, code);
};

/**
 * 인증 상태를 확인합니다.
 * @returns {Promise<boolean>}
 */
export const isAuthenticated = async () => {
  try {
    // 1. 액세스 토큰 확인
    const accessToken = await AsyncStorage.getItem(AUTH_KEYS.ACCESS_TOKEN);
    if (!accessToken) return false;

    // 2. 토큰 만료 확인
    if (isTokenExpired(accessToken)) {
      // 만료된 경우 리프레시 토큰으로 갱신 시도
      const result = await refreshAccessToken();
      return result.success;
    }

    return true;
  } catch (error) {
    console.error('인증 확인 오류:', error);
    return false;
  }
};

/**
 * 저장된 인증 토큰을 가져옵니다
 * @returns {Promise<Object>} - accessToken과 refreshToken을 포함하는 객체
 */
export const getAuthTokens = async () => {
  return authApi.getAuthInfo();
};

/**
 * 저장된 사용자 정보를 가져옵니다
 * @returns {Promise<Object|null>} - 사용자 정보 또는 null
 */
export const getStoredUser = async () => {
  try {
    const userStr = await AsyncStorage.getItem(AUTH_USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('저장된 사용자 정보 조회 중 오류:', error);
    return null;
  }
};

/**
 * 사용자 정보를 저장합니다
 * @param {Object} user - 저장할 사용자 정보
 */
export const storeUser = async (user) => {
  try {
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('사용자 정보 저장 중 오류:', error);
  }
};

/**
 * 토큰의 만료 시간을 확인합니다
 * @param {string} token - JWT 토큰
 * @returns {boolean} - 만료 여부
 */
export const isTokenExpired = (token) => {
  try {
    const decoded = jwtDecode(token);
    const expiryTime = decoded.exp * 1000; // 초를 밀리초로 변환
    return Date.now() >= expiryTime;
  } catch (error) {
    console.error('토큰 디코딩 오류:', error);
    return true; // 디코딩 실패 시 만료된 것으로 처리
  }
};

/**
 * 리프레시 토큰의 만료 여부를 확인합니다
 * @returns {Promise<boolean>} - 만료 여부
 */
export const isRefreshTokenExpired = async () => {
  try {
    const refreshToken = await AsyncStorage.getItem(AUTH_KEYS.REFRESH_TOKEN);
    if (!refreshToken) return true;
    
    return isTokenExpired(refreshToken);
  } catch (error) {
    console.error('리프레시 토큰 확인 오류:', error);
    return true;
  }
};

/**
 * 리프레시 토큰을 사용하여 액세스 토큰을 갱신합니다
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export const refreshAccessToken = async () => {
  try {
    // 리프레시 토큰 만료 확인
    if (await isRefreshTokenExpired()) {
      console.log('리프레시 토큰이 만료되었습니다.');
      await logout();
      return { success: false, message: '리프레시 토큰이 만료되었습니다.' };
    }

    const refreshToken = await AsyncStorage.getItem(AUTH_KEYS.REFRESH_TOKEN);
    if (!refreshToken) {
      return { success: false, message: '리프레시 토큰이 없습니다.' };
    }

    const result = await authApi.refreshToken(refreshToken);
    if (result.success) {
      await AsyncStorage.setItem(AUTH_KEYS.ACCESS_TOKEN, result.data.accessToken);
      if (result.data.refreshToken) {
        await AsyncStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, result.data.refreshToken);
      }
      return { success: true };
    }
    return { success: false, message: result.message };
  } catch (error) {
    console.error('토큰 갱신 실패:', error);
    return { success: false, message: error.message };
  }
};

/**
 * 사용자를 로그아웃합니다
 * @returns {Promise<void>}
 */
export const logout = async () => {
  return authApi.logout();
};

/**
 * 토큰 저장
 * @param {string} accessToken - 액세스 토큰
 * @param {string} refreshToken - 리프레시 토큰
 * @returns {Promise<boolean>} - 성공 여부
 */
export const storeTokens = async (accessToken, refreshToken) => {
  try {
    await AsyncStorage.setItem(AUTH_KEYS.ACCESS_TOKEN, accessToken);
    if (refreshToken) {
      await AsyncStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, refreshToken);
    }
    return true;
  } catch (error) {
    console.error('토큰 저장 실패:', error);
    return false;
  }
};

/**
 * 토큰 삭제
 * @returns {Promise<boolean>} - 성공 여부
 */
export const clearTokens = async () => {
  try {
    await AsyncStorage.removeItem(AUTH_KEYS.ACCESS_TOKEN);
    await AsyncStorage.removeItem(AUTH_KEYS.REFRESH_TOKEN);
    return true;
  } catch (error) {
    console.error('토큰 삭제 실패:', error);
    return false;
  }
}; 