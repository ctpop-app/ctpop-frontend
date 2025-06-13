import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ROUTES } from '../navigation/constants';
import useUserStore from '../store/userStore';
import { profileService } from '../services/profileService';
import { Profile } from '../models/Profile';

const fieldLabels = {
  nickname: '닉네임',
  age: '나이',
  height: '키',
  weight: '체중',
  city: '시/도',
  district: '시/군/구',
  orientation: '성향',
  bio: '자기소개'
};

export const useProfileForm = (uuid, initialData = null) => {
  const navigation = useNavigation();
  const { user } = useUserStore();

  // 상태 관리 훅들 - 항상 호출됨
  const [formData, setFormData] = useState(initialData || {
    nickname: '',
    age: '',
    height: '',
    weight: '',
    city: '',
    district: '',
    orientation: '',
    bio: '',
    mainPhotoURL: '',
    photoURLs: []
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // userId 유효성 검사 - 항상 호출됨
  useEffect(() => {
    if (!uuid) {
      setErrors(prev => ({ ...prev, uuid: '사용자 정보를 불러올 수 없습니다.' }));
      setIsValid(false);
    } else {
      setErrors(prev => {
        const { uuid, ...rest } = prev;
        return rest;
      });
      setIsValid(true);
    }
  }, [uuid]);

  const updateField = useCallback((field, value) => {
    if (!isValid) return;

    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // 필드 업데이트 시 해당 필드의 에러 제거
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  }, [errors, isValid]);

  const validateForm = useCallback(() => {
    if (!isValid) {
      const errorMessage = '사용자 정보를 불러올 수 없습니다.';
      setErrors(prev => ({ ...prev, submit: errorMessage }));
      Alert.alert('오류', errorMessage);
      return false;
    }

    const profile = new Profile({
      ...formData,
      uuid
    });

    const validationErrors = profile.validate();
    if (validationErrors) {
      setErrors(validationErrors);
      // 첫 번째 에러 메시지를 알림으로 표시
      const firstError = Object.values(validationErrors)[0];
      Alert.alert('입력 오류', firstError);
      return false;
    }

    return true;
  }, [formData, uuid, isValid]);

  const handleSubmit = useCallback(async (data) => {
    console.log('handleSubmit 시작 - 받은 데이터:', data);
    
    if (!isValid) {
      console.log('유효성 검사 실패 - isValid:', isValid);
      const errorMessage = '사용자 정보를 불러올 수 없습니다.';
      setErrors(prev => ({ ...prev, submit: errorMessage }));
      Alert.alert('오류', errorMessage);
      return null;
    }

    if (isLoading) {
      console.log('이미 로딩 중');
      return null;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // 프로필 데이터 생성
      const profileData = {
        ...formData,
        ...data, // 사진 URL 데이터 추가
        mainPhotoURL: data.mainPhotoURL || null // 빈 문자열 대신 null 사용
      };
      
      console.log('생성된 프로필 데이터:', profileData);

      // 프로필 저장 (생성 또는 업데이트)
      let response;
      if (initialData) {
        console.log('프로필 수정 시도');
        response = await profileService.update(uuid, profileData);
      } else {
        console.log('프로필 생성 시도');
        response = await profileService.create(uuid, profileData);
      }

      console.log('프로필 저장 응답:', response);
      
      if (!response) {
        throw new Error('프로필 저장에 실패했습니다.');
      }

      return response;
    } catch (error) {
      console.error('프로필 저장 실패:', error);
      const errorMessage = error.message || '프로필 저장 중 오류가 발생했습니다.';
      setErrors(prev => ({ ...prev, submit: errorMessage }));
      Alert.alert('오류', errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [formData, uuid, isLoading, isValid, initialData]);

  return {
    formData,
    errors,
    isLoading,
    isValid,
    updateField,
    handleSubmit,
    validateForm
  };
}; 