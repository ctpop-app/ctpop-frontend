/**
 * API 관련 상수
 */

export const API_ENDPOINTS = {
  PROFILES: 'profiles',
  USERS: 'users',
  CHATS: 'chats',
  MESSAGES: 'messages',
  NOTIFICATIONS: 'notifications'
};

/**
 * API 응답 형식
 * @template T
 * @typedef {Object} ApiResponse
 * @property {boolean} success - API 호출 성공 여부
 * @property {T} [data] - 성공 시 반환되는 데이터
 * @property {string} [error] - 실패 시 에러 메시지
 */ 