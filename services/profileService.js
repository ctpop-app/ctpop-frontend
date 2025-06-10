/**
 * 프로필 서비스
 * 프로필 관련 비즈니스 로직을 처리합니다.
 * API 호출은 api/profile.js의 profile 모듈과 api/user.js의 user 모듈을 사용합니다.
 */

import { profileApi } from '../api/profile';
import { Profile } from '../models/Profile';
import { getCurrentKST } from '../utils/dateUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_KEYS } from '../utils/constants';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

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
   * 닉네임 중복 검사
   * @param {string} nickname 검사할 닉네임
   * @param {string} [excludeUuid] 제외할 사용자의 UUID (수정 시 사용)
   * @returns {Promise<boolean>} 중복 여부 (true: 중복됨, false: 중복되지 않음)
   */
  async isNicknameDuplicate(nickname, excludeUuid = null) {
    try {
      const profilesRef = collection(db, 'profiles');
      let q = query(profilesRef, where('nickname', '==', nickname));
      
      // 수정 시 현재 사용자의 닉네임은 중복 검사에서 제외
      if (excludeUuid) {
        q = query(q, where('uuid', '!=', excludeUuid));
      }

      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('닉네임 중복 검사 중 오류:', error);
      throw error;
    }
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
   * 프로필 생성
   * @param {string} uuid - 사용자 UUID
   * @param {Object} data - 프로필 데이터
   * @returns {Promise<Profile>}
   */
  async create(uuid, data) {
    try {
      // 닉네임 중복 검사
      const isDuplicate = await this.isNicknameDuplicate(data.nickname);
      if (isDuplicate) {
        throw new Error('이미 사용 중인 닉네임입니다.');
      }

      const profile = new Profile({
        ...data,
        uuid,
        createdAt: getCurrentKST(),
        updatedAt: getCurrentKST(),
        isActive: true
      });

      // 프로필 유효성 검사
      const validationErrors = profile.validate();
      if (validationErrors) {
        throw new Error(JSON.stringify(validationErrors));
      }

      return await profileApi.create(profile.toFirestore());
    } catch (error) {
      console.error('프로필 생성 중 오류:', error);
      throw error;
    }
  },

  /**
   * 프로필 수정
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

    // 닉네임이 변경되는 경우 중복 검사
    if (data.nickname && data.nickname !== existing.nickname) {
      const isDuplicate = await this.isNicknameDuplicate(data.nickname, uuid);
      if (isDuplicate) {
        throw new Error('이미 사용 중인 닉네임입니다.');
      }
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
   * 회원 탈퇴
   * @param {string} uuid - 사용자 UUID
   * @returns {Promise<Object>} - 성공 여부와 메시지가 포함된 객체
   */
  async withdraw(uuid) {
    try {
      // 1. 프로필 비활성화
      const existing = await this.getProfile(uuid);
      if (!existing) {
        throw new Error('프로필을 찾을 수 없습니다.');
      }

      const updateData = {
        isActive: false,
        updatedAt: getCurrentKST(),
        lastActive: getCurrentKST()
      };

      await profileApi.update(existing.id, updateData);

      // 2. AsyncStorage 데이터 삭제
      await AsyncStorage.removeItem(AUTH_KEYS.ACCESS_TOKEN);
      await AsyncStorage.removeItem(AUTH_KEYS.REFRESH_TOKEN);
      await AsyncStorage.removeItem(AUTH_KEYS.USER);
      await AsyncStorage.removeItem(AUTH_KEYS.PHONE_NUMBER);
      await AsyncStorage.removeItem('user-storage');

      return {
        success: true,
        message: '회원 탈퇴가 완료되었습니다.'
      };
    } catch (error) {
      console.error('회원 탈퇴 실패:', error);
      return {
        success: false,
        message: error.message || '회원 탈퇴 중 오류가 발생했습니다.'
      };
    }
  }
}; 