/**
 * 프로필 서비스
 * 프로필 관련 비즈니스 로직을 처리합니다.
 * API 호출은 api/profile.js의 profile 모듈과 api/user.js의 user 모듈을 사용합니다.
 */

import { profile } from '../api';
import { Profile } from '../models/Profile';
import { formatDate, getCurrentKST } from '../utils/dateUtils';

export const profileService = {
  /**
   * 프로필 존재 여부 확인
   * @param {string} uuid - 사용자 UUID
   * @returns {Promise<boolean>}
   */
  async checkProfileExists(uuid) {
    if (!uuid) {
      throw new Error('사용자 ID가 필요합니다.');
    }

    try {
      return await profile.checkProfileExists(uuid);
    } catch (error) {
      console.error('프로필 존재 여부 확인 실패:', error);
      throw error;
    }
  },

  /**
   * 프로필 생성
   * @param {string} uuid - 사용자 UUID
   * @param {Object} profileData - 프로필 데이터
   * @returns {Promise<Profile>}
   */
  async createProfile(uuid, profileData) {
    if (!uuid) {
      throw new Error('사용자 ID가 필요합니다.');
    }

    try {
      // 프로필 데이터 검증
      const profileInstance = new Profile({
        ...profileData,
        uuid,
        createdAt: formatDate(getCurrentKST()),
        updatedAt: formatDate(getCurrentKST())
      });

      const errors = profileInstance.validate();
      if (errors) {
        throw new Error(Object.values(errors).join('\n'));
      }

      return await profile.createProfile(profileInstance);
    } catch (error) {
      console.error('프로필 생성 실패:', error);
      throw error;
    }
  },

  /**
   * 프로필 조회
   * @param {string} uuid - 사용자 UUID
   * @returns {Promise<Profile>}
   */
  async getProfile(uuid) {
    if (!uuid) {
      throw new Error('사용자 ID가 필요합니다.');
    }

    try {
      return await profile.getProfile(uuid);
    } catch (error) {
      console.error('프로필 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 프로필 업데이트
   * @param {string} uuid - 사용자 UUID
   * @param {Object} updateData - 업데이트할 데이터
   * @returns {Promise<Profile>}
   */
  async updateProfile(uuid, updateData) {
    if (!uuid) {
      throw new Error('사용자 ID가 필요합니다.');
    }

    try {
      // 1. 기존 프로필 조회
      const existingProfile = await this.getProfile(uuid);
      if (!existingProfile) {
        throw new Error('프로필을 찾을 수 없습니다.');
      }

      // 2. 업데이트 데이터 검증
      const updatedProfile = new Profile({
        ...existingProfile,
        ...updateData,
        uuid,
        updatedAt: formatDate(getCurrentKST())
      });

      const errors = updatedProfile.validate();
      if (errors) {
        throw new Error(Object.values(errors).join('\n'));
      }

      // 3. 프로필 업데이트
      return await profile.updateProfile(updatedProfile);
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      throw error;
    }
  },

  /**
   * 프로필 비활성화
   * @param {string} uuid - 사용자 UUID
   * @returns {Promise<void>}
   */
  async deactivateProfile(uuid) {
    if (!uuid) {
      throw new Error('사용자 ID가 필요합니다.');
    }

    // 1. 프로필 존재 확인
    const exists = await this.checkProfileExists(uuid);
    if (!exists) {
      throw new Error('프로필을 찾을 수 없습니다.');
    }

    // 2. 프로필 비활성화
    await profile.deactivateProfile(uuid);
  },

  /**
   * 프로필 사진 업로드
   * @param {string} uuid - 사용자 UUID
   * @param {Array<Object>} photos - 업로드할 사진 배열
   * @returns {Promise<Profile>}
   */
  async uploadPhotos(uuid, photos) {
    if (!uuid) {
      throw new Error('사용자 ID가 필요합니다.');
    }

    // 1. 프로필 존재 확인
    const exists = await this.checkProfileExists(uuid);
    if (!exists) {
      throw new Error('프로필을 찾을 수 없습니다.');
    }

    // 2. 사진 업로드
    const photoUrls = await profile.uploadPhotos(uuid, photos);

    // 3. 프로필 업데이트
    if (photoUrls.length > 0) {
      const existingProfile = await this.getProfile(uuid);
      const updatedProfile = new Profile({
        ...existingProfile,
        photoURLs: photoUrls,
        mainPhotoURL: photoUrls[0],
        updatedAt: formatDate(getCurrentKST())
      });

      const errors = updatedProfile.validate();
      if (errors) {
        throw new Error(Object.values(errors).join('\n'));
      }

      return await this.updateProfile(uuid, updatedProfile);
    }

    return photoUrls;
  }
}; 