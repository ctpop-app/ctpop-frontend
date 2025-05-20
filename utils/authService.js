import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authApi from '../api/auth';

// Auth token keys in AsyncStorage
const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const PHONE_NUMBER_KEY = 'auth_phone_number';

/**
 * 전화번호로 인증번호를 발송합니다
 * @param {string} phoneNumber - 국가 코드가 포함된 전화번호 (예: +821012345678)
 * @returns {Promise<Object>} - 상태와 메시지가 포함된 응답
 */
export const sendOtp = async (phoneNumber) => {
  return authApi.sendOtp(phoneNumber);
};

/**
 * 인증번호를 확인하고 JWT 토큰을 받아옵니다
 * @param {string} phoneNumber - 국가 코드가 포함된 전화번호
 * @param {string} code - 인증 코드
 * @returns {Promise<Object>} - 토큰 또는 오류가 포함된 응답
 */
export const verifyOtp = async (phoneNumber, code) => {
  return authApi.verifyOtp(phoneNumber, code);
};

/**
 * 사용자가 인증되었는지 확인합니다
 * @returns {Promise<boolean>}
 */
export const isAuthenticated = async () => {
  return authApi.isAuthenticated();
};

/**
 * 저장된 인증 토큰을 가져옵니다
 * @returns {Promise<Object>} - accessToken과 refreshToken을 포함하는 객체
 */
export const getAuthTokens = async () => {
  return authApi.getAuthInfo();
};

/**
 * 리프레시 토큰을 사용하여 액세스 토큰을 갱신합니다
 * @returns {Promise<string|null>} - 새 액세스 토큰 또는 갱신 실패 시 null
 */
export const refreshAccessToken = async () => {
  return authApi.refreshToken();
};

/**
 * 사용자를 로그아웃합니다
 * @returns {Promise<void>}
 */
export const logout = async () => {
  return authApi.logout();
}; 