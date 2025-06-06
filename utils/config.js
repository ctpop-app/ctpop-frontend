// API 주소 설정 파일
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 서버 IP 저장용 키
const SERVER_IP_KEY = 'server_ip_address';
const SERVER_PORT = '8080';

// 기본 설정값 (서버를 찾지 못했을 때 폴백으로 사용)
const DEFAULT_IP = '172.30.1.1';
const DEFAULT_PORT = SERVER_PORT;

// 개발 환경
const DEV = {
  // 기본 API URL (디스커버리 서비스로 업데이트될 예정)
  API_URL: `http://${DEFAULT_IP}:${DEFAULT_PORT}`,
};

// 테스트 환경
const TEST = {
  API_URL: 'https://test-api.ctpop.com',
};

// 배포 환경
const PROD = {
  API_URL: 'https://api.ctpop.com',
};

// 현재 사용할 환경 설정 (DEV, TEST, PROD 중 선택)
const currentEnv = DEV;

// 설정 객체
const config = {
  API_URL: currentEnv.API_URL,
  AUTH_API_URL: `${currentEnv.API_URL}/auth`,
  USER_API_URL: `${currentEnv.API_URL}/users`,
  CHAT_API_URL: `${currentEnv.API_URL}/chats`,
};

/**
 * 저장된 서버 IP를 가져옵니다.
 * @returns {Promise<string>} 서버 IP
 */
const getSavedServerIp = async () => {
  try {
    return await AsyncStorage.getItem(SERVER_IP_KEY) || DEFAULT_IP;
  } catch (error) {
    console.error('저장된 서버 IP 조회 실패:', error);
    return DEFAULT_IP;
  }
};

/**
 * 초기 설정을 로드합니다.
 */
export const initializeConfig = async () => {
  try {
    const savedIp = await getSavedServerIp();
    if (savedIp && savedIp !== DEFAULT_IP) {
      updateApiUrl(`http://${savedIp}:${SERVER_PORT}`);
    }
  } catch (error) {
    console.error('설정 초기화 실패:', error);
  }
};

/**
 * 디스커버리 서비스를 사용하여 API URL 업데이트
 * @param {string} apiUrl 새로운 API URL
 */
export const updateApiUrl = (apiUrl) => {
  if (!apiUrl) return;
  
  config.API_URL = apiUrl;
  config.AUTH_API_URL = `${apiUrl}/auth`;
  config.USER_API_URL = `${apiUrl}/users`;
  config.CHAT_API_URL = `${apiUrl}/chats`;
  
  console.log('API URL이 업데이트됨:', apiUrl);
  
  // apiClient의 baseURL도 함께 업데이트하기 위해 이벤트를 발생시킴
  setTimeout(() => {
    try {
      const { updateBaseUrl } = require('../api/client');
      if (typeof updateBaseUrl === 'function') {
        updateBaseUrl(apiUrl);
      }
    } catch (err) {
      console.error('apiClient baseURL 업데이트 실패:', err);
    }
  }, 0);
};

export default config; 