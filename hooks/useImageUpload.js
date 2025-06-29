import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { imageService, uploadImage } from '../services/imageService';
import { TALK_CONSTANTS } from '../constants/talkConstants';

/**
 * 이미지 업로드 관련 로직을 관리하는 커스텀 훅
 * @param {string} uploadPath - 업로드할 경로 (예: 'talk', 'profile', 'chat')
 * @param {string} uuid - 사용자 UUID
 * @returns {Object} 이미지 관련 상태와 함수들
 */
export const useImageUpload = (uploadPath = TALK_CONSTANTS.UPLOAD_PATH, uuid = null) => {
  const [image, setImage] = useState(null);
  const [imageUri, setImageUri] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  /**
   * 이미지 선택
   */
  const pickImage = useCallback(async () => {
    try {
      const result = await imageService.pickImage();
      
      if (!result.canceled && result.assets[0]) {
        const selectedImage = result.assets[0];
        setImage(selectedImage.uri);
        setImageUri(selectedImage.uri);
        return selectedImage;
      }
      return null;
    } catch (error) {
      Alert.alert('오류', TALK_CONSTANTS.MESSAGES.PICK_IMAGE_ERROR);
      console.error('이미지 선택 오류:', error);
      return null;
    }
  }, []);

  /**
   * 이미지 제거
   */
  const removeImage = useCallback(() => {
    setImage(null);
    setImageUri(null);
  }, []);

  /**
   * 이미지 업로드
   */
  const uploadImageHandler = useCallback(async () => {
    if (!imageUri) {
      return null;
    }

    try {
      setUploadingImage(true);
      const imageUrl = await uploadImage(imageUri, uploadPath, uuid);
      return imageUrl;
    } catch (error) {
      Alert.alert('오류', TALK_CONSTANTS.MESSAGES.UPLOAD_FAILED);
      console.error('이미지 업로드 오류:', error);
      return null;
    } finally {
      setUploadingImage(false);
    }
  }, [imageUri, uploadPath, uuid]);

  /**
   * 이미지 초기화
   */
  const resetImage = useCallback(() => {
    setImage(null);
    setImageUri(null);
    setUploadingImage(false);
  }, []);

  return {
    // 상태
    image,
    imageUri,
    uploadingImage,
    
    // 함수
    pickImage,
    removeImage,
    uploadImage: uploadImageHandler,
    resetImage,
    
    // 유틸리티
    hasImage: !!imageUri,
    canUpload: !!imageUri && !uploadingImage
  };
}; 