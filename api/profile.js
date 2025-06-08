import { collection, query, where, limit, getDocs, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Profile } from '../models/Profile';
import { API_ENDPOINTS } from './constants';
import { handleApiError } from './utils/errorHandler';
import { getUTCTimestamp } from '../utils/dateUtils';

export const profile = {
  async checkProfileExists(uuid) {
    try {
      const profilesRef = collection(db, API_ENDPOINTS.PROFILES);
      const q = query(
        profilesRef,
        where('uuid', '==', uuid),
        where('isActive', '==', true),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async createProfile(profileData) {
    try {
      const docRef = await addDoc(collection(db, API_ENDPOINTS.PROFILES), profileData.toFirestore());
      return { id: docRef.id, ...profileData };
    } catch (error) {
      console.error('프로필 생성 실패:', error);
      throw error;
    }
  },

  async getProfile(uuid) {
    try {
      const profilesRef = collection(db, API_ENDPOINTS.PROFILES);
      const q = query(
        profilesRef,
        where('uuid', '==', uuid),
        where('isActive', '==', true),
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const profileDoc = querySnapshot.docs[0];
      return Profile.fromFirestore(profileDoc);
    } catch (error) {
      return handleApiError(error);
    }
  },

  async updateProfile(profileData) {
    try {
      const profilesRef = collection(db, API_ENDPOINTS.PROFILES);
      const q = query(
        profilesRef,
        where('uuid', '==', profileData.uuid),
        where('isActive', '==', true),
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('프로필을 찾을 수 없습니다.');
      }

      const profileDoc = querySnapshot.docs[0];
      const profileRef = doc(db, API_ENDPOINTS.PROFILES, profileDoc.id);

      await updateDoc(profileRef, profileData.toFirestore());
      return profileData;
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      throw error;
    }
  },

  async uploadPhotos(uuid, photos) {
    try {
      // 1. 프로필 존재 확인
      const profilesRef = collection(db, API_ENDPOINTS.PROFILES);
      const q = query(
        profilesRef,
        where('uuid', '==', uuid),
        where('isActive', '==', true),
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('프로필을 찾을 수 없습니다.');
      }

      const profileDoc = querySnapshot.docs[0];
      const profileRef = doc(db, API_ENDPOINTS.PROFILES, profileDoc.id);

      // 2. 사진 업로드
      const photoUrls = [];
      for (const photo of photos) {
        if (photo && photo.uri) {
          const storageRef = ref(storage, `profiles/${uuid}/${Date.now()}_${photo.name}`);
          const response = await fetch(photo.uri);
          const blob = await response.blob();
          await uploadBytes(storageRef, blob);
          const url = await getDownloadURL(storageRef);
          photoUrls.push(url);
        }
      }

      // 3. 프로필 업데이트
      if (photoUrls.length > 0) {
        const updateData = {
          photoURLs: photoUrls,
          mainPhotoURL: photoUrls[0],
          updatedAt: getUTCTimestamp()
        };
        await updateDoc(profileRef, updateData);
      }

      return photoUrls;
    } catch (error) {
      console.error('사진 업로드 실패:', error);
      throw error;
    }
  }
}; 