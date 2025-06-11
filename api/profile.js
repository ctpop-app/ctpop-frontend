import { collection, query, where, limit, getDocs, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { API_ENDPOINTS } from './constants';
import { handleApiError } from './utils/errorHandler';

export const profileApi = {
  async exists(uuid) {
    try {
      const profilesRef = collection(db, API_ENDPOINTS.PROFILES);
      const q = query(profilesRef, where('uuid', '==', uuid), where('isActive', '==', true), limit(1));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async create(data) {
    try {
      const docRef = await addDoc(collection(db, API_ENDPOINTS.PROFILES), data);
      return { id: docRef.id, ...data };
    } catch (error) {
      console.error('프로필 생성 실패:', error);
      throw error;
    }
  },

  async get(uuid) {
    try {
      const profilesRef = collection(db, API_ENDPOINTS.PROFILES);
      const q = query(profilesRef, where('uuid', '==', uuid), where('isActive', '==', true), limit(1));
      const querySnapshot = await getDocs(q);
      return querySnapshot.empty ? null : querySnapshot.docs[0];
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async update(id, data) {
    try {
      const profileRef = doc(db, API_ENDPOINTS.PROFILES, id);
      await updateDoc(profileRef, data);
      return data;
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      throw error;
    }
  },

  async upload(path, blob) {
    try {
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, blob);
      return getDownloadURL(storageRef);
    } catch (error) {
      console.error('파일 업로드 실패:', error);
      throw error;
    }
  },

  /**
   * isActive가 true인 모든 프로필을 가져온다
   * @returns {Promise<Array>} 프로필 배열
   */
  async getAll() {
    const profilesRef = collection(db, 'profiles');
    const q = query(profilesRef, where('isActive', '==', true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
}; 