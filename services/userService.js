/**
 * 사용자 서비스
 * 사용자 관련 비즈니스 로직을 처리합니다.
 * API 호출은 api/index.js의 userApi를 사용합니다.
 */

import { user as userApi } from '../api';

export const userService = {
  /**
   * 사용자 생성
   * @param {string} uuid - 사용자 UUID
   * @returns {Promise<Object>}
   */
  async createUser(uuid) {
    const response = await userApi.createUser(uuid);
    if (!response.success) {
      throw new Error(response.error);
    }
    return response.data;
  },

  /**
   * 사용자 정보 조회
   * @param {string} uuid - 사용자 UUID
   * @returns {Promise<Object>}
   */
  async getUser(uuid) {
    const response = await userApi.getUser(uuid);
    if (!response.success) {
      throw new Error(response.error);
    }
    return response.data;
  }
}; 