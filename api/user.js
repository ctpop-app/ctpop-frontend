import apiClient, { handleApiResponse, handleApiError } from './client';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Firestore에서 사용자 프로필이 존재하는지 확인합니다.
 * @param {string} phoneNumber - 사용자 전화번호
 * @returns {Promise<Object>} - 성공 여부와 프로필 존재 여부
 */
export const checkProfileExists = async (phoneNumber) => {
  try {
    console.log('Firestore에서 프로필 확인 중:', phoneNumber);
    
    // 전화번호를 document ID로 사용
    const userDocRef = doc(db, 'users', phoneNumber);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      console.log('프로필이 존재합니다:', userDoc.data());
      return { 
        success: true, 
        exists: true,
        data: userDoc.data()
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
};

/**
 * 사용자 프로필 정보를 가져옵니다.
 * @param {string} userId - 사용자 ID (전화번호)
 * @returns {Promise<Object>} - 성공 여부와 사용자 프로필 정보
 */
export const getUserProfile = async (userId) => {
  try {
    const response = await apiClient.get(`/users/${userId}`);
    return { success: true, data: handleApiResponse(response) };
  } catch (error) {
    console.error('사용자 정보 가져오기 오류:', error);
    return handleApiError(error);
  }
};

/**
 * 사용자 프로필을 업데이트합니다.
 * @param {string} userId - 사용자 ID (전화번호)
 * @param {Object} profileData - 업데이트할 프로필 데이터
 * @returns {Promise<Object>} - 성공 여부와 업데이트된 프로필 정보
 */
export const updateUserProfile = async (userId, profileData) => {
  try {
    const response = await apiClient.patch(`/users/${userId}`, profileData);
    return { success: true, data: handleApiResponse(response) };
  } catch (error) {
    console.error('프로필 업데이트 오류:', error);
    return handleApiError(error);
  }
};

/**
 * 사용자 프로필 이미지를 업로드합니다.
 * @param {string} userId - 사용자 ID (전화번호)
 * @param {Object} imageData - 이미지 데이터 (formData 형식)
 * @returns {Promise<Object>} - 성공 여부와 이미지 URL 정보
 */
export const uploadProfileImage = async (userId, imageData) => {
  try {
    // FormData 형식의 이미지 업로드는 Content-Type을 multipart/form-data로 설정해야 함
    const formData = new FormData();
    formData.append('image', imageData);
    
    const response = await apiClient.post(`/users/${userId}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return { success: true, data: handleApiResponse(response) };
  } catch (error) {
    console.error('이미지 업로드 오류:', error);
    return handleApiError(error);
  }
};

/**
 * 사용자 계정 설정을 가져옵니다.
 * @param {string} userId - 사용자 ID (전화번호)
 * @returns {Promise<Object>} - 성공 여부와 계정 설정 정보
 */
export const getUserSettings = async (userId) => {
  try {
    const response = await apiClient.get(`/users/${userId}/settings`);
    return { success: true, data: handleApiResponse(response) };
  } catch (error) {
    console.error('사용자 설정 가져오기 오류:', error);
    return handleApiError(error);
  }
};

/**
 * 사용자 계정 설정을 업데이트합니다.
 * @param {string} userId - 사용자 ID (전화번호)
 * @param {Object} settingsData - 업데이트할 설정 데이터
 * @returns {Promise<Object>} - 성공 여부와 업데이트된 설정 정보
 */
export const updateUserSettings = async (userId, settingsData) => {
  try {
    const response = await apiClient.patch(`/users/${userId}/settings`, settingsData);
    return { success: true, data: handleApiResponse(response) };
  } catch (error) {
    console.error('사용자 설정 업데이트 오류:', error);
    return handleApiError(error);
  }
}; 