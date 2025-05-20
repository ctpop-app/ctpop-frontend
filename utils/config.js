// API 주소 설정 파일
import { Platform } from 'react-native';

// 기본 설정값 (서버를 찾지 못했을 때 폴백으로 사용)
const DEFAULT_IP = '192.168.0.7';
const DEFAULT_PORT = '8080';

// 개발 환경
const DEV = {
  // 기본 API URL (디스커버리 서비스로 업데이트될 예정)
  API_URL: `http://${DEFAULT_IP}:${DEFAULT_PORT}/api`,
};

// 테스트 환경
const TEST = {
  API_URL: 'https://test-api.ctpop.com/api',
};

// 배포 환경
const PROD = {
  API_URL: 'https://api.ctpop.com/api',
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
};

export default config; 