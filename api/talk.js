import { db, storage } from '../firebase';
import { 
  collection, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc
} from 'firebase/firestore';
import { Talk } from '../models/Talk';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uploadImage } from '../services/imageService';

const MY_ACTIVE_TALK_ID_KEY = 'myActiveTalkId';

export const talkApi = {
  async getMyTalk(uuid) {
    try {
      // 로컬에 저장된 토크 ID 확인
      const myTalkId = await AsyncStorage.getItem(MY_ACTIVE_TALK_ID_KEY);
      
      if (myTalkId) {
        // 저장된 ID로 직접 문서 조회
        const talkRef = doc(db, 'talks', myTalkId);
        const talkDoc = await getDoc(talkRef);
        
        if (talkDoc.exists()) {
          const talkData = talkDoc.data();
          
          // 활성화된 토크이고 해당 사용자의 것인지 확인
          if (talkData.isActive && talkData.uuid === uuid) {
            const talk = Talk.fromFirestore(talkDoc);
            return { success: true, data: talk };
          }
        }
        
        // 문서가 없거나 비활성화된 토크면 로컬 ID 삭제
        await AsyncStorage.removeItem(MY_ACTIVE_TALK_ID_KEY);
      }
      
      // Fallback: 쿼리로 활성 토크 조회
      const talksRef = collection(db, 'talks');
      const q = query(
        talksRef, 
        where('uuid', '==', uuid),
        where('isActive', '==', true), 
        orderBy('createdAt', 'desc'), 
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return { success: true, data: null };
      }
      
      const talkDoc = snapshot.docs[0];
      const talk = Talk.fromFirestore(talkDoc);
      
      // 찾은 토크 ID를 로컬에 저장
      await AsyncStorage.setItem(MY_ACTIVE_TALK_ID_KEY, talk.id);
      
      return { success: true, data: talk };
    } catch (error) {
      console.error('내 토크 조회 오류:', error);
      return { success: false, error: error.message };
    }
  },

  async createTalk(uuid, nickname, content, imageUri = null) {
    try {
      // 기존 활성 토크 비활성화
      const existingTalkId = await AsyncStorage.getItem(MY_ACTIVE_TALK_ID_KEY);
      if (existingTalkId) {
        await this.deactivateTalk(uuid, existingTalkId);
        await AsyncStorage.removeItem(MY_ACTIVE_TALK_ID_KEY);
      }
      
      // 이미지 업로드 (있는 경우)
      let imageUrl = null;
      if (imageUri) {
        imageUrl = await uploadImage(imageUri, 'talks', uuid);
      }
      
      // 새 토크 생성
      const talk = Talk.create(uuid, nickname, content, imageUrl);
      const talksRef = collection(db, 'talks');
      const talkRef = await addDoc(talksRef, talk.toFirestore());
      
      // 새 토크 ID를 로컬에 저장
      await AsyncStorage.setItem(MY_ACTIVE_TALK_ID_KEY, talkRef.id);
      
      const newTalk = new Talk({
        id: talkRef.id,
        ...talk.toFirestore()
      });
      
      return { success: true, data: newTalk };
    } catch (error) {
      console.error('토크 생성 오류:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteTalk(uuid, talkId) {
    try {
      const talkRef = doc(db, 'talks', talkId);
      await updateDoc(talkRef, { isActive: false });
      
      // 로컬에서 토크 ID 삭제
      await AsyncStorage.removeItem(MY_ACTIVE_TALK_ID_KEY);
      
      return { success: true, data: { id: talkId } };
    } catch (error) {
      console.error('토크 삭제 오류:', error);
      return { success: false, error: error.message };
    }
  },

  async deactivateTalk(uuid, talkId) {
    try {
      const talkRef = doc(db, 'talks', talkId);
      await updateDoc(talkRef, { isActive: false });
      return { success: true };
    } catch (error) {
      console.error('토크 비활성화 오류:', error);
      return { success: false, error: error.message };
    }
  },

  async getAllTalks(params = {}) {
    try {
      const { limit: limitCount = 50, lastTalk = null } = params;
      
      let q = query(
        collection(db, 'talks'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      // 페이징 처리
      if (lastTalk) {
        q = query(
          collection(db, 'talks'),
          where('isActive', '==', true),
          orderBy('createdAt', 'desc'),
          startAfter(lastTalk.createdAt),
          limit(limitCount)
        );
      }
      
      const snapshot = await getDocs(q);
      const talks = snapshot.docs.map(doc => Talk.fromFirestore(doc));
      
      return { 
        success: true, 
        data: talks,
        hasMore: talks.length === limitCount
      };
    } catch (error) {
      console.error('전체 토크 조회 오류:', error);
      return { success: false, error: error.message };
    }
  }
}; 