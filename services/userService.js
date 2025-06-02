/**
 * 사용자 서비스
 * 사용자 관련 비즈니스 로직을 처리합니다.
 * API 호출은 api/index.js의 userApi를 사용합니다.
 */

import { userApi } from '../api';

export const userService = {
  /**
   * 사용자 생성
   * @param {string} phoneNumber - 전화번호
   * @returns {Promise<Object>}
   */
  async createUser(phoneNumber) {
    const response = await userApi.createUser(phoneNumber);
    if (!response.success) {
      throw new Error(response.error);
    }
    return response.data;
  },

  /**
   * 사용자 조회
   * @param {string} phoneNumber - 전화번호
   * @returns {Promise<Object>}
   */
  async getUser(phoneNumber) {
    const response = await userApi.getUser(phoneNumber);
    if (!response.success) {
      throw new Error(response.error);
    }
    return response.data;
  },

  /**
   * 사용자 비활성화
   * @param {string} phoneNumber - 전화번호
   * @returns {Promise<void>}
   */
  async deactivateUser(phoneNumber) {
    const response = await userApi.deactivateUser(phoneNumber);
    if (!response.success) {
      throw new Error(response.error);
    }
  }
}; 