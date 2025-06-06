import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadMultipleImages } from '../services/imageService';
import { MAX_PHOTOS } from '../components/profile-setup/constants';

export const useProfilePhotos = (userId, initialPhotos = []) => {
  // 6개의 슬롯을 초기화
  const [photoList, setPhotoList] = useState(
    Array(MAX_PHOTOS).fill(null).map((_, index) => ({
      photo: initialPhotos[index] ? { uri: initialPhotos[index] } : null,
      isAddable: index < initialPhotos.length + 1
    }))
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePhotoPress = useCallback(async (index) => {
    // 활성화되지 않은 슬롯은 클릭 불가
    if (!photoList[index].isAddable) {
      return null;
    }

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
          
          // 다음 슬롯이 있으면 활성화
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

  const removePhoto = useCallback((index) => {
    setPhotoList(prev => {
      const newList = [...prev];
      newList[index] = { ...newList[index], photo: null };
      
      // 현재 슬롯 이후의 모든 슬롯 비활성화
      for (let i = index + 1; i < MAX_PHOTOS; i++) {
        newList[i] = { ...newList[i], isAddable: false };
      }
      
      // 이전 슬롯이 있으면 활성화
      if (index > 0) {
        newList[index - 1] = { ...newList[index - 1], isAddable: true };
      }
      
      return newList;
    });
  }, []);

  const handlePhotoMove = useCallback((fromIndex, toIndex) => {
    // 실제로 사진이 있는 슬롯끼리만 이동 가능
    if (!photoList[fromIndex]?.photo || !photoList[toIndex]?.photo) {
      return;
    }

    setPhotoList(prev => {
      const newList = [...prev];
      const [movedPhoto] = newList.splice(fromIndex, 1);
      newList.splice(toIndex, 0, movedPhoto);
      return newList;
    });
  }, [photoList]);

  const uploadPhotos = useCallback(async () => {
    setIsLoading(true);
    try {
      const photoURIs = photoList
        .filter(item => item.photo && item.photo.uri)
        .map(item => item.photo.uri);
      
      const uploadedURLs = await uploadMultipleImages(photoURIs);
      return uploadedURLs;
    } catch (error) {
      Alert.alert('오류', '사진 업로드 중 오류가 발생했습니다.');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [photoList]);

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