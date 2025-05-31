import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { User } from '../models/User';
import { v4 as uuidv4 } from 'uuid';

const USERS_COLLECTION = 'users';

// 한국 시간으로 변환하는 함수
const getKoreanTime = () => {
  const now = new Date();
  return new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
};

export const userService = {
  /**
   * 사용자 생성 또는 조회
   * @param {string} phoneNumber 전화번호
   * @returns {Promise<User>} 사용자 객체
   */
  async getOrCreateUser(phoneNumber) {
    try {
      const userRef = doc(db, USERS_COLLECTION, phoneNumber);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        // 기존 사용자 조회
        const user = User.fromFirestore(userSnap);
        
        // 마지막 인증 시간 업데이트
        await updateDoc(userRef, {
          lastAuthAt: getKoreanTime()
        });

        return user;
      } else {
        // 새 사용자 생성
        const now = getKoreanTime();
        const newUser = new User({
          uid: phoneNumber,
          uuid: uuidv4(),
          firstAuthAt: now,
          lastAuthAt: now,
          isActive: true
        });

        await setDoc(userRef, newUser.toFirestore());
        return newUser;
      }
    } catch (error) {
      console.error('사용자 생성/조회 실패:', error);
      throw error;
    }
  },

  /**
   * 사용자 조회
   * @param {string} phoneNumber 전화번호
   * @returns {Promise<User|null>} 사용자 객체 또는 null
   */
  async getUser(phoneNumber) {
    try {
      const userRef = doc(db, USERS_COLLECTION, phoneNumber);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) return null;
      
      return User.fromFirestore(userSnap);
    } catch (error) {
      console.error('사용자 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 사용자 비활성화
   * @param {string} phoneNumber 전화번호
   * @returns {Promise<void>}
   */
  async deactivateUser(phoneNumber) {
    try {
      const userRef = doc(db, USERS_COLLECTION, phoneNumber);
      await updateDoc(userRef, {
        isActive: false,
        lastAuthAt: getKoreanTime()
      });
    } catch (error) {
      console.error('사용자 비활성화 실패:', error);
      throw error;
    }
  }
}; 