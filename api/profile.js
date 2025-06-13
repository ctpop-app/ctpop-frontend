import { collection, query, where, limit, getDocs, setDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { API_ENDPOINTS } from './constants';
import { handleApiError } from './utils/errorHandler';

export const profileApi = {
  async exists(uuid) {
    try {
      const profileRef = doc(db, API_ENDPOINTS.PROFILES, uuid);
      const profileDoc = await getDoc(profileRef);
      return profileDoc.exists() && profileDoc.data().isActive;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async create(data) {
    try {
      const profileRef = doc(db, API_ENDPOINTS.PROFILES, data.uuid);
      await setDoc(profileRef, data);
      return data;
    } catch (error) {
      console.error('프로필 생성 실패:', error);
      throw error;
    }
  },

  async get(uuid) {
    try {
      const profileRef = doc(db, API_ENDPOINTS.PROFILES, uuid);
      const profileDoc = await getDoc(profileRef);
      return profileDoc.exists() && profileDoc.data().isActive ? profileDoc : null;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  async update(uuid, data) {
    try {
      const profileRef = doc(db, API_ENDPOINTS.PROFILES, uuid);
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
    return snapshot.docs.map(doc => ({ ...doc.data() }));
  },
}; 