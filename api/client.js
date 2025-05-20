import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../utils/config';
import { refreshAccessToken } from '../utils/authService';

// 기본 Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: config.API_URL,
  timeout: 30000, // 30초로 타임아웃 증가 (네트워크 상태가 좋지 않을 경우 대비)
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// 네트워크 연결 확인 함수
export const testNetworkConnection = async () => {
  try {
    const response = await apiClient.get('/auth/echo?message=test', { timeout: 5000 });
    return {
      connected: true,
      data: response.data
    };
  } catch (error) {
    console.error('네트워크 연결 테스트 실패:', error.message);
    let errorMessage = '서버에 연결할 수 없습니다.';
    
    if (error.response) {
      // 서버가 응답했지만 에러 코드 반환
      errorMessage = `서버 응답 오류: ${error.response.status}`;
    } else if (error.request) {
      // 요청은 전송되었으나 응답 없음
      errorMessage = '서버로부터 응답이 없습니다. 서버가 실행 중인지 확인하세요.';
    } else {
      // 요청 전송 과정에서 오류 발생
      errorMessage = `요청 오류: ${error.message}`;
    }
    
    return {
      connected: false,
      error: errorMessage
    };
  }
};

// 요청 인터셉터 설정
apiClient.interceptors.request.use(
  async (config) => {
    // 인증이 필요한 요청에 토큰 추가
    if (config.authenticated !== false) {
      const accessToken = await AsyncStorage.getItem('auth_access_token');
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 설정
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // 401 에러이고, 재시도한 적이 없다면 토큰 갱신 시도
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // 액세스 토큰 갱신 시도
        const newAccessToken = await refreshAccessToken();
        
        if (newAccessToken) {
          // 새 토큰으로 헤더 업데이트
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          // 원래 요청 재시도
          return apiClient(originalRequest);
        } else {
          // 토큰 갱신 실패 시 처리 (로그아웃 등)
          // TODO: 로그아웃 처리 로직 추가
          console.error('토큰 갱신 실패, 로그아웃 필요');
          return Promise.reject(error);
        }
      } catch (refreshError) {
        console.error('토큰 갱신 중 오류:', refreshError);
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// API 응답 공통 핸들러
export const handleApiResponse = (response) => {
  return response.data;
};

// API 에러 공통 핸들러
export const handleApiError = (error) => {
  // 네트워크 에러
  if (!error.response) {
    return {
      success: false,
      message: '네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.',
    };
  }
  
  // 서버 에러
  const status = error.response.status;
  
  if (status === 400) {
    return {
      success: false,
      message: error.response.data.message || '잘못된 요청입니다.',
      data: error.response.data,
    };
  } else if (status === 401) {
    return {
      success: false,
      message: '인증이 필요합니다. 다시 로그인해주세요.',
    };
  } else if (status === 403) {
    return {
      success: false,
      message: '접근 권한이 없습니다.',
    };
  } else if (status === 404) {
    return {
      success: false,
      message: '요청하신 정보를 찾을 수 없습니다.',
    };
  } else if (status >= 500) {
    return {
      success: false,
      message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    };
  }
  
  return {
    success: false,
    message: error.response.data.message || '알 수 없는 오류가 발생했습니다.',
    data: error.response.data,
  };
};

export default apiClient; 