/**
 * 프로필 사진 관리 훅
 * 프로필 사진의 선택, 업로드, 삭제 기능을 제공합니다.
 * Firebase Storage와 연동되어 이미지를 관리합니다.
 */

import { useState, useEffect, useCallback } from 'react';
import { uploadMultipleImages } from '../services/imageService';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { MAX_PHOTOS } from '../components/profile-setup/constants';

/**
 * 프로필 사진 관리 훅 (6개 그리드, 순서 이동, 업로드, file/https 구분 등 모두 포함)
 * @param {string} userId - 사용자의 UUID
 * @param {string[]} initialPhotos - 초기 사진 URL 배열
 * @returns {Object} 사진 관리 관련 함수와 상태
 */
export const usePhotoGrid = (userId, initialPhotos = []) => {
  // 6개의 슬롯을 초기화
  const [photoList, setPhotoList] = useState(
    Array(MAX_PHOTOS).fill(null).map((_, index) => ({
      photo: initialPhotos[index] ? { uri: initialPhotos[index] } : null,
      isAddable: index < initialPhotos.length + 1
    }))
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // UUID 체크
  useEffect(() => {
    if (!userId) {
      console.error('UUID가 없습니다');
      setError('사용자 정보를 불러올 수 없습니다.');
    } else {
      setError(null);
    }
  }, [userId]);

  // 사진 추가(갤러리에서 선택)
  const handlePhotoPress = useCallback(async (index) => {
    if (!photoList[index].isAddable) return null;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
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
        return newPhoto.photo;
      }
    } catch (error) {
      Alert.alert('오류', '사진을 선택하는 중 오류가 발생했습니다.');
      setError(error);
    }
    return null;
  }, [photoList]);

  // 사진 삭제
  const removePhoto = useCallback((index) => {
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
  }, []);

  // 사진 순서 이동
  const handlePhotoMove = useCallback((fromIndex, toIndex) => {
    if (!photoList[fromIndex]?.photo || !photoList[toIndex]?.photo) return;
    setPhotoList(prev => {
      const newList = [...prev];
      const [movedPhoto] = newList.splice(fromIndex, 1);
      newList.splice(toIndex, 0, movedPhoto);
      return newList;
    });
  }, [photoList]);

  // 사진 업로드 (file://만 업로드, https://는 그대로)
  const uploadPhotos = useCallback(async () => {
    setIsLoading(true);
    try {
      // file://만 업로드, https://는 그대로
      const localPhotos = photoList.filter(item => item?.photo?.uri?.startsWith('file://')).map(item => item.photo.uri);
      const existingPhotoURLs = photoList.filter(item => item?.photo?.uri?.startsWith('https://')).map(item => item.photo.uri);
      let newPhotoURLs = [];
      if (localPhotos.length > 0) {
        newPhotoURLs = await uploadMultipleImages(localPhotos, `profiles/${userId}`);
      }
      // photoList 순서대로 최종 https:// URL 배열 만들기
      let newPhotoIndex = 0;
      const finalPhotoURLs = photoList.map(item => {
        const uri = item?.photo?.uri;
        if (uri?.startsWith('file://')) {
          return newPhotoURLs[newPhotoIndex++];
        } else if (uri?.startsWith('https://')) {
          return uri;
        }
        return null;
      }).filter(Boolean);
      // 업로드 후 photoList를 https://...로만 재구성
      setPhotoList(finalPhotoURLs.map(url => ({
        photo: { uri: url },
        isAddable: true
      })));
      return finalPhotoURLs;
    } catch (error) {
      Alert.alert('오류', '사진 업로드 중 오류가 발생했습니다.');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [photoList, userId]);

  return {
    photoList,
    isLoading,
    error,
    handlePhotoPress,
    removePhoto,
    handlePhotoMove,
    uploadPhotos
  };
}; 