import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ROUTES } from '../navigation/constants';
import useUserStore from '../store/userStore';
import { profileService } from '../services/profileService';

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
      setErrors(prev => ({ ...prev, submit: '사용자 정보를 불러올 수 없습니다.' }));
      return false;
    }

    const newErrors = {};

    // 필수 필드 검증
    if (!formData.nickname) {
      newErrors.nickname = '닉네임을 입력해주세요.';
    }

    // 선택적 필드 검증
    if (formData.age) {
      const age = parseInt(formData.age);
      if (isNaN(age) || age < 18 || age > 100) {
        newErrors.age = '나이는 18-100세 사이여야 합니다.';
      }
    }

    if (formData.height) {
      const height = parseInt(formData.height);
      if (isNaN(height) || height < 140 || height > 220) {
        newErrors.height = '키는 140-220cm 사이여야 합니다.';
      }
    }

    if (formData.weight) {
      const weight = parseInt(formData.weight);
      if (isNaN(weight) || weight < 30 || weight > 150) {
        newErrors.weight = '체중은 30-150kg 사이여야 합니다.';
      }
    }

    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = '자기소개는 500자 이내여야 합니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, isValid]);

  const handleSubmit = useCallback(async (data) => {
    console.log('handleSubmit 시작 - 받은 데이터:', data);
    
    if (!isValid) {
      console.log('유효성 검사 실패 - isValid:', isValid);
      setErrors(prev => ({ ...prev, submit: '사용자 정보를 불러올 수 없습니다.' }));
      return null;
    }

    if (isLoading) {
      console.log('이미 로딩 중');
      return null;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // 필수 필드 검증
      const requiredFields = ['nickname'];
      const newErrors = {};

      requiredFields.forEach(field => {
        if (!formData[field]) {
          newErrors[field] = `${fieldLabels[field]}을(를) 입력해주세요.`;
        }
      });

      // 사진 검증
      if (!data.photoURLs || data.photoURLs.length === 0) {
        newErrors.photos = '최소 1장의 사진이 필요합니다.';
      }

      if (Object.keys(newErrors).length > 0) {
        console.log('검증 에러 발생:', newErrors);
        setErrors(newErrors);
        return null;
      }

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
      setErrors(prev => ({ ...prev, submit: error.message }));
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