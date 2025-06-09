/**
 * 프로필 사진 관리 훅
 * 프로필 사진의 선택, 업로드, 삭제 기능을 제공합니다.
 * Firebase Storage와 연동되어 이미지를 관리합니다.
 */

import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { MAX_PHOTOS } from '../components/profile-setup/constants';
import { imageService } from '../services/imageService';

/**
 * 프로필 사진 관리 훅 (6개 그리드, 순서 이동, 업로드, file/https 구분 등 모두 포함)
 * @param {string} uuid - 사용자의 UUID
 * @param {string[]} initialPhotos - 초기 사진 URL 배열
 * @returns {Object} 사진 관리 관련 함수와 상태
 */
export const usePhotoGrid = (uuid, initialPhotos = []) => {
  // 상태 관리 훅들 - 항상 호출됨
  const [photoList, setPhotoList] = useState(
    Array(MAX_PHOTOS).fill(null).map((_, index) => ({
      photo: initialPhotos?.[index] ? { uri: initialPhotos[index] } : null,
      isAddable: index < (initialPhotos?.length || 0) + 1
    }))
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isValid, setIsValid] = useState(false);

  // userId 유효성 검사 - 항상 호출됨
  useEffect(() => {
    if (!uuid) {
      setError('사용자 정보를 불러올 수 없습니다.');
      setIsValid(false);
    } else {
      setError(null);
      setIsValid(true);
    }
  }, [uuid]);

  // 사진 추가(갤러리에서 선택) - 조건부 로직을 내부로 이동
  const handlePhotoPress = useCallback(async (index) => {
    if (!isValid) {
      Alert.alert('오류', '사용자 정보를 불러올 수 없습니다.');
      return { photo: null };
    }

    if (!photoList?.[index]?.isAddable) {
      return { photo: null };
    }

    try {
      const result = await imageService.pickImage();

      if (!result.canceled) {
        const newPhoto = {
          photo: {
            uri: result.assets[0].uri,
            type: 'image/jpeg',
            name: 'photo.jpg'
          },
          isAddable: true
        };
        setPhotoList(prev => {
          const newList = [...prev];
          newList[index] = newPhoto;
          if (index + 1 < MAX_PHOTOS) {
            newList[index + 1] = { ...newList[index + 1], isAddable: true };
          }
          return newList;
        });
        return newPhoto;
      }
      return { photo: null };
    } catch (error) {
      Alert.alert('오류', '사진을 선택하는 중 오류가 발생했습니다.');
      setError(error);
      return { photo: null };
    }
  }, [photoList, isValid]);

  // 사진 삭제 - 조건부 로직을 내부로 이동
  const removePhoto = useCallback((index) => {
    if (!isValid || !photoList) return;

    setPhotoList(prev => {
      const newList = [...prev];
      newList[index] = { ...newList[index], photo: null };
      for (let i = index + 1; i < MAX_PHOTOS; i++) {
        newList[i] = { ...newList[i], isAddable: false };
      }
      if (index > 0) {
        newList[index - 1] = { ...newList[index - 1], isAddable: true };
      }
      return newList;
    });
  }, [isValid, photoList]);

  // 사진 순서 이동 - 조건부 로직을 내부로 이동
  const handlePhotoMove = useCallback((fromIndex, toIndex) => {
    if (!isValid || !photoList) return;
    if (!photoList[fromIndex]?.photo || !photoList[toIndex]?.photo) return;

    setPhotoList(prev => {
      const newList = [...prev];
      const [movedPhoto] = newList.splice(fromIndex, 1);
      newList.splice(toIndex, 0, movedPhoto);
      return newList;
    });
  }, [photoList, isValid]);

  // 사진 업로드 - 조건부 로직을 내부로 이동
  const uploadPhotos = useCallback(async () => {
    if (!isValid) {
      throw new Error('사진이 유효하지 않습니다.');
    }

    if (!photoList || !Array.isArray(photoList)) {
      throw new Error('사진 목록이 유효하지 않습니다.');
    }

    console.log('usePhotoGrid - photoList:', photoList);
    const validPhotos = photoList.filter(item => item?.photo?.uri);
    console.log('usePhotoGrid - validPhotos:', validPhotos);

    if (!validPhotos || validPhotos.length === 0) {
      throw new Error('업로드할 사진이 없습니다.');
    }

    try {
      setIsLoading(true);
      setError(null);

      const photosToUpload = validPhotos.map(item => ({
        uri: item.photo.uri,
        type: 'image/jpeg',
        name: 'photo.jpg'
      }));
      console.log('usePhotoGrid - photosToUpload:', photosToUpload);

      const photoURLs = await imageService.uploadProfilePhotos(photosToUpload, uuid);
      console.log('usePhotoGrid - photoURLs:', photoURLs);
      
      if (!photoURLs || photoURLs.length === 0) {
        throw new Error('사진 업로드에 실패했습니다.');
      }

      return photoURLs;
    } catch (error) {
      console.error('사진 업로드 실패:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [photoList, uuid, isValid]);

  return {
    photoList,
    isLoading,
    error,
    isValid,
    handlePhotoPress,
    removePhoto,
    handlePhotoMove,
    uploadPhotos
  };
}; 