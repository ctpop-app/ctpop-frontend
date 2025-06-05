import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// 서버 IP 저장용 키
const SERVER_IP_KEY = 'server_ip_address';
const SERVER_PORT = '8080';

// 기본 IP 목록
const DEFAULT_IPS = [
  '10.0.2.2',      // 안드로이드 에뮬레이터용
  'localhost',     // 로컬 개발용
  '127.0.0.1',      // 로컬호스트 대체
  '192.168.0.7',
  '172.30.1.98',
  '192.168.219.154'
];

// IP 목록 저장용 키
const KNOWN_IPS_KEY = 'known_server_ips';

/**
 * 알려진 IP 목록을 가져옵니다.
 * @returns {Promise<string[]>} IP 목록
 */
const getKnownIps = async () => {
  try {
    const savedIps = await AsyncStorage.getItem(KNOWN_IPS_KEY);
    return savedIps ? JSON.parse(savedIps) : DEFAULT_IPS;
  } catch (error) {
    console.error('저장된 IP 목록 조회 실패:', error);
    return DEFAULT_IPS;
  }
};

/**
 * 알려진 IP 목록을 저장합니다.
 * @param {string[]} ips 저장할 IP 목록
 */
const saveKnownIps = async (ips) => {
  try {
    await AsyncStorage.setItem(KNOWN_IPS_KEY, JSON.stringify(ips));
  } catch (error) {
    console.error('IP 목록 저장 실패:', error);
  }
};

/**
 * 새로운 IP를 알려진 목록에 추가합니다.
 * @param {string} ip 추가할 IP
 */
const addKnownIp = async (ip) => {
  try {
    const currentIps = await getKnownIps();
    if (!currentIps.includes(ip)) {
      currentIps.push(ip);
      await saveKnownIps(currentIps);
    }
  } catch (error) {
    console.error('IP 추가 실패:', error);
  }
};

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
  
  // 2. 알려진 IP 목록 가져오기
  const knownIps = await getKnownIps();
  
  // 3. 알려진 IP 목록 순회하며 테스트
  for (const ip of knownIps) {
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
  await addKnownIp(ip);
  console.log(`서버 IP가 수동으로 설정됨: ${ip}`);
};

/**
 * 저장된 서버 IP 초기화
 */
export const resetServerIp = async () => {
  await AsyncStorage.removeItem(SERVER_IP_KEY);
  console.log('서버 IP 설정이 초기화됨');
}; 