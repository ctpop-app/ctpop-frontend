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
 * 프로필 사진 관리 훅
 * @param {string} uuid - 사용자의 UUID
 * @returns {Object} 사진 관리 관련 함수와 상태
 */
export const usePhotoGrid = (uuid) => {
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [photoList, setPhotoList] = useState(Array(MAX_PHOTOS).fill(null));

  // UUID 체크
  useEffect(() => {
    if (!uuid) {
      console.error('UUID가 없습니다');
      setError('사용자 정보를 불러올 수 없습니다.');
    } else {
      setError(null);
    }
  }, [uuid]);

  const handlePhotoPress = async (index) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '사진 접근 권한이 필요합니다.');
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const photo = {
          uri: result.assets[0].uri,
          type: 'image/jpeg/png',
          name: `photo_${Date.now()}.jpg`
        };
        
        // photoList 업데이트
        const newPhotoList = [...photoList];
        newPhotoList[index] = photo;
        setPhotoList(newPhotoList);
        
        // photos 배열에도 추가
        addPhoto(photo);
        return photo;
      }
      return null;
    } catch (error) {
      Alert.alert('오류', '사진 선택 중 오류가 발생했습니다.');
      return null;
    }
  };

  const addPhoto = useCallback((photo) => {
    if (!uuid) {
      console.error('UUID가 없어서 사진을 추가할 수 없습니다');
      return;
    }
    setPhotos(prev => [...prev, { ...photo, uuid }]);
  }, [uuid]);

  const removePhoto = useCallback((index) => {
    // photoList 업데이트
    const newPhotoList = [...photoList];
    newPhotoList[index] = null;
    setPhotoList(newPhotoList);
    
    // photos 배열에서도 제거
    setPhotos(prev => prev.filter((_, i) => i !== index));
  }, [photoList]);

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

  const handlePhotoMove = useCallback((fromIndex, toIndex) => {
    const newPhotoList = [...photoList];
    const [movedPhoto] = newPhotoList.splice(fromIndex, 1);
    newPhotoList.splice(toIndex, 0, movedPhoto);
    setPhotoList(newPhotoList);
  }, [photoList]);

  const handleSave = useCallback(async (formData, handleSubmit) => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      console.log('프로필 저장 시작:', { formData, photoList });

      // 1. 사진 업로드
      const photosToUpload = photoList.filter(photo => photo !== null);
      console.log('업로드할 사진:', photosToUpload);
      
      if (photosToUpload.length === 0) {
        throw new Error('대표 사진을 등록해주세요.');
      }
      
      // photos 배열 업데이트
      photosToUpload.forEach(photo => {
        if (!photos.find(p => p.uri === photo.uri)) {
          addPhoto(photo);
        }
      });
      
      let photoUrls = [];
      if (photosToUpload.length > 0) {
        photoUrls = await uploadPhotos();
        console.log('사진 업로드 결과:', photoUrls);
        
        if (!photoUrls || photoUrls.length === 0) {
          throw new Error('사진 업로드에 실패했습니다.');
        }
      }

      // 2. 프로필 정보 저장 (사진 URL 포함)
      console.log('프로필 저장 시작 - formData:', formData);
      console.log('프로필 저장 시작 - photoUrls:', photoUrls);
      
      const profileData = await handleSubmit({
        mainPhotoURL: photoUrls[0],  // 첫 번째 사진을 대표사진으로
        photoURLs: photoUrls
      });
      console.log('프로필 저장 결과:', profileData);
      
      if (!profileData) {
        throw new Error('프로필 저장에 실패했습니다.');
      }

      return profileData;
    } catch (error) {
      console.error('프로필 저장 중 오류:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [photoList, photos, addPhoto, uploadPhotos, isLoading]);

  return {
    photos,
    photoList,
    isLoading,
    error,
    handlePhotoPress,
    addPhoto,
    removePhoto,
    uploadPhotos,
    handlePhotoMove,
    handleSave
  };
}; 