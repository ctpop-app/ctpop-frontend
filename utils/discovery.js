import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 서버 IP 저장용 키
const SERVER_IP_KEY = 'server_ip_address';
const SERVER_PORT = '8080';

// 알려진 IP 목록 (개발자 컴퓨터들의 IP와 일반적인 로컬 주소)
const KNOWN_IPS = [
  '172.30.1.26',   // 카페 IP
  '192.168.0.7',   // 현재 개발 환경
  '192.168.1.5',   // 다른 가능한 환경
  '10.0.2.2',      // 안드로이드 에뮬레이터용
  'localhost',     // 로컬 개발용
  '127.0.0.1'      // 로컬호스트 대체
];

/**
 * 알려진 IP 목록에서 서버를 자동으로 검색
 * @returns {Promise<string|null>} 발견된 서버의 API URL 또는 null
 */
export const discoverServer = async () => {
  console.log('서버 디스커버리 시작...');
  
  // 1. 저장된 IP가 있는지 확인하고 테스트
  const savedIp = await AsyncStorage.getItem(SERVER_IP_KEY);
  if (savedIp) {
    console.log(`저장된 서버 IP 테스트 중: ${savedIp}`);
    const isValid = await testServerConnection(savedIp);
    if (isValid) {
      console.log(`저장된 서버가 응답합니다: ${savedIp}`);
      return `http://${savedIp}:${SERVER_PORT}/api`;
    }
    console.log(`저장된 서버가 응답하지 않습니다. 다른 서버 검색 중...`);
  }
  
  // 2. 알려진 IP 목록 순회하며 테스트
  for (const ip of KNOWN_IPS) {
    console.log(`서버 검색 중: ${ip}`);
    const isValid = await testServerConnection(ip);
    if (isValid) {
      console.log(`서버 발견: ${ip}`);
      // 발견된 IP 저장
      await AsyncStorage.setItem(SERVER_IP_KEY, ip);
      return `http://${ip}:${SERVER_PORT}/api`;
    }
  }
  
  console.log('서버를 찾을 수 없습니다.');
  return null; // 서버를 찾지 못함
};

/**
 * 특정 IP에서 서버가 실행 중인지 테스트
 * @param {string} ip 테스트할 IP 주소
 * @returns {Promise<boolean>} 서버 응답 여부
 */
const testServerConnection = async (ip) => {
  try {
    // Echo API 테스트
    const response = await axios.get(`http://${ip}:${SERVER_PORT}/api/auth/echo?message=test`, {
      timeout: 2000 // 2초 타임아웃
    });
    
    // 서버가 올바르게 응답하는지 확인
    return response.status === 200 && response.data.echo === 'test';
  } catch (error) {
    // 오류 발생 시 연결 실패로 처리
    return false;
  }
};

/**
 * 서버 IP를 수동으로 설정
 * @param {string} ip 설정할 IP 주소
 */
export const setServerIp = async (ip) => {
  await AsyncStorage.setItem(SERVER_IP_KEY, ip);
  console.log(`서버 IP가 수동으로 설정됨: ${ip}`);
};

/**
 * 저장된 서버 IP 초기화
 */
export const resetServerIp = async () => {
  await AsyncStorage.removeItem(SERVER_IP_KEY);
  console.log('서버 IP 설정이 초기화됨');
}; 