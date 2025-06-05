/**
 * 프로필 서비스
 * 프로필 관련 비즈니스 로직을 처리합니다.
 * API 호출은 api/profile.js의 profile 모듈과 api/user.js의 user 모듈을 사용합니다.
 */

import { profile, user } from '../api';
import { Profile } from '../models/Profile';

export const profileService = {
  /**
   * 프로필 존재 여부 확인
   * @param {string} uuid - 사용자 UUID
   * @returns {Promise<boolean>}
   */
  async checkProfileExists(uuid) {
    const response = await profile.checkProfileExists(uuid);
    if (!response.success) {
      throw new Error(response.error);
    }
    return response.data;
  },

  /**
   * 프로필 생성
   * @param {string} uuid - 사용자 UUID
   * @param {Object} profileData - 프로필 데이터
   * @returns {Promise<Profile>}
   */
  async createProfile(uuid, profileData) {
    // 사용자 확인
    const userResponse = await user.getUser(uuid);
    if (!userResponse.success) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    // 프로필 생성
    const response = await profile.createProfile(uuid, profileData);
    if (!response.success) {
      throw new Error(response.error);
    }
    return response.data;
  },

  /**
   * 프로필 조회
   * @param {string} uuid - 사용자 UUID
   * @returns {Promise<Profile>}
   */
  async getProfile(uuid) {
    const response = await profile.getProfile(uuid);
    if (!response.success) {
      throw new Error(response.error);
    }
    return response.data;
  },

  /**
   * 프로필 업데이트
   * @param {string} uuid - 사용자 UUID
   * @param {Object} updateData - 업데이트할 데이터
   * @returns {Promise<Profile>}
   */
  async updateProfile(uuid, updateData) {
    const response = await profile.updateProfile(uuid, updateData);
    if (!response.success) {
      throw new Error(response.error);
    }
    return response.data;
  },

  /**
   * 프로필 비활성화
   * @param {string} uuid - 사용자 UUID
   * @returns {Promise<void>}
   */
  async deactivateProfile(uuid) {
    const response = await profile.deactivateProfile(uuid);
    if (!response.success) {
      throw new Error(response.error);
    }
  }
}; 