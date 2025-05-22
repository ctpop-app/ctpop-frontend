import apiClient, { handleApiResponse, handleApiError } from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage 키 상수
const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const PHONE_NUMBER_KEY = 'auth_phone_number';

/**
 * 전화번호로 인증번호를 발송합니다.
 * @param {string} phoneNumber - 국가 코드가 포함된 전화번호 (예: +821012345678)
 * @returns {Promise<Object>} - 응답 객체
 */
export const sendOtp = async (phoneNumber) => {
  try {
    console.log('API 요청 시작: /auth/otp/send', { phone: phoneNumber });
    console.log('API URL:', apiClient.defaults.baseURL);
    
    const response = await apiClient.post('/auth/otp/send', { phone: phoneNumber }, { authenticated: false });
    console.log('API 응답 성공:', response.data);
    return { success: true, ...handleApiResponse(response) };
  } catch (error) {
    console.error('OTP 전송 오류:', error);
    console.error('오류 세부정보:', error.message);
    if (error.response) {
      console.error('서버 응답:', error.response.data);
      console.error('상태 코드:', error.response.status);
    } else if (error.request) {
      console.error('요청은 전송되었으나 응답이 없음:', error.request);
    }
    return handleApiError(error);
  }
};

/**
 * 인증번호를 확인하고 JWT 토큰을 받아옵니다.
 * @param {string} phoneNumber - 국가 코드가 포함된 전화번호
 * @param {string} code - 인증 코드
 * @returns {Promise<Object>} - 성공 여부와 토큰 정보가 포함된 객체
 */
export const verifyOtp = async (phoneNumber, code) => {
  try {
    const response = await apiClient.post('/auth/otp/verify', 
      { phone: phoneNumber, code }, 
      { authenticated: false }
    );
    
    const data = handleApiResponse(response);
    
    // 토큰 저장
    if (data.accessToken) {
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
      await AsyncStorage.setItem(PHONE_NUMBER_KEY, phoneNumber);
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('OTP 확인 오류:', error);
    return handleApiError(error);
  }
};

/**
 * 토큰을 갱신합니다.
 * @returns {Promise<string|null>} - 새 액세스 토큰 또는 실패 시 null
 */
export const refreshToken = async () => {
  try {
    // 저장된 토큰 정보 가져오기
    const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    const phoneNumber = await AsyncStorage.getItem(PHONE_NUMBER_KEY);
    
    if (!refreshToken || !phoneNumber) return null;
    
    const response = await apiClient.post('/auth/refresh', 
      { refreshToken, phone: phoneNumber },
      { authenticated: false }
    );
    
    const data = handleApiResponse(response);
    
    // 새 액세스 토큰 저장
    if (data.accessToken) {
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
      return data.accessToken;
    }
    
    return null;
  } catch (error) {
    console.error('토큰 갱신 오류:', error);
    
    // 네트워크 오류인 경우, 기존 토큰을 그대로 사용 (오프라인 모드 지원)
    if (error.message === 'Network Error') {
      const existingToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (existingToken) {
        console.log('네트워크 오류로 인해 기존 토큰을 사용합니다');
        return existingToken;
      }
    }
    
    return null;
  }
};

/**
 * 사용자를 로그아웃합니다.
 * @returns {Promise<boolean>} - 성공 여부
 */
export const logout = async () => {
  try {
    const phoneNumber = await AsyncStorage.getItem(PHONE_NUMBER_KEY);
    
    if (phoneNumber) {
      // 로그아웃 API 호출
      await apiClient.post('/auth/logout', { phone: phoneNumber });
    }
    
    // 토큰 정보 삭제
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    await AsyncStorage.removeItem(PHONE_NUMBER_KEY);
    
    return true;
  } catch (error) {
    console.error('로그아웃 오류:', error);
    
    // API 호출이 실패하더라도 로컬 토큰은 삭제
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    await AsyncStorage.removeItem(PHONE_NUMBER_KEY);
    
    return true;
  }
};

/**
 * 인증 상태를 확인합니다.
 * @returns {Promise<boolean>}
 */
export const isAuthenticated = async () => {
  try {
    const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    return !!accessToken;
  } catch (error) {
    console.error('인증 확인 오류:', error);
    return false;
  }
};

/**
 * 저장된 인증 정보를 가져옵니다.
 * @returns {Promise<Object>}
 */
export const getAuthInfo = async () => {
  try {
    const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    const phoneNumber = await AsyncStorage.getItem(PHONE_NUMBER_KEY);
    
    return { accessToken, refreshToken, phoneNumber };
  } catch (error) {
    console.error('인증 정보 가져오기 오류:', error);
    return { accessToken: null, refreshToken: null, phoneNumber: null };
  }
}; 