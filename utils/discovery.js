import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// 서버 IP 저장용 키
const SERVER_IP_KEY = 'server_ip_address';
const SERVER_PORT = '8080';

// 기본 IP 목록
const DEFAULT_IPS = [
  '192.168.3.58',
  '172.30.2.59'
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
      return `http://${savedIp}:${SERVER_PORT}`;
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

      // 발견된 IP를 AsyncStorage에 저장 (성공한 IP로 업데이트)
      await AsyncStorage.setItem(SERVER_IP_KEY, ip);
      console.log(`성공한 IP 저장됨: ${ip}`);

      return `http://${ip}:${SERVER_PORT}`;
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
    const testUrl = `http://${ip}:${SERVER_PORT}/test/echo?message=test`;
    console.log(`서버 연결 테스트 중: ${testUrl}`);
    
    // Echo API 테스트
    const response = await axios.get(testUrl, {
      timeout: 2000 // 2초 타임아웃
    });
    
    console.log('서버 응답:', response.data);
    // 서버가 올바르게 응답하는지 확인 (문자열 응답 처리)
    return response.status === 200 && response.data === 'test';
  } catch (error) {
    // 오류 발생 시 연결 실패로 처리
    console.error(`서버 연결 테스트 실패 (${ip}):`, error.message);
    if (error.response) {
      console.error('응답 데이터:', error.response.data);
      console.error('응답 상태:', error.response.status);
    }
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

/**
 * 두 지점 간의 거리 계산 (Haversine 공식)
 * @param {number} lat1 첫 번째 지점의 위도
 * @param {number} lon1 첫 번째 지점의 경도
 * @param {number} lat2 두 번째 지점의 위도
 * @param {number} lon2 두 번째 지점의 경도
 * @returns {number} 거리 (미터)
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // 지구 반지름 (미터)
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // 미터 단위
};

/**
 * 거리를 사람이 읽기 쉬운 형태로 변환
 * @param {number} distance 거리 (미터)
 * @returns {string} 포맷된 거리 문자열
 */
export const formatDistance = (distance) => {
  if (distance < 1000) {
    return `${Math.round(distance)}m`;
  } else {
    return `${(distance / 1000).toFixed(1)}km`;
  }
};
