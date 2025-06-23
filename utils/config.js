// API 주소 설정 파일
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { discoverServer } from './discovery';

// 서버 IP 저장용 키
const SERVER_IP_KEY = 'server_ip_address';
const SERVER_PORT = '8080';

// 기본 설정값 (AWS EC2 인스턴스)
const DEFAULT_IP = '192.168.219.206';
const DEFAULT_PORT = SERVER_PORT;

// 개발 환경
const DEV = {
  // AWS EC2 인스턴스로 기본 API URL 설정
  API_URL: `http://${DEFAULT_IP}:${DEFAULT_PORT}`,
};

// 테스트 환경
const TEST = {
  API_URL: 'http://3.35.11.208:8080',
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
    // TEST 환경에서는 저장된 IP를 무시하고 AWS EC2 사용
    if (currentEnv === TEST) {
      console.log('TEST 환경: AWS EC2 서버 사용');
      return;
    }
    
    const savedIp = await getSavedServerIp();
    let isConnected = false;
    
    if (savedIp && savedIp !== DEFAULT_IP) {
      console.log(`저장된 IP로 연결 시도: ${savedIp}`);
      updateApiUrl(`http://${savedIp}:${SERVER_PORT}`);
      isConnected = await testServerConnection();
      
      if (isConnected) {
        console.log(`저장된 IP 연결 성공: ${savedIp}`);
        return;
      } else {
        console.log(`저장된 IP 연결 실패: ${savedIp}, discovery 시작`);
      }
    }
    
    // 저장된 IP로 연결이 안 되면 discovery로 탐색
    if (!isConnected) {
      console.log('discovery 서비스로 서버 검색 시작');
      const discoveredUrl = await discoverServer();
      
      if (discoveredUrl) {
        console.log(`discovery로 서버 발견: ${discoveredUrl}`);
        updateApiUrl(discoveredUrl);
      } else {
        console.log('discovery로도 서버를 찾을 수 없음');
        // 기본 IP로 fallback
        updateApiUrl(`http://${DEFAULT_IP}:${SERVER_PORT}`);
      }
    }
  } catch (error) {
    console.error('설정 초기화 실패:', error);
    // 에러 발생 시 기본 IP로 fallback
    updateApiUrl(`http://${DEFAULT_IP}:${SERVER_PORT}`);
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

/**
 * 현재 설정된 API URL로 서버 연결을 테스트합니다.
 * @returns {Promise<boolean>} 서버 응답 여부
 */
export const testServerConnection = async () => {
  try {
    const testUrl = `${config.API_URL}/test/echo?message=test`;
    console.log(`서버 연결 테스트 중: ${testUrl}`);
    
    // Echo API 테스트
    const response = await axios.get(testUrl, {
      timeout: 5000 // 5초 타임아웃
    });
    
    console.log('서버 응답:', response.data);
    // 서버가 올바르게 응답하는지 확인
    return response.status === 200 && response.data === 'test';
  } catch (error) {
    // 오류 발생 시 연결 실패로 처리
    console.error('서버 연결 테스트 실패:', error.message);
    if (error.response) {
      console.error('응답 데이터:', error.response.data);
      console.error('응답 상태:', error.response.status);
    }
    return false;
  }
};

export default config; 