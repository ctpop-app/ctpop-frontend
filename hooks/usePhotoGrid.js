/**
 * 프로필 사진 관리 훅
 * 프로필 사진의 선택, 업로드, 삭제 기능을 제공합니다.
 * Firebase Storage와 연동되어 이미지를 관리합니다.
 */

import { useState, useEffect, useCallback } from 'react';
import { uploadMultipleImages } from '../services/imageService';

/**
 * 프로필 사진 관리 훅
 * @param {string} uuid - 사용자의 UUID
 * @returns {Object} 사진 관리 관련 함수와 상태
 */
export const usePhotoGrid = (uuid) => {
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // UUID 체크
  useEffect(() => {
    if (!uuid) {
      console.error('UUID가 없습니다');
      setError('사용자 정보를 불러올 수 없습니다.');
    } else {
      setError(null);
    }
  }, [uuid]);

  const addPhoto = useCallback((photo) => {
    if (!uuid) {
      console.error('UUID가 없어서 사진을 추가할 수 없습니다');
      return;
    }
    setPhotos(prev => [...prev, { ...photo, uuid }]);
  }, [uuid]);

  const removePhoto = useCallback((index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  }, []);

  const uploadPhotos = useCallback(async () => {
    if (!uuid) {
      console.error('UUID가 없어서 사진을 업로드할 수 없습니다');
      return [];
    }

    if (photos.length === 0) {
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('사진 업로드 시작:', { photos, uuid });
      const uris = photos.map(photo => photo.uri);
      const result = await uploadMultipleImages(uris, `profiles/${uuid}`);
      console.log('사진 업로드 결과:', result);
      return result;
    } catch (err) {
      console.error('사진 업로드 오류:', err);
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [photos, uuid]);

  return {
    photos,
    isLoading,
    error,
    addPhoto,
    removePhoto,
    uploadPhotos
  };
}; 