import { useState } from 'react';
import { profile } from '../api';

export const useProfileForm = (uuid) => {
  const [formData, setFormData] = useState({
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

  const updateField = (field, value) => {
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
  };

  const validateForm = () => {
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
  };

  const handleSubmit = async (photoData = {}) => {
    if (isLoading) return;

    setIsLoading(true);
    setErrors({});

    try {
      // 필수 필드 검증
      const requiredFields = ['nickname', 'age', 'height', 'weight', 'city', 'district'];
      const newErrors = {};

      requiredFields.forEach(field => {
        if (!formData[field]) {
          newErrors[field] = `${fieldLabels[field]}을(를) 입력해주세요.`;
        }
      });

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return null;
      }

      // 프로필 데이터 생성
      const profileData = {
        ...formData,
        ...photoData, // 사진 URL 데이터 추가
        uuid: userUuid
      };

      // 프로필 저장
      const response = await profile.createProfile(profileData);
      
      if (!response.success) {
        throw new Error(response.error);
      }

      return response.data;
    } catch (error) {
      console.error('프로필 저장 실패:', error);
      setErrors({ submit: error.message });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    errors,
    isLoading,
    updateField,
    handleSubmit,
    validateForm
  };
}; 