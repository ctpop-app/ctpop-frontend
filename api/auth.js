import apiClient from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_KEYS } from '../utils/constants';
import { jwtDecode } from 'jwt-decode';
import { toE164Format } from '../services/authService';

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
    console.log('OTP 인증 응답:', data);
    
    if (data.accessToken) {
      // 1. 토큰 저장
      await AsyncStorage.setItem(AUTH_KEYS.ACCESS_TOKEN, data.accessToken);
      await AsyncStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, data.refreshToken);
      
      // 2. JWT 토큰에서 UUID 추출
      const decodedToken = jwtDecode(data.accessToken);
      console.log('디코딩된 토큰:', decodedToken);
      
      // 3. 사용자 정보 저장
      const user = {
        uuid: decodedToken.uuid,  // JWT의 uuid claim 사용
        createdAt: new Date().toISOString()
      };
      console.log('저장할 사용자 정보:', user);
      await storeUser(user);
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
    console.log('refreshToken 시작');
    const refreshToken = await AsyncStorage.getItem(AUTH_KEYS.REFRESH_TOKEN);
    const user = await getStoredUser();
    
    console.log('refreshToken 확인:', refreshToken ? '있음' : '없음');
    console.log('user 확인:', user ? '있음' : '없음');
    
    if (!refreshToken || !user?.uuid) {
      console.log('토큰 또는 사용자 정보가 없습니다.');
      return { success: false, message: '토큰 정보가 없습니다.' };
    }
    
    console.log('서버에 토큰 갱신 요청');
    const response = await apiClient.post('/auth/refresh', 
      { refreshToken, uuid: user.uuid },
      { authenticated: false }
    );
    
    const data = response.data;
    console.log('토큰 갱신 응답:', data);
    
    if (data.accessToken) {
      // 1. 토큰 저장
      await AsyncStorage.setItem(AUTH_KEYS.ACCESS_TOKEN, data.accessToken);
      await AsyncStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, data.refreshToken);
      
      // 2. UUID 업데이트
      const decodedToken = jwtDecode(data.accessToken);
      if (user) {
        user.uuid = decodedToken.uuid;
        await storeUser(user);
      }
      
      console.log('토큰 갱신 완료');
      return { success: true, data };
    }
    
    console.log('토큰 갱신 실패');
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
    const user = await getStoredUser();
    
    if (user?.uuid) {
      await apiClient.post('/auth/logout', { uuid: user.uuid });
    }
    
    await AsyncStorage.removeItem(AUTH_KEYS.ACCESS_TOKEN);
    await AsyncStorage.removeItem(AUTH_KEYS.REFRESH_TOKEN);
    await AsyncStorage.removeItem(AUTH_KEYS.USER);
    
    return { success: true };
  } catch (error) {
    console.error('로그아웃 오류:', error);
    // 로그아웃 실패해도 로컬 데이터는 삭제
    await AsyncStorage.removeItem(AUTH_KEYS.ACCESS_TOKEN);
    await AsyncStorage.removeItem(AUTH_KEYS.REFRESH_TOKEN);
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
    if (!refreshToken) {
      console.log('리프레시 토큰이 없습니다.');
      return false;
    }

    // 2. 리프레시 토큰 디코딩하여 만료 여부 확인
    try {
      const decodedToken = jwtDecode(refreshToken);
      const currentTime = Date.now() / 1000;
      
      if (decodedToken.exp < currentTime) {
        console.log('리프레시 토큰이 만료되었습니다.');
        return false;
      }
      
      console.log('리프레시 토큰이 유효합니다.');
      return true;
    } catch (decodeError) {
      console.error('리프레시 토큰 디코딩 오류:', decodeError);
      return false;
    }
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