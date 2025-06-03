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
   * @param {string} phoneNumber - 전화번호
   * @returns {Promise<boolean>}
   */
  async checkProfileExists(phoneNumber) {
    const response = await profile.checkProfileExists(phoneNumber);
    if (!response.success) {
      throw new Error(response.error);
    }
    return response.data;
  },

  /**
   * 프로필 생성
   * @param {string} phoneNumber - 전화번호
   * @param {Object} profileData - 프로필 데이터
   * @returns {Promise<Profile>}
   */
  async createProfile(phoneNumber, profileData) {
    // 사용자 확인
    const userResponse = await user.getUser(phoneNumber);
    if (!userResponse.success) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    // 프로필 생성
    const response = await profile.createProfile(phoneNumber, profileData);
    if (!response.success) {
      throw new Error(response.error);
    }
    return response.data;
  },

  /**
   * 프로필 조회
   * @param {string} profileId - 프로필 ID
   * @returns {Promise<Profile>}
   */
  async getProfile(profileId) {
    const response = await profile.getProfile(profileId);
    if (!response.success) {
      throw new Error(response.error);
    }
    return response.data;
  },

  /**
   * 프로필 업데이트
   * @param {string} profileId - 프로필 ID
   * @param {Object} updateData - 업데이트할 데이터
   * @returns {Promise<Profile>}
   */
  async updateProfile(profileId, updateData) {
    const response = await profile.updateProfile(profileId, updateData);
    if (!response.success) {
      throw new Error(response.error);
    }
    return response.data;
  },

  /**
   * 프로필 비활성화
   * @param {string} phoneNumber - 전화번호
   * @returns {Promise<void>}
   */
  async deactivateProfile(phoneNumber) {
    const response = await profile.deactivateProfile(phoneNumber);
    if (!response.success) {
      throw new Error(response.error);
    }
  }
}; 