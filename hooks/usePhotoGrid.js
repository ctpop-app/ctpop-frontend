/**
 * 프로필 사진 관리 훅
 * 프로필 사진의 선택, 업로드, 삭제 기능을 제공합니다.
 * Firebase Storage와 연동되어 이미지를 관리합니다.
 */

import { useState } from 'react';
import { profile } from '../api';
import { uploadImage } from '../services/imageService';

/**
 * 프로필 사진 관리 훅
 * @param {string} uuid - 사용자의 UUID
 * @returns {Object} 사진 관리 관련 함수와 상태
 */
export const usePhotoGrid = (uuid) => {
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const addPhoto = (photo) => {
    console.log('사진 추가:', photo);
    setPhotos(prev => {
      const newPhotos = [...prev, photo];
      console.log('업데이트된 사진 목록:', newPhotos);
      return newPhotos;
    });
  };

  const removePhoto = (index) => {
    console.log('사진 제거:', index);
    setPhotos(prev => {
      const newPhotos = prev.filter((_, i) => i !== index);
      console.log('업데이트된 사진 목록:', newPhotos);
      return newPhotos;
    });
  };

  const uploadPhotos = async () => {
    console.log('사진 업로드 시작:', { photos, uuid });
    
    if (photos.length === 0) {
      console.log('업로드할 사진이 없음');
      return [];
    }

    if (!uuid) {
      console.log('사용자 UUID 없음');
      setError('사용자 정보가 없습니다. 다시 로그인해주세요.');
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const photoUrls = [];
      
      // 각 사진을 순차적으로 업로드
      for (const photo of photos) {
        console.log('사진 업로드 중:', photo);
        if (photo && photo.uri) {
          console.log('uploadImage 호출:', { uri: photo.uri, path: `profiles/${uuid}` });
          const url = await uploadImage(photo.uri, `profiles/${uuid}`);
          console.log('사진 업로드 완료:', url);
          photoUrls.push(url);
        }
      }

      console.log('모든 사진 업로드 완료:', photoUrls);

      // 프로필 업데이트
      console.log('프로필 업데이트 시작');
      const response = await profile.updateProfile(uuid, {
        mainPhotoURL: photoUrls[0] || '',
        photoURLs: photoUrls
      });

      if (!response.success) {
        console.error('프로필 업데이트 실패:', response.error);
        throw new Error(response.error);
      }

      console.log('프로필 업데이트 완료');
      return photoUrls;
    } catch (error) {
      console.error('사진 업로드 중 오류:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    photos,
    isLoading,
    error,
    addPhoto,
    removePhoto,
    uploadPhotos
  };
}; 