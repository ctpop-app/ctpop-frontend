/**
 * API 통신 관련 로직
 * 모든 API 엔드포인트와 통신 로직을 중앙에서 관리합니다.
 */

import { db, auth, storage } from '../firebase';
import { API_ENDPOINTS } from './constants';
import { 
  collection, 
  query, 
  where, 
  limit, 
  getDocs, 
  addDoc, 
  doc, 
  getDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getUTCTimestamp } from '../utils/dateUtils';

/**
 * API 응답 형식
 * @template T
 * @typedef {Object} ApiResponse
 * @property {boolean} success - API 호출 성공 여부
 * @property {T} [data] - 성공 시 반환되는 데이터
 * @property {string} [error] - 실패 시 에러 메시지
 */

/**
 * API 에러 처리
 * @param {Error} error - 발생한 에러
 * @returns {ApiResponse<null>} 에러 응답
 */
const handleApiError = (error) => {
  console.error('API Error:', error);
  return {
    success: false,
    error: error.message || '알 수 없는 오류가 발생했습니다.'
  };
};

/**
 * 알림 관련 API
 */
export const notificationApi = {
  /**
   * 알림 목록 조회
   * @param {string} userId - 사용자 ID
   * @returns {Promise<ApiResponse<Array>>}
   */
  async getNotifications(userId) {
    try {
      const querySnapshot = await db
        .collection(API_ENDPOINTS.NOTIFICATIONS)
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();

      return {
        success: true,
        data: querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      };
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// API 모듈 export
export { profile } from './profile';
export { chat } from './chat';
export { auth } from './auth';
export { user } from './user';
export { client } from './client';

// 상수 및 유틸리티 export
export { handleApiError } from './utils/errorHandler'; 