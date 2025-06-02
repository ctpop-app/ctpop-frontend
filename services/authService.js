import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authApi from '../api/auth';

// Auth token keys in AsyncStorage
const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const PHONE_NUMBER_KEY = 'auth_phone_number';
const AUTH_USER_KEY = '@auth_user';

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
export const isValidPhoneNumber = (phone) => {
  // 숫자만 추출
  const numbers = phone.replace(/\D/g, '');
  
  // 010으로 시작하는 경우
  if (numbers.startsWith('010')) {
    return numbers.length === 11;
  }
  
  // +82로 시작하는 경우
  if (numbers.startsWith('82')) {
    return numbers.length === 12;
  }
  
  return false;
};

/**
 * OTP 코드 유효성 검사
 * @param {string} code - 검사할 OTP 코드
 * @returns {boolean} 유효성 여부
 */
export const isValidOtpCode = (code) => {
  return /^\d{6}$/.test(code);
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