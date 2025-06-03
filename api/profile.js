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

      return {
        success: true,
        data: !querySnapshot.empty
      };
    } catch (error) {
      return handleApiError(error);
    }
  },

  async createProfile(profileData) {
    try {
      const { uuid, ...data } = profileData;
      const profile = new Profile({
        ...data,
        uuid,
        createdAt: getUTCTimestamp(),
        updatedAt: getUTCTimestamp()
      });

      const errors = profile.validate();
      if (errors) {
        throw new Error(Object.values(errors).join('\n'));
      }

      const docRef = await addDoc(collection(db, API_ENDPOINTS.PROFILES), profile.toFirestore());
      return { 
        success: true,
        data: { id: docRef.id, ...profile } 
      };
    } catch (error) {
      console.error('프로필 생성 실패:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  async getProfile(uuid) {
    try {
      // uuid로 프로필 찾기
      const profilesRef = collection(db, API_ENDPOINTS.PROFILES);
      const q = query(
        profilesRef,
        where('uuid', '==', uuid),
        where('isActive', '==', true),
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return {
          success: false,
          error: '프로필을 찾을 수 없습니다.'
        };
      }

      const profileDoc = querySnapshot.docs[0];
      return {
        success: true,
        data: Profile.fromFirestore(profileDoc)
      };
    } catch (error) {
      return handleApiError(error);
    }
  },

  async updateProfile(profileId, updateData) {
    try {
      const profileRef = doc(db, API_ENDPOINTS.PROFILES, profileId);
      const profileDoc = await getDoc(profileRef);

      if (!profileDoc.exists()) {
        throw new Error('프로필을 찾을 수 없습니다.');
      }

      const updatedProfile = new Profile({
        ...profileDoc.data(),
        ...updateData,
        updatedAt: getUTCTimestamp()
      });

      const errors = updatedProfile.validate();
      if (errors) {
        throw new Error(Object.values(errors).join('\n'));
      }

      await updateDoc(profileRef, updatedProfile.toFirestore());
      return updatedProfile;
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      throw error;
    }
  },

  async uploadPhotos(uuid, photos) {
    try {
      // 1. 프로필 찾기
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

      // 2. 사진 업로드 및 URL 수집
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
          mainPhotoURL: photoUrls[0], // 첫 번째 사진을 대표 사진으로 설정
          updatedAt: getUTCTimestamp()
        };

        await updateDoc(profileRef, updateData);
        console.log('사진 업로드 완료:', photoUrls);
      }

      return photoUrls;
    } catch (error) {
      console.error('사진 업로드 실패:', error);
      throw error;
    }
  }
}; 