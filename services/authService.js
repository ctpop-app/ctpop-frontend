import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authApi from '../api/auth';
import { AUTH_KEYS } from '../utils/constants';
import { jwtDecode } from 'jwt-decode';
import { getCurrentKST } from '../utils/dateUtils';
import { toE164Format, isValidPhoneNumber } from '../utils/phoneUtils';

// Auth token keys in AsyncStorage
const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const PHONE_NUMBER_KEY = 'auth_phone_number';
const AUTH_USER_KEY = '@auth_user';

// 토큰 만료 시간 (밀리초)
const ACCESS_TOKEN_EXPIRY = 30 * 60 * 1000;  // 30분
const REFRESH_TOKEN_EXPIRY = 30 * 24 * 60 * 60 * 1000;  // 30일

/**
 * OTP 코드 형식이 유효한지 검사합니다.
 * @param {string} code - 검사할 OTP 코드
 * @returns {boolean} 유효성 여부
 */
export const isValidOtpCode = (code) => {
  // 6자리 숫자 검사
  return /^\d{6}$/.test(code);
};

/**
 * 서버 연결을 테스트합니다.
 * @returns {Promise<Object>} - 성공 여부와 메시지가 포함된 객체
 */
export const testConnection = async () => {
  return authApi.testConnection();
};

/**
 * 전화번호로 인증번호를 발송합니다
 * @param {string} phoneNumber - 국가 코드가 포함된 전화번호
 * @returns {Promise<Object>} - 상태와 메시지가 포함된 응답
 */
export const sendOtp = async (phoneNumber) => {
  console.log('authService.js - sendOtp 시작');
  try {
    // 전화번호 유효성 검사
    if (!isValidPhoneNumber(phoneNumber)) {
      return {
        success: false,
        message: '유효하지 않은 전화번호 형식입니다. 010으로 시작하는 11자리 숫자를 입력해주세요.'
      };
    }

    const formattedPhone = toE164Format(phoneNumber);
    const response = await authApi.sendOtp(formattedPhone);
    console.log('authService.js - sendOtp 응답:', response);
    
    if (!response.success) {
      return {
        success: false,
        message: response.message || '인증번호 전송에 실패했습니다.'
      };
    }

    // 액세스 토큰 저장
    if (response.accessToken) {
      try {
        await AsyncStorage.setItem(AUTH_KEYS.ACCESS_TOKEN, response.accessToken);
        console.log('authService.js - AsyncStorage에 토큰 저장 완료');
      } catch (error) {
        console.error('authService.js - 토큰 저장 실패:', error);
        return {
          success: false,
          message: '인증 토큰 저장에 실패했습니다.'
        };
      }
    }
    
    return {
      success: true,
      message: '인증번호가 전송되었습니다.'
    };
  } catch (error) {
    console.error('authService.js - sendOtp 에러:', error);
    return {
      success: false,
      message: error.message || '인증번호 전송 중 오류가 발생했습니다.'
    };
  }
};

/**
 * 인증번호를 확인합니다
 * @param {string} phoneNumber - 전화번호
 * @param {string} code - 인증번호
 * @returns {Promise<Object>} - 인증 결과
 */
export const verifyOtp = async (phoneNumber, code) => {
  console.log('authService.js - verifyOtp 시작');
  try {
    const formattedPhone = toE164Format(phoneNumber);
    const accessToken = await AsyncStorage.getItem(AUTH_KEYS.ACCESS_TOKEN);
    console.log('authService.js - 저장된 액세스 토큰:', accessToken);
    
    if (!accessToken) {
      console.log('authService.js - 액세스 토큰 없음');
      return {
        success: false,
        message: '인증 토큰이 없습니다. 다시 로그인해주세요.'
      };
    }

    if (isTokenExpired(accessToken)) {
      console.log('authService.js - 액세스 토큰 만료');
      return {
        success: false,
        message: '인증 토큰이 만료되었습니다. 다시 로그인해주세요.'
      };
    }

    const response = await authApi.verifyOtp(formattedPhone, code, accessToken);
    console.log('authService.js - verifyOtp 응답:', response);
    
    if (response.success) {
      try {
        if (response.refreshToken) {
          console.log('authService.js - 리프레시 토큰 저장');
          await AsyncStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, response.refreshToken);
        }
        
        if (response.uuid) {
          console.log('authService.js - 사용자 정보 저장');
          const user = {
            uuid: response.uuid,
            createdAt: getCurrentKST(),
            hasProfile: false
          };
          await AsyncStorage.setItem(AUTH_KEYS.USER, JSON.stringify(user));
        }
      } catch (error) {
        console.error('authService.js - 토큰 저장 실패:', error);
        return {
          success: false,
          message: '인증 정보 저장에 실패했습니다.'
        };
      }
    }
    
    return response;
  } catch (error) {
    console.error('authService.js - verifyOtp 에러:', error);
    return {
      success: false,
      message: error.message || 'OTP 검증 중 오류가 발생했습니다.'
    };
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
 * 저장된 사용자 정보를 가져옵니다
 * @returns {Promise<Object|null>} - 사용자 정보 또는 null
 */
export const getStoredUser = async () => {
  try {
    const userStr = await AsyncStorage.getItem(AUTH_KEYS.USER);
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
    await AsyncStorage.setItem(AUTH_KEYS.USER, JSON.stringify(user));
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
 * 리프레시 토큰으로 인증합니다.
 * @returns {Promise<Object>} - 성공 여부와 새 토큰 정보가 포함된 객체
 */
export const authenticateWithRefreshToken = async () => {
  try {
    const refreshToken = await AsyncStorage.getItem(AUTH_KEYS.REFRESH_TOKEN);
    const user = await getStoredUser();
    
    if (!refreshToken || !user?.uuid) {
      return { success: false, message: '인증 정보가 없습니다.' };
    }

    if (isTokenExpired(refreshToken)) {
      await clearTokens();
      return { success: false, message: '리프레시 토큰이 만료되었습니다.' };
    }
    
    const response = await authApi.authenticateWithRefreshToken(refreshToken, user.uuid);
    
    if (response.success && response.data?.refreshToken) {
      try {
        // 새 토큰을 먼저 저장
        await AsyncStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, response.data.refreshToken);
        if (response.data?.accessToken) {
          await AsyncStorage.setItem(AUTH_KEYS.ACCESS_TOKEN, response.data.accessToken);
        }
      } catch (error) {
        console.error('토큰 저장 실패:', error);
        return {
          success: false,
          message: '인증 정보 갱신에 실패했습니다.'
        };
      }
    }
    
    return response;
  } catch (error) {
    console.error('인증 오류:', error);
    if (error.response?.status === 401) {
      await clearTokens();
    }
    return { 
      success: false, 
      message: error.response?.data?.message || '인증 중 오류가 발생했습니다.' 
    };
  }
};

/**
 * 액세스 토큰을 발급받습니다.
 * @returns {Promise<Object>} - 성공 여부와 액세스 토큰이 포함된 객체
 */
export const getAccessToken = async () => {
  try {
    const refreshToken = await AsyncStorage.getItem(AUTH_KEYS.REFRESH_TOKEN);
    const user = await getStoredUser();
    
    if (!refreshToken || !user?.uuid) {
      return { success: false, message: '인증 정보가 없습니다.' };
    }

    if (isTokenExpired(refreshToken)) {
      await clearTokens();
      return { success: false, message: '리프레시 토큰이 만료되었습니다.' };
    }
    
    const response = await authApi.getAccessToken(refreshToken, user.uuid);
    
    if (response.success && response.data?.accessToken) {
      try {
        await AsyncStorage.setItem(AUTH_KEYS.ACCESS_TOKEN, response.data.accessToken);
        return {
          success: true,
          data: { accessToken: response.data.accessToken }
        };
      } catch (error) {
        console.error('액세스 토큰 저장 실패:', error);
        return {
          success: false,
          message: '액세스 토큰 저장에 실패했습니다.'
        };
      }
    }
    
    return { success: false, message: '액세스 토큰 발급에 실패했습니다.' };
  } catch (error) {
    console.error('액세스 토큰 발급 오류:', error);
    if (error.response?.status === 401) {
      await clearTokens();
    }
    return { 
      success: false, 
      message: error.response?.data?.message || '액세스 토큰 발급 중 오류가 발생했습니다.' 
    };
  }
};

/**
 * 사용자를 로그아웃합니다
 * @returns {Promise<void>}
 */
export const logout = async () => {
  try {
    const refreshToken = await AsyncStorage.getItem(AUTH_KEYS.REFRESH_TOKEN);
    const user = await getStoredUser();
    
    // 서버 로그아웃 시도
    try {
      await authApi.logout(user?.uuid, refreshToken);
    } catch (error) {
      console.warn('서버 로그아웃 실패:', error);
      // 서버 로그아웃 실패 시에도 로컬 데이터는 삭제 (보안을 위해)
    }

    // 로컬 데이터 삭제
    try {
      await AsyncStorage.multiRemove([
        AUTH_KEYS.ACCESS_TOKEN,
        AUTH_KEYS.REFRESH_TOKEN,
        AUTH_KEYS.USER
      ]);
      return { success: true, message: '로그아웃되었습니다.' };
    } catch (error) {
      console.error('로컬 데이터 삭제 실패:', error);
      return { success: false, message: '로그아웃 중 오류가 발생했습니다.' };
    }
  } catch (error) {
    console.error('로그아웃 중 오류:', error);
    return { success: false, message: '로그아웃 중 오류가 발생했습니다.' };
  }
};

/**
 * 토큰 삭제
 * @returns {Promise<boolean>} - 성공 여부
 */
export const clearTokens = async () => {
  try {
    await AsyncStorage.multiRemove([
      AUTH_KEYS.ACCESS_TOKEN,
      AUTH_KEYS.REFRESH_TOKEN
    ]);
    return true;
  } catch (error) {
    console.error('토큰 삭제 실패:', error);
    return false;
  }
};

/**
 * 토큰을 검증하고 필요한 경우 갱신합니다.
 * @returns {Promise<Object>} - 검증 결과
 */
export const validateAndRefreshToken = async () => {
  try {
    const refreshToken = await AsyncStorage.getItem(AUTH_KEYS.REFRESH_TOKEN);
    if (!refreshToken) {
      return { success: false, shouldLogout: true };
    }

    // 리프레시 토큰의 유효기간 확인
    if (isTokenExpired(refreshToken)) {
      console.log('리프레시 토큰 만료됨');
      await clearTokens();
      return { success: false, shouldLogout: true };
    }

    // 토큰이 유효하면 갱신 시도
    console.log('리프레시 토큰 유효, 갱신 시도');
    const result = await authenticateWithRefreshToken();
    
    if (!result.success) {
      console.log('토큰 갱신 실패:', result.message);
      // 서버 오류 등 일시적인 문제인 경우 재시도
      if (result.message?.includes('서버 오류')) {
        return { success: false, shouldLogout: false };
      }
      // 그 외의 경우 로그아웃
      return { success: false, shouldLogout: true };
    }

    return result;
  } catch (error) {
    console.error('토큰 검증 중 오류:', error);
    // 네트워크 오류 등 일시적인 문제인 경우 재시도
    if (error.message?.includes('network') || error.message?.includes('timeout')) {
      return { success: false, shouldLogout: false };
    }
    return { success: false, shouldLogout: true };
  }
}; 