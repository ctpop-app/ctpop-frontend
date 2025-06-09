import apiClient, { handleApiResponse, handleApiError } from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_KEYS } from '../utils/constants';
import { jwtDecode } from 'jwt-decode';
import { toE164Format } from '../utils/phoneUtils';
import useUserStore from '../store/userStore';
import { v4 as uuidv4 } from 'uuid';

/**
 * 서버 연결을 테스트합니다.
 * @returns {Promise<Object>} - 성공 여부와 메시지가 포함된 객체
 */
export const testConnection = async () => {
  try {
    const response = await apiClient.get('/test/echo?message=test', { 
      authenticated: false,
      timeout: 5000
    });
    return { 
      success: response.data === 'test', 
      message: response.data === 'test' ? '서버 연결 성공' : '서버 응답이 올바르지 않습니다', 
      data: response.data 
    };
  } catch (error) {
    console.error('서버 연결 테스트 실패:', error);
    return { 
      success: false, 
      message: '서버 연결 실패', 
      error: error.message 
    };
  }
};

/**
 * 인증번호 발송
 * @param {string} phoneNumber - 전화번호
 * @returns {Promise<Object>} - 응답 데이터
 */
export const sendOtp = async (phoneNumber) => {
  try {
    console.log('auth.js - sendOtp 시작');
    const response = await apiClient.post('/api/otp/send', { phone: phoneNumber });
    console.log('auth.js - sendOtp 원본 응답:', response.data);
    return handleApiResponse(response);
  } catch (error) {
    console.error('auth.js - sendOtp 에러:', error);
    return handleApiError(error);
  }
};

/**
 * 인증번호 검증
 * @param {string} phoneNumber - 전화번호
 * @param {string} code - 인증번호
 * @param {string} accessToken - 액세스 토큰
 * @returns {Promise<Object>} - 응답 데이터
 */
export const verifyOtp = async (phoneNumber, code, accessToken) => {
  try {
    console.log('verifyOtp 호출 - 액세스 토큰:', accessToken);  // 디버깅용 로그
    
    if (!accessToken) {
      console.log('액세스 토큰이 없습니다!');
      return {
        success: false,
        message: '인증 토큰이 없습니다.'
      };
    }

    const response = await apiClient.post('/api/otp/verify', 
      { phone: phoneNumber, code },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * 리프레시 토큰으로 인증합니다.
 * @param {string} refreshToken - 리프레시 토큰
 * @param {string} uuid - 사용자 UUID
 * @returns {Promise<Object>} - 성공 여부와 새 토큰 정보가 포함된 객체
 */
export const authenticateWithRefreshToken = async (refreshToken, uuid) => {
  try {
    const response = await apiClient.post('/auth/refresh', 
      { refreshToken, uuid },
      { authenticated: false }
    );
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * 액세스 토큰을 발급받습니다.
 * @param {string} refreshToken - 리프레시 토큰
 * @param {string} uuid - 사용자 UUID
 * @returns {Promise<Object>} - 성공 여부와 액세스 토큰이 포함된 객체
 */
export const getAccessToken = async (refreshToken, uuid) => {
  try {
    const response = await apiClient.post('/auth/access-token', 
      { refreshToken, uuid },
      { authenticated: false }
    );
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * 로그아웃합니다.
 * @param {string} uuid - 사용자 UUID
 * @param {string} refreshToken - 리프레시 토큰
 * @returns {Promise<Object>} - 성공 여부가 포함된 객체
 */
export const logout = async (uuid, refreshToken) => {
  try {
    const response = await apiClient.post('/auth/logout', { uuid, refreshToken });
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * 인증 상태를 확인합니다.
 * @returns {Promise<boolean>}
 */
export const isAuthenticated = async () => {
  try {
    const refreshToken = await AsyncStorage.getItem(AUTH_KEYS.REFRESH_TOKEN);
    const user = await getStoredUser();
    return !!(refreshToken && user?.uuid);
  } catch (error) {
    console.error('인증 상태 확인 실패:', error);
    return false;
  }
};

/**
 * 저장된 사용자 정보를 가져옵니다.
 * @returns {Promise<Object|null>}
 */
export const getStoredUser = async () => {
  try {
    const userJson = await AsyncStorage.getItem(AUTH_KEYS.USER);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error('사용자 정보 조회 실패:', error);
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

// 리프레시 토큰 검증 및 재발급
export const validateAndRefreshToken = async () => {
  try {
    const refreshToken = await AsyncStorage.getItem(AUTH_KEYS.REFRESH_TOKEN);
    const user = await getStoredUser();
    
    if (!refreshToken || !user?.uuid) {
      console.log('인증 정보 없음:', { hasRefreshToken: !!refreshToken, hasUser: !!user });
      return { 
        success: false, 
        message: '인증 정보가 없습니다.'
      };
    }
    
    // 리프레시 토큰으로 인증 시도
    const response = await apiClient.post('/auth/refresh', 
      { refreshToken, uuid: user.uuid },
      { authenticated: false }
    );
    
    const data = response.data;
    console.log('토큰 갱신 응답:', data);
    
    if (data.refreshToken) {
      // 새로운 리프레시 토큰 저장
      await AsyncStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, data.refreshToken);
      
      // 기존 사용자 정보 유지하면서 토큰만 업데이트
      if (user) {
        await storeUser(user);
      }
      
      return { 
        success: true, 
        data 
      };
    }
    
    return { 
      success: false, 
      message: '인증에 실패했습니다.' 
    };
    
  } catch (error) {
    console.error('토큰 갱신 실패:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || '인증 중 오류가 발생했습니다.' 
    };
  }
};

// 토큰 저장
export const storeTokens = async (accessToken, refreshToken) => {
  try {
    if (accessToken) {
      await AsyncStorage.setItem(AUTH_KEYS.ACCESS_TOKEN, accessToken);
    }
    if (refreshToken) {
      await AsyncStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, refreshToken);
    }
  } catch (error) {
    console.error('토큰 저장 실패:', error);
  }
};

/**
 * 슈퍼패스 토큰 발급 (개발용)
 * @returns {Promise<Object>} - 응답 데이터
 */
export const getSuperPassToken = async () => {
  try {
    let uuid;
    const user = await getStoredUser();
    
    if (user?.uuid) {
      uuid = user.uuid;
    } else {
      // UUID가 없는 경우 새로 생성
      uuid = 'superpass-' + Date.now();
    }

    const response = await apiClient.post('/test/superpass', {}, {
      headers: {
        'Authorization': `Bearer ${uuid}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('슈퍼패스 토큰 발급 실패:', error);
    throw error;
  }
}; 