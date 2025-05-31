import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  limit, 
  orderBy,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  addDoc,
  startAfter,
  endBefore,
  Timestamp,
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore';
import { db } from '../firebase';
import { Profile } from '../models/Profile';
import { encryptPhoneNumber, decryptPhoneNumber } from '../utils/encryption';
import { userService } from './userService';

// 프로필 컬렉션 참조
const PROFILES_COLLECTION = 'profiles';
const profilesRef = collection(db, PROFILES_COLLECTION);

// 한국 시간으로 변환하는 함수
const getKoreanTime = () => {
  const now = new Date();
  const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
  return koreanTime;
};

/**
 * 프로필 서비스 - Firestore 기반 프로필 데이터 관리
 */
export const profileService = {
  /**
   * 사용자 전화번호로 프로필이 존재하는지 확인합니다.
   * @param {string} phoneNumber - 사용자 전화번호
   * @returns {Promise<Object>} - 성공 여부와 프로필 존재 여부
   */
  async checkProfileExists(phoneNumber) {
    try {
      console.log('Firestore에서 프로필 확인 중:', phoneNumber);
      
      // uid로 프로필 조회
      const encryptedPhone = encryptPhoneNumber(phoneNumber);
      const q = query(profilesRef, where('phoneNumber', '==', encryptedPhone), where('isActive', '==', true), limit(1));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const profileData = Profile.fromFirestore(querySnapshot.docs[0]);
        console.log('프로필이 존재합니다:', profileData);
        return { 
          success: true, 
          exists: true,
          data: profileData
        };
      } else {
        console.log('프로필이 존재하지 않습니다');
        return { 
          success: true, 
          exists: false 
        };
      }
    } catch (error) {
      console.error('프로필 확인 오류:', error);
      return { 
        success: false, 
        exists: false,
        error: error.message 
      };
    }
  },

  /**
   * 사용자 ID로 프로필 조회
   * @param {string} uid 사용자 ID (전화번호 또는 Firebase Auth UID)
   * @returns {Promise<Profile|null>} 프로필 객체 또는 null
   */
  async getProfileByUid(uid) {
    try {
      const encryptedPhone = encryptPhoneNumber(uid);
      const q = query(
        profilesRef,
        where('phoneNumber', '==', encryptedPhone),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return Profile.fromFirestore(doc);
    } catch (error) {
      console.error('Error getting profile by uid:', error);
      throw error;
    }
  },
  
  /**
   * 프로필 ID로 프로필 조회
   * @param {string} profileId 프로필 ID (Firestore 문서 ID)
   * @returns {Promise<Profile|null>} 프로필 객체 또는 null
   */
  async getProfileById(profileId) {
    try {
      const docRef = doc(db, PROFILES_COLLECTION, profileId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) return null;
      
      return Profile.fromFirestore(docSnap);
    } catch (error) {
      console.error('프로필 조회 실패:', error);
      throw error;
    }
  },
  
  /**
   * 프로필 생성
   * @param {string} phoneNumber 전화번호
   * @param {Object} profileData 프로필 데이터
   * @returns {Promise<Profile>} 생성된 프로필
   */
  async createProfile(phoneNumber, profileData) {
    try {
      // 사용자 정보 조회
      const user = await userService.getUser(phoneNumber);
      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      const now = getKoreanTime();
      const profile = new Profile({
        ...profileData,
        uid: user.uuid, // UUID를 사용
        createdAt: now,
        updatedAt: now,
        lastActive: now,
        isActive: true
      });

      const profileRef = doc(db, PROFILES_COLLECTION, user.uuid);
      await setDoc(profileRef, profile.toFirestore());
      return profile;
    } catch (error) {
      console.error('프로필 생성 실패:', error);
      throw error;
    }
  },
  
  /**
   * 프로필 조회
   * @param {string} phoneNumber 전화번호
   * @returns {Promise<Profile|null>} 프로필 객체 또는 null
   */
  async getProfile(phoneNumber) {
    try {
      const user = await userService.getUser(phoneNumber);
      if (!user) return null;

      const profileRef = doc(db, PROFILES_COLLECTION, user.uuid);
      const profileSnap = await getDoc(profileRef);
      
      if (!profileSnap.exists()) return null;
      
      return Profile.fromFirestore(profileSnap);
    } catch (error) {
      console.error('프로필 조회 실패:', error);
      throw error;
    }
  },
  
  /**
   * 프로필 업데이트
   * @param {string} phoneNumber 전화번호
   * @param {Object} updateData 업데이트할 데이터
   * @returns {Promise<Profile>} 업데이트된 프로필
   */
  async updateProfile(phoneNumber, updateData) {
    try {
      const user = await userService.getUser(phoneNumber);
      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      const profileRef = doc(db, PROFILES_COLLECTION, user.uuid);
      const now = getKoreanTime();

      await updateDoc(profileRef, {
        ...updateData,
        updatedAt: now,
        lastActive: now
      });

      const updatedSnap = await getDoc(profileRef);
      return Profile.fromFirestore(updatedSnap);
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      throw error;
    }
  },
  
  /**
   * 프로필 삭제
   * @param {string} profileId 삭제할 프로필 ID
   * @returns {Promise<void>}
   */
  async deleteProfile(profileId) {
    try {
      const docRef = doc(db, PROFILES_COLLECTION, profileId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('프로필 삭제 실패:', error);
      throw error;
    }
  },
  
  /**
   * 프로필 목록 조회 (페이지네이션)
   * @param {Object} options 조회 옵션
   * @param {number} options.pageSize 페이지당 항목 수
   * @param {string} options.lastVisible 마지막으로 본 문서 ID (페이지네이션)
   * @param {Object} options.filters 필터 조건 (예: { gender: 'male' })
   * @returns {Promise<Array<Profile>>} 프로필 목록
   */
  async getProfiles({ pageSize = 10, lastVisible = null, filters = {} }) {
    try {
      let q = query(
        profilesRef,
        where('isActive', '==', true),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );
      
      // 필터 조건 추가
      Object.entries(filters).forEach(([field, value]) => {
        if (value !== undefined && value !== null) {
          q = query(q, where(field, '==', value));
        }
      });
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => Profile.fromFirestore(doc));
    } catch (error) {
      console.error('프로필 목록 조회 실패:', error);
      throw error;
    }
  },
  
  /**
   * 더미 프로필 생성 (테스트용)
   * @param {number} count 생성할 프로필 수
   * @returns {Promise<Array<Profile>>} 생성된 프로필 목록
   */
  async createDummyProfiles(count = 10) {
    try {
      const orientations = ['트젠', '시디', '러버'];
      const locations = [
        '서울', '부산', '인천', '대구', 
        '광주', '대전', '울산', '세종',
        '경기', '강원', '충북', '충남', 
        '전북', '전남', '경북', '경남', '제주'
      ];
      
      const profiles = [];
      
      for (let i = 0; i < count; i++) {
        const orientation = orientations[Math.floor(Math.random() * orientations.length)];
        const location = locations[Math.floor(Math.random() * locations.length)];
        // 키는 150-190 사이
        const height = Math.floor(Math.random() * 41) + 150;
        // 몸무게는 45-90 사이
        const weight = Math.floor(Math.random() * 46) + 45;
        
        const profile = new Profile({
          uid: `dummy_${i + 1}`,
          nickname: `테스트유저${i + 1}`,
          age: Math.floor(Math.random() * 30) + 18, // 18-47세
          height,
          weight,
          location,
          orientation,
          bio: `안녕하세요! 저는 ${location}에 사는 테스트 프로필 ${i+1}입니다. 잘 부탁드려요!`,
          mainPhotoURL: `https://picsum.photos/id/${(i % 100) + 1}/300/300`, // 대표 이미지
          photoURLs: [
            `https://picsum.photos/id/${((i+1) % 100) + 1}/300/300`,
            `https://picsum.photos/id/${((i+2) % 100) + 1}/300/300`,
            `https://picsum.photos/id/${((i+3) % 100) + 1}/300/300`,
          ], // 추가 이미지
          isActive: Math.random() > 0.2, // 80%는 활성 상태
        });
        
        const created = await this.createProfile(profile.phoneNumber, profile);
        profiles.push(created);
      }
      
      return profiles;
    } catch (error) {
      console.error('더미 프로필 생성 실패:', error);
      throw error;
    }
  },

  /**
   * 프로필 검색 (닉네임, 자기소개 등)
   * @param {string} searchTerm 검색어
   * @param {Object} options 검색 옵션
   * @returns {Promise<Array<Profile>>} 검색된 프로필 목록
   */
  async searchProfiles(searchTerm, options = {}) {
    try {
      const { pageSize = 20, lastVisible = null } = options;
      
      // 검색어를 소문자로 변환
      const searchLower = searchTerm.toLowerCase();
      
      // 프로필 조회 (활성 프로필만)
      let q = query(
        profilesRef,
        where('isActive', '==', true),
        orderBy('nickname'),
        limit(pageSize)
      );
      
      if (lastVisible) {
        q = query(q, startAfter(lastVisible));
      }
      
      const querySnapshot = await getDocs(q);
      
      // 클라이언트 측에서 검색어 필터링
      return querySnapshot.docs
        .map(doc => Profile.fromFirestore(doc))
        .filter(profile => 
          profile.nickname.toLowerCase().includes(searchLower) ||
          (profile.bio && profile.bio.toLowerCase().includes(searchLower))
        );
    } catch (error) {
      console.error('프로필 검색 실패:', error);
      throw error;
    }
  },

  /**
   * 프로필 필터링 (고급 검색)
   * @param {Object} filters 필터 조건
   * @param {Object} options 검색 옵션
   * @returns {Promise<Array<Profile>>} 필터링된 프로필 목록
   */
  async filterProfiles(filters = {}, options = {}) {
    try {
      const { pageSize = 20, lastVisible = null, sortBy = 'createdAt', sortOrder = 'desc' } = options;
      
      let q = query(
        profilesRef,
        orderBy(sortBy, sortOrder),
        limit(pageSize)
      );
      
      // 필터 조건 추가
      Object.entries(filters).forEach(([field, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            // 배열 값은 'in' 연산자 사용
            q = query(q, where(field, 'in', value));
          } else if (typeof value === 'object' && value.min !== undefined) {
            // 범위 검색
            q = query(q, where(field, '>=', value.min));
            if (value.max !== undefined) {
              q = query(q, where(field, '<=', value.max));
            }
          } else {
            // 일반 동등 비교
            q = query(q, where(field, '==', value));
          }
        }
      });
      
      if (lastVisible) {
        q = query(q, startAfter(lastVisible));
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => Profile.fromFirestore(doc));
    } catch (error) {
      console.error('프로필 필터링 실패:', error);
      throw error;
    }
  },

  /**
   * 프로필 좋아요/관심 표시
   * @param {string} profileId 프로필 ID
   * @param {string} userId 사용자 ID
   * @returns {Promise<void>}
   */
  async likeProfile(profileId, userId) {
    try {
      const docRef = doc(db, PROFILES_COLLECTION, profileId);
      await updateDoc(docRef, {
        likedBy: arrayUnion(userId),
        likeCount: increment(1)
      });
    } catch (error) {
      console.error('프로필 좋아요 실패:', error);
      throw error;
    }
  },

  /**
   * 프로필 좋아요/관심 취소
   * @param {string} profileId 프로필 ID
   * @param {string} userId 사용자 ID
   * @returns {Promise<void>}
   */
  async unlikeProfile(profileId, userId) {
    try {
      const docRef = doc(db, PROFILES_COLLECTION, profileId);
      await updateDoc(docRef, {
        likedBy: arrayRemove(userId),
        likeCount: increment(-1)
      });
    } catch (error) {
      console.error('프로필 좋아요 취소 실패:', error);
      throw error;
    }
  },

  /**
   * 프로필 차단
   * @param {string} profileId 차단할 프로필 ID
   * @param {string} userId 차단하는 사용자 ID
   * @returns {Promise<void>}
   */
  async blockProfile(profileId, userId) {
    try {
      const docRef = doc(db, PROFILES_COLLECTION, profileId);
      await updateDoc(docRef, {
        blockedBy: arrayUnion(userId)
      });
    } catch (error) {
      console.error('프로필 차단 실패:', error);
      throw error;
    }
  },

  /**
   * 프로필 차단 해제
   * @param {string} profileId 차단 해제할 프로필 ID
   * @param {string} userId 차단 해제하는 사용자 ID
   * @returns {Promise<void>}
   */
  async unblockProfile(profileId, userId) {
    try {
      const docRef = doc(db, PROFILES_COLLECTION, profileId);
      await updateDoc(docRef, {
        blockedBy: arrayRemove(userId)
      });
    } catch (error) {
      console.error('프로필 차단 해제 실패:', error);
      throw error;
    }
  },

  /**
   * 프로필 활성화 상태 변경
   * @param {string} profileId 프로필 ID
   * @param {boolean} isActive 활성화 여부
   * @returns {Promise<void>}
   */
  async updateProfileStatus(profileId, isActive) {
    try {
      const docRef = doc(db, PROFILES_COLLECTION, profileId);
      const koreanTime = getKoreanTime();
      
      await updateDoc(docRef, {
        isActive,
        updatedAt: koreanTime,
        lastActive: isActive ? koreanTime : null
      });
    } catch (error) {
      console.error('프로필 상태 업데이트 실패:', error);
      throw error;
    }
  },

  /**
   * 프로필 통계 조회
   * @returns {Promise<Object>} 프로필 통계 정보
   */
  async getProfileStats() {
    try {
      const stats = {
        total: 0,
        active: 0,
        byLocation: {},
        byOrientation: {},
        averageAge: 0,
        ageDistribution: {},
        heightDistribution: {},
        weightDistribution: {}
      };

      const querySnapshot = await getDocs(profilesRef);
      
      querySnapshot.docs.forEach(doc => {
        const profile = Profile.fromFirestore(doc);
        stats.total++;
        
        if (profile.isActive) {
          stats.active++;
        }

        // 지역별 통계
        if (profile.location) {
          stats.byLocation[profile.location] = (stats.byLocation[profile.location] || 0) + 1;
        }

        // 성향별 통계
        if (profile.orientation) {
          stats.byOrientation[profile.orientation] = (stats.byOrientation[profile.orientation] || 0) + 1;
        }

        // 나이 통계
        if (profile.age) {
          stats.averageAge += profile.age;
          const ageGroup = Math.floor(profile.age / 5) * 5;
          stats.ageDistribution[ageGroup] = (stats.ageDistribution[ageGroup] || 0) + 1;
        }

        // 키 통계
        if (profile.height) {
          const heightGroup = Math.floor(profile.height / 5) * 5;
          stats.heightDistribution[heightGroup] = (stats.heightDistribution[heightGroup] || 0) + 1;
        }

        // 체중 통계
        if (profile.weight) {
          const weightGroup = Math.floor(profile.weight / 5) * 5;
          stats.weightDistribution[weightGroup] = (stats.weightDistribution[weightGroup] || 0) + 1;
        }
      });

      // 평균 나이 계산
      if (stats.total > 0) {
        stats.averageAge = Math.round(stats.averageAge / stats.total);
      }

      return stats;
    } catch (error) {
      console.error('프로필 통계 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 프로필 이미지 업데이트
   * @param {string} profileId 프로필 ID
   * @param {string} imageType 이미지 타입 ('main' 또는 'additional')
   * @param {string} imageUrl 이미지 URL
   * @param {number} index 추가 이미지의 경우 인덱스
   * @returns {Promise<void>}
   */
  async updateProfileImage(profileId, imageType, imageUrl, index = null) {
    try {
      const docRef = doc(db, PROFILES_COLLECTION, profileId);
      const koreanTime = getKoreanTime();
      
      if (imageType === 'main') {
        await updateDoc(docRef, {
          mainPhotoURL: imageUrl,
          updatedAt: koreanTime
        });
      } else if (imageType === 'additional' && index !== null) {
        const profile = await this.getProfileById(profileId);
        const photoURLs = [...(profile.photoURLs || [])];
        photoURLs[index] = imageUrl;
        
        await updateDoc(docRef, {
          photoURLs,
          updatedAt: koreanTime
        });
      }
    } catch (error) {
      console.error('프로필 이미지 업데이트 실패:', error);
      throw error;
    }
  },

  /**
   * 프로필 이미지 삭제
   * @param {string} profileId 프로필 ID
   * @param {string} imageType 이미지 타입 ('main' 또는 'additional')
   * @param {number} index 추가 이미지의 경우 인덱스
   * @returns {Promise<void>}
   */
  async deleteProfileImage(profileId, imageType, index = null) {
    try {
      const docRef = doc(db, PROFILES_COLLECTION, profileId);
      const koreanTime = getKoreanTime();
      
      if (imageType === 'main') {
        await updateDoc(docRef, {
          mainPhotoURL: null,
          updatedAt: koreanTime
        });
      } else if (imageType === 'additional' && index !== null) {
        const profile = await this.getProfileById(profileId);
        const photoURLs = [...(profile.photoURLs || [])];
        photoURLs.splice(index, 1);
        
        await updateDoc(docRef, {
          photoURLs,
          updatedAt: koreanTime
        });
      }
    } catch (error) {
      console.error('프로필 이미지 삭제 실패:', error);
      throw error;
    }
  },

  /**
   * 프로필 신고
   * @param {string} profileId 신고할 프로필 ID
   * @param {string} reporterId 신고자 ID
   * @param {string} reason 신고 사유
   * @returns {Promise<void>}
   */
  async reportProfile(profileId, reporterId, reason) {
    try {
      const docRef = doc(db, PROFILES_COLLECTION, profileId);
      const koreanTime = getKoreanTime();
      
      await updateDoc(docRef, {
        reports: arrayUnion({
          reporterId,
          reason,
          reportedAt: koreanTime
        }),
        reportCount: increment(1)
      });
    } catch (error) {
      console.error('프로필 신고 실패:', error);
      throw error;
    }
  },

  /**
   * 프로필 검증
   * @param {Profile} profile 검증할 프로필
   * @returns {Object} 검증 결과
   */
  validateProfile(profile) {
    const errors = {};
    
    // 필수 필드 검증 (대표사진과 닉네임만 필수)
    if (!profile.mainPhotoURL) {
      errors.mainPhotoURL = '대표 이미지는 필수입니다.';
    }
    
    if (!profile.nickname) {
      errors.nickname = '닉네임은 필수입니다.';
    } else if (profile.nickname.length < 2 || profile.nickname.length > 20) {
      errors.nickname = '닉네임은 2-20자 사이여야 합니다.';
    }
    
    // 선택적 필드 검증 (입력된 경우에만 검증)
    if (profile.age) {
      if (profile.age < 18 || profile.age > 100) {
        errors.age = '나이는 18-100세 사이여야 합니다.';
      }
    }
    
    if (profile.height) {
      if (profile.height < 140 || profile.height > 220) {
        errors.height = '키는 140-220cm 사이여야 합니다.';
      }
    }
    
    if (profile.weight) {
      if (profile.weight < 30 || profile.weight > 150) {
        errors.weight = '체중은 30-150kg 사이여야 합니다.';
      }
    }
    
    if (profile.bio && profile.bio.length > 500) {
      errors.bio = '자기소개는 500자 이내여야 합니다.';
    }
    
    if (profile.photoURLs && profile.photoURLs.length > 5) {
      errors.photoURLs = '추가 이미지는 최대 5장까지 가능합니다.';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  /**
   * 프로필 비활성화
   * @param {string} phoneNumber 전화번호
   * @returns {Promise<void>}
   */
  async deactivateProfile(phoneNumber) {
    try {
      const user = await userService.getUser(phoneNumber);
      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      // 사용자와 프로필 모두 비활성화
      await Promise.all([
        userService.deactivateUser(phoneNumber),
        this.updateProfile(phoneNumber, { isActive: false })
      ]);
    } catch (error) {
      console.error('프로필 비활성화 실패:', error);
      throw error;
    }
  },

  /**
   * 활성화된 프로필 목록 조회
   * @returns {Promise<Profile[]>} 프로필 목록
   */
  async getActiveProfiles() {
    try {
      const q = query(
        collection(db, PROFILES_COLLECTION),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => Profile.fromFirestore(doc));
    } catch (error) {
      console.error('활성 프로필 조회 실패:', error);
      throw error;
    }
  }
}; 