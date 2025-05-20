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
  addDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { Profile } from '../models/Profile';

// 프로필 컬렉션 참조
const PROFILES_COLLECTION = 'profiles';
const profilesRef = collection(db, PROFILES_COLLECTION);

/**
 * 프로필 서비스 - Firestore 기반 프로필 데이터 관리
 */
export const profileService = {
  /**
   * 사용자 ID로 프로필 조회
   * @param {string} uid 사용자 ID (전화번호 또는 Firebase Auth UID)
   * @returns {Promise<Profile|null>} 프로필 객체 또는 null
   */
  async getProfileByUid(uid) {
    try {
      const q = query(profilesRef, where('uid', '==', uid), limit(1));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) return null;
      
      return Profile.fromFirestore(querySnapshot.docs[0]);
    } catch (error) {
      console.error('프로필 조회 실패:', error);
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
   * 새 프로필 생성
   * @param {Profile} profile 프로필 객체
   * @returns {Promise<Profile>} 생성된 프로필 (ID 포함)
   */
  async createProfile(profile) {
    try {
      // 생성 시간과 업데이트 시간 설정
      const data = {
        ...profile.toFirestore(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastActive: serverTimestamp()
      };
      
      // 문서 ID 자동 생성하여 추가
      const docRef = await addDoc(profilesRef, data);
      
      return {
        ...profile,
        id: docRef.id
      };
    } catch (error) {
      console.error('프로필 생성 실패:', error);
      throw error;
    }
  },
  
  /**
   * 프로필 업데이트
   * @param {string} profileId 프로필 ID
   * @param {Object} updateData 업데이트할 데이터
   * @returns {Promise<void>}
   */
  async updateProfile(profileId, updateData) {
    try {
      const docRef = doc(db, PROFILES_COLLECTION, profileId);
      
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
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
      const preferences = ['트젠', 'CD', '러버', '트젠/러버', 'CD/러버'];
      const locations = [
        '서울', '부산', '인천', '대구', 
        '광주', '대전', '울산', '세종',
        '경기', '강원', '충북', '충남', 
        '전북', '전남', '경북', '경남', '제주'
      ];
      
      const profiles = [];
      
      for (let i = 0; i < count; i++) {
        const preference = preferences[Math.floor(Math.random() * preferences.length)];
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
          preference,
          bio: `안녕하세요! 저는 ${location}에 사는 테스트 프로필 ${i+1}입니다. 잘 부탁드려요!`,
          photoURL: `https://picsum.photos/id/${(i % 100) + 1}/300/300`, // 랜덤 이미지
          isActive: Math.random() > 0.2, // 80%는 활성 상태
        });
        
        const created = await this.createProfile(profile);
        profiles.push(created);
      }
      
      return profiles;
    } catch (error) {
      console.error('더미 프로필 생성 실패:', error);
      throw error;
    }
  }
}; 