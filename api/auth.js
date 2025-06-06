import apiClient, { handleApiResponse, handleApiError } from './client';
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
 * 전화번호로 인증번호를 발송합니다.
 * @param {string} phoneNumber - 전화번호
 * @returns {Promise<Object>} - 응답 객체
 */
export const sendOtp = async (phoneNumber) => {
  try {
    const response = await apiClient.post('/api/otp/send', { phone: phoneNumber });
    const data = response.data;
    
    // OTP 전송 시 받은 액세스 토큰은 1회용이므로 저장하지 않음
    console.log('OTP 전송 성공 - 1회용 액세스 토큰:', data.accessToken);
    
    return handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * 인증번호를 확인하고 토큰을 발급받습니다.
 * @param {string} phoneNumber - 전화번호
 * @param {string} code - 인증 코드
 * @returns {Promise<Object>} - 성공 여부와 토큰 정보가 포함된 객체
 */
export const verifyOtp = async (phoneNumber, code) => {
  try {
    // OTP 전송 시 받은 액세스 토큰 가져오기
    const accessToken = await AsyncStorage.getItem(AUTH_KEYS.ACCESS_TOKEN);
    if (!accessToken) {
      throw new Error('인증 정보가 없습니다. OTP를 다시 전송해주세요.');
    }

    console.log('OTP 검증 요청 시작:', { phoneNumber, code });
    const response = await apiClient.post('/api/otp/verify', 
      { phone: phoneNumber, code },
      { 
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    const data = response.data;
    console.log('OTP 검증 응답 데이터:', data);
    
    // refreshToken이 있으면 저장
    if (data.refreshToken) {
      console.log('토큰 저장 시작');
      // 리프레시 토큰 저장
      await AsyncStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, data.refreshToken);
      console.log('리프레시 토큰 저장 완료');
      
      // 사용자 정보 저장
      if (data.uuid) {
        console.log('사용자 정보 저장 시작');
        const user = {
          uuid: data.uuid,
          createdAt: new Date().toISOString(),
          hasProfile: false
        };
        await AsyncStorage.setItem(AUTH_KEYS.USER, JSON.stringify(user));
        console.log('사용자 정보 저장 완료:', user);
        
        // 저장된 사용자 정보 확인
        const storedUser = await getStoredUser();
        console.log('저장된 사용자 정보 확인:', storedUser);
      }
    }
    
    return handleApiResponse(response);
  } catch (error) {
    console.error('OTP 검증 에러:', error);
    return handleApiError(error);
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
    
    const response = await apiClient.post('/auth/refresh', 
      { refreshToken, uuid: user.uuid },
      { authenticated: false }
    );
    
    const data = response.data;
    
    if (data.refreshToken) {
      // 새로운 리프레시 토큰 저장
      await AsyncStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, data.refreshToken);
      
      // 기존 사용자 정보 유지하면서 토큰만 업데이트
      if (user) {
        await storeUser(user);
      }
      
      return { success: true, data };
    }
    
    return { success: false, message: '인증에 실패했습니다.' };
  } catch (error) {
    console.error('인증 오류:', error);
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
    
    const response = await apiClient.post('/auth/access-token', 
      { refreshToken, uuid: user.uuid },
      { authenticated: false }
    );
    
    const data = response.data;
    
    if (data.accessToken) {
      await AsyncStorage.setItem(AUTH_KEYS.ACCESS_TOKEN, data.accessToken);
      return { success: true, data };
    }
    
    return { success: false, message: '액세스 토큰 발급에 실패했습니다.' };
  } catch (error) {
    console.error('액세스 토큰 발급 오류:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || '액세스 토큰 발급 중 오류가 발생했습니다.' 
    };
  }
};

/**
 * 로그아웃합니다.
 * @returns {Promise<Object>} - 성공 여부가 포함된 객체
 */
export const logout = async () => {
  try {
    // 현재 저장된 토큰과 사용자 정보 가져오기
    const refreshToken = await AsyncStorage.getItem(AUTH_KEYS.REFRESH_TOKEN);
    const user = await getStoredUser();

    // 서버에 로그아웃 요청을 보내되, 실패해도 계속 진행
    await apiClient.post('/auth/logout', {
      uuid: user?.uuid,
      refreshToken
    }).catch(error => {
      console.warn('서버 로그아웃 실패:', error);
    });
    
    // 로컬 토큰 삭제
    await AsyncStorage.multiRemove([
      AUTH_KEYS.ACCESS_TOKEN,
      AUTH_KEYS.REFRESH_TOKEN,
      AUTH_KEYS.USER
    ]);
    
    return { success: true, message: '로그아웃되었습니다.' };
  } catch (error) {
    console.error('로그아웃 중 오류:', error);
    return { success: false, message: '로그아웃 중 오류가 발생했습니다.' };
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
      return { 
        success: false, 
        message: '인증 정보가 없습니다.',
        shouldLogout: true 
      };
    }
    
    // 리프레시 토큰 유효성 검증
    const response = await apiClient.post('/auth/validate-refresh-token', 
      { refreshToken, uuid: user.uuid },
      { authenticated: false }
    );
    
    const data = response.data;
    
    if (data.isValid) {
      // 유효한 경우 새로운 토큰 발급
      const newTokens = await apiClient.post('/auth/refresh-tokens', 
        { refreshToken, uuid: user.uuid },
        { authenticated: false }
      );
      
      if (newTokens.data.accessToken && newTokens.data.refreshToken) {
        // 토큰만 업데이트하고 사용자 정보는 유지
        await storeTokens(newTokens.data.accessToken, newTokens.data.refreshToken);
        return { 
          success: true, 
          data: newTokens.data 
        };
      }
    }
    
    // 토큰이 유효하지 않은 경우
    return { 
      success: false, 
      message: '인증이 만료되었습니다.',
      shouldLogout: true 
    };
    
  } catch (error) {
    return { 
      success: false, 
      message: error.message,
      shouldLogout: true 
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