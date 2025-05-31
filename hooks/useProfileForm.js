import { useState, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useUserStore } from '../store/userStore';
import { profileService } from '../services/profileService';

export const useProfileForm = (initialData = {}) => {
  const navigation = useNavigation();
  const { user } = useUserStore();
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = useCallback(() => {
    const newErrors = {};
    
    // 필수 필드 검증
    if (!formData.nickname) {
      newErrors.nickname = '닉네임은 필수입니다.';
    }
    if (!formData.mainPhotoURL) {
      newErrors.mainPhotoURL = '대표 사진은 필수입니다.';
    }
    if (!formData.location) {
      newErrors.location = '지역은 필수입니다.';
    }
    if (!formData.orientation) {
      newErrors.orientation = '성향은 필수입니다.';
    }

    // 숫자 필드 검증
    if (formData.age && (formData.age < 18 || formData.age > 100)) {
      newErrors.age = '나이는 18세 이상 100세 이하여야 합니다.';
    }
    if (formData.height && (formData.height < 140 || formData.height > 220)) {
      newErrors.height = '키는 140cm 이상 220cm 이하여야 합니다.';
    }
    if (formData.weight && (formData.weight < 30 || formData.weight > 200)) {
      newErrors.weight = '체중은 30kg 이상 200kg 이하여야 합니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;
    if (!user?.phoneNumber) {
      setErrors({ submit: '사용자 정보를 찾을 수 없습니다.' });
      return;
    }

    setIsLoading(true);
    try {
      const profileData = {
        ...formData,
        isActive: true
      };

      const savedProfile = await profileService.createProfile(user.phoneNumber, profileData);
      
      if (savedProfile) {
        navigation.navigate('Main');
      } else {
        setErrors({ submit: '프로필 저장에 실패했습니다.' });
      }
    } catch (error) {
      console.error('프로필 저장 실패:', error);
      setErrors({ submit: error.message || '프로필 저장에 실패했습니다.' });
    } finally {
      setIsLoading(false);
    }
  }, [formData, user, navigation, validateForm]);

  const updateField = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // 필드가 업데이트되면 해당 필드의 에러를 초기화
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  }, [errors]);

  return {
    formData,
    errors,
    isLoading,
    updateField,
    handleSubmit,
    validateForm
  };
}; 