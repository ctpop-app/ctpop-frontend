/**
 * 토크 서비스
 * 토크 관련 비즈니스 로직을 처리합니다.
 * API 호출은 api/talk.js의 talk 모듈을 사용합니다.
 */

import { talkApi } from '../api/talk';
import { Talk } from '../models/Talk';

// 토크 최대 길이 (Talk 모델과 일치시켜야 함)
const MAX_CONTENT_LENGTH = 100;

export const talkService = {
  /**
   * 내 활성 토크 조회
   * @param {string} uuid - 사용자 UUID
   * @returns {Promise<Talk|null>}
   */
  async getMyTalk(uuid) {
    try {
      const result = await talkApi.getMyTalk(uuid);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    } catch (error) {
      console.error('내 토크 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 토크 생성 (비즈니스 로직 포함)
   * @param {string} uuid - 사용자 UUID
   * @param {string} content - 토크 내용
   * @param {string} imageUri - 이미지 URI (선택사항)
   * @returns {Promise<Talk>}
   */
  async createTalk(uuid, content, imageUri = null) {
    console.log('=== talkService.createTalk 시작 ===');
    console.log('받은 파라미터:', { uuid, content, imageUri });
    
    try {
      // 1. 입력값 검증
      if (!content || !content.trim()) {
        throw new Error('토크 내용을 입력해주세요.');
      }

      if (content.length > MAX_CONTENT_LENGTH) {
        throw new Error(`토크는 ${MAX_CONTENT_LENGTH}자를 초과할 수 없습니다.`);
      }

      // 2. 토크 객체 생성 및 검증 (nickname 제거)
      const talk = Talk.create(uuid, content, null);
      console.log('생성된 Talk 객체:', talk);
      console.log('Talk.isValid() 결과:', talk.isValid());
      
      if (!talk.isValid()) {
        console.log('Talk 유효성 검사 실패 상세:');
        console.log('- uuid:', !!talk.uuid);
        console.log('- content:', !!talk.content);
        console.log('- content.trim().length:', talk.content.trim().length);
        throw new Error('토크가 유효하지 않습니다.');
      }

      // 3. API 호출 (nickname 제거)
      const result = await talkApi.createTalk(uuid, content, imageUri);
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    } catch (error) {
      console.error('토크 생성 실패:', error);
      throw error;
    }
  },

  /**
   * 토크 삭제 (비활성화)
   * @param {string} uuid - 사용자 UUID
   * @param {string} talkId - 토크 ID
   * @returns {Promise<boolean>}
   */
  async deleteTalk(uuid, talkId) {
    try {
      if (!talkId) {
        throw new Error('토크 ID가 필요합니다.');
      }

      const result = await talkApi.deleteTalk(uuid, talkId);
      if (!result.success) {
        throw new Error(result.error);
      }

      return true;
    } catch (error) {
      console.error('토크 삭제 실패:', error);
      throw error;
    }
  },

  /**
   * 전체 토크 피드 조회
   * @param {Object} params - 페이징 파라미터
   * @returns {Promise<Object>}
   */
  async getTalkFeed(params = {}) {
    try {
      const result = await talkApi.getAllTalks(params);
      if (!result.success) {
        throw new Error(result.error);
      }

      return {
        talks: result.data,
        hasMore: result.hasMore
      };
    } catch (error) {
      console.error('토크 피드 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 토크 피드 새로고침
   * @returns {Promise<Object>}
   */
  async refreshTalkFeed() {
    try {
      return await this.getTalkFeed({ limit: 50 });
    } catch (error) {
      console.error('토크 피드 새로고침 실패:', error);
      throw error;
    }
  },

  /**
   * 토크 피드 더보기
   * @param {Talk} lastTalk - 마지막 토크
   * @returns {Promise<Object>}
   */
  async loadMoreTalks(lastTalk) {
    try {
      if (!lastTalk) {
        throw new Error('마지막 토크 정보가 필요합니다.');
      }

      return await this.getTalkFeed({ 
        limit: 50, 
        lastTalk 
      });
    } catch (error) {
      console.error('토크 더보기 실패:', error);
      throw error;
    }
  },

  /**
   * 토크 유효성 검사
   * @param {string} content - 토크 내용
   * @returns {Object} - 검사 결과
   */
  validateTalkContent(content) {
    const errors = [];

    if (!content || !content.trim()) {
      errors.push('토크 내용을 입력해주세요.');
    }

    if (content && content.length > MAX_CONTENT_LENGTH) {
      errors.push(`토크는 ${MAX_CONTENT_LENGTH}자를 초과할 수 없습니다.`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * 토크 길이 정보
   * @returns {Object}
   */
  getTalkLengthInfo() {
    return {
      maxLength: MAX_CONTENT_LENGTH,
      currentLength: 0
    };
  }
}; 