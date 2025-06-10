/**
 * 프로필 서비스
 * 프로필 관련 비즈니스 로직을 처리합니다.
 * API 호출은 api/profile.js의 profile 모듈과 api/user.js의 user 모듈을 사용합니다.
 */

import { profileApi } from '../api/profile';
import { Profile } from '../models/Profile';
import { getCurrentKST } from '../utils/dateUtils';

export const profileService = {
  /**
   * 프로필 존재 여부 확인
   * @param {string} uuid - 사용자 UUID
   * @returns {Promise<boolean>}
   */
  async checkProfileExists(uuid) {
    return await profileApi.exists(uuid);
  },

  /**
   * 프로필 생성
   * @param {string} uuid - 사용자 UUID
   * @param {Object} data - 프로필 데이터
   * @returns {Promise<Profile>}
   */
  async create(uuid, data) {
    console.log('profileService.create 시작 - uuid:', uuid);
    console.log('profileService.create - 받은 데이터:', data);

    const profile = new Profile({
      ...data,
      uuid,
      createdAt: getCurrentKST(),
      updatedAt: getCurrentKST(),
      isActive: true
    });
    console.log('Profile 객체 생성 완료:', profile);

    const errors = profile.validate();
    console.log('Profile 유효성 검사 결과:', errors);
    
    if (errors) {
      console.error('Profile 유효성 검사 실패:', errors);
      throw new Error(Object.values(errors).join(', '));
    }

    const firestoreData = profile.toFirestore();
    console.log('Firestore 데이터:', firestoreData);

    return await profileApi.create(firestoreData);
  },

  /**
   * 프로필 조회
   * @param {string} uuid - 사용자 UUID
   * @returns {Promise<Profile>}
   */
  async getProfile(uuid) {
    const doc = await profileApi.get(uuid);
    return doc ? Profile.fromFirestore(doc) : null;
  },

  /**
   * 프로필 업데이트
   * @param {string} uuid - 사용자 UUID
   * @param {Object} data - 업데이트할 데이터
   * @returns {Promise<Profile>}
   */
  async update(uuid, data) {
    console.log('profileService.update 시작 - uuid:', uuid);
    console.log('profileService.update - 받은 데이터:', data);

    const existing = await this.getProfile(uuid);
    if (!existing) {
      throw new Error('프로필을 찾을 수 없습니다.');
    }

    // 변경된 필드만 업데이트
    const updateData = {
      ...data,
      uuid,
      updatedAt: getCurrentKST()
    };
    
    // 유효성 검사는 변경된 필드만 수행
    const tempProfile = new Profile({
      ...existing,
      ...updateData
    });
    const errors = tempProfile.validate();
    
    if (errors) {
      console.error('Profile 유효성 검사 실패:', errors);
      throw new Error(Object.values(errors).join(', '));
    }

    console.log('업데이트 데이터:', updateData);
    return await profileApi.update(existing.id, updateData);
  },

  /**
   * 프로필 비활성화
   * @param {string} uuid - 사용자 UUID
   * @returns {Promise<void>}
   */
  async deactivateProfile(uuid) {
    const exists = await this.checkProfileExists(uuid);
    if (!exists) {
      throw new Error('프로필을 찾을 수 없습니다.');
    }

    return await this.update(uuid, { isActive: false });
  }
}; 