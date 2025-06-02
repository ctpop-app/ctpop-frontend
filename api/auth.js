import apiClient from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toE164Format } from '../services/authService';
import { AUTH_KEYS } from '../utils/constants';
import { jwtDecode } from 'jwt-decode';

/**
 * 서버 연결을 테스트합니다.
 * @returns {Promise<Object>} - 성공 여부와 메시지가 포함된 객체
 */
export const testConnection = async () => {
  try {
    const response = await apiClient.get('/auth/echo?message=test', { 
      authenticated: false,
      timeout: 5000
    });
    return { 
      success: true, 
      message: '서버에 연결되었습니다.',
      data: response.data
    };
  } catch (error) {
    console.error('서버 연결 테스트 실패:', error);
    return { 
      success: false, 
      message: error.message || '서버 연결에 실패했습니다.'
    };
  }
};

/**
 * 전화번호로 인증번호를 발송합니다.
 * @param {string} phoneNumber - 전화번호
 * @returns {Promise<Object>} - 응답 객체
 */
export const sendOtp = async (phoneNumber) => {
  try {
    const formattedPhone = toE164Format(phoneNumber);
    const response = await apiClient.post('/auth/otp/send', 
      { phone: formattedPhone }, 
      { authenticated: false }
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error('OTP 전송 오류:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'OTP 전송 중 오류가 발생했습니다.' 
    };
  }
};

/**
 * 인증번호를 확인하고 JWT 토큰을 받아옵니다.
 * @param {string} phoneNumber - 전화번호
 * @param {string} code - 인증 코드
 * @returns {Promise<Object>} - 성공 여부와 토큰 정보가 포함된 객체
 */
export const verifyOtp = async (phoneNumber, code) => {
  try {
    const formattedPhone = toE164Format(phoneNumber);
    const response = await apiClient.post('/auth/otp/verify', 
      { phone: formattedPhone, code }, 
      { authenticated: false }
    );
    
    const data = response.data;
    
    if (data.accessToken) {
      await AsyncStorage.setItem(AUTH_KEYS.ACCESS_TOKEN, data.accessToken);
      await AsyncStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, data.refreshToken);
      await AsyncStorage.setItem(AUTH_KEYS.PHONE_NUMBER, formattedPhone);
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('OTP 확인 오류:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'OTP 확인 중 오류가 발생했습니다.' 
    };
  }
};

/**
 * 토큰을 갱신합니다.
 * @returns {Promise<Object>} - 성공 여부와 새 토큰 정보가 포함된 객체
 */
export const refreshToken = async () => {
  try {
    const refreshToken = await AsyncStorage.getItem(AUTH_KEYS.REFRESH_TOKEN);
    const phoneNumber = await AsyncStorage.getItem(AUTH_KEYS.PHONE_NUMBER);
    
    if (!refreshToken || !phoneNumber) {
      return { success: false, message: '토큰 정보가 없습니다.' };
    }
    
    const response = await apiClient.post('/auth/refresh', 
      { refreshToken, phone: phoneNumber },
      { authenticated: false }
    );
    
    const data = response.data;
    
    if (data.accessToken) {
      await AsyncStorage.setItem(AUTH_KEYS.ACCESS_TOKEN, data.accessToken);
      return { success: true, data };
    }
    
    return { success: false, message: '토큰 갱신에 실패했습니다.' };
  } catch (error) {
    console.error('토큰 갱신 오류:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || '토큰 갱신 중 오류가 발생했습니다.' 
    };
  }
};

/**
 * 사용자를 로그아웃합니다.
 * @returns {Promise<Object>} - 성공 여부가 포함된 객체
 */
export const logout = async () => {
  try {
    const phoneNumber = await AsyncStorage.getItem(AUTH_KEYS.PHONE_NUMBER);
    
    if (phoneNumber) {
      await apiClient.post('/auth/logout', { phone: phoneNumber });
    }
    
    await AsyncStorage.removeItem(AUTH_KEYS.ACCESS_TOKEN);
    await AsyncStorage.removeItem(AUTH_KEYS.REFRESH_TOKEN);
    await AsyncStorage.removeItem(AUTH_KEYS.PHONE_NUMBER);
    await AsyncStorage.removeItem(AUTH_KEYS.USER);
    
    return { success: true };
  } catch (error) {
    console.error('로그아웃 오류:', error);
    // 로그아웃 실패해도 로컬 데이터는 삭제
    await AsyncStorage.removeItem(AUTH_KEYS.ACCESS_TOKEN);
    await AsyncStorage.removeItem(AUTH_KEYS.REFRESH_TOKEN);
    await AsyncStorage.removeItem(AUTH_KEYS.PHONE_NUMBER);
    await AsyncStorage.removeItem(AUTH_KEYS.USER);
    return { success: true };
  }
};

/**
 * 인증 상태를 확인합니다.
 * @returns {Promise<boolean>}
 */
export const isAuthenticated = async () => {
  try {
    // 1. 리프레시 토큰 확인
    const refreshToken = await AsyncStorage.getItem(AUTH_KEYS.REFRESH_TOKEN);
    if (!refreshToken) return false;

    // 2. 리프레시 토큰 만료 시간 확인
    const decoded = jwtDecode(refreshToken);
    const expirationTime = decoded.exp * 1000; // 초를 밀리초로 변환
    const currentTime = Date.now();
    
    // 3. 리프레시 토큰이 만료되지 않았다면 인증된 것으로 간주
    return expirationTime > currentTime;
  } catch (error) {
    console.error('인증 확인 오류:', error);
    return false;
  }
};

/**
 * 저장된 사용자 정보를 가져옵니다.
 * @returns {Promise<Object|null>}
 */
export const getStoredUser = async () => {
  try {
    const userStr = await AsyncStorage.getItem(AUTH_KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    return null;
  }
};

/**
 * 사용자 정보를 저장합니다.
 * @param {Object} user - 저장할 사용자 정보
 * @returns {Promise<void>}
 */
export const storeUser = async (user) => {
  try {
    await AsyncStorage.setItem(AUTH_KEYS.USER, JSON.stringify(user));
  } catch (error) {
    console.error('사용자 정보 저장 오류:', error);
  }
}; 