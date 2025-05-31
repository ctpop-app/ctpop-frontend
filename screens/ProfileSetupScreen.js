import React, { useState, useEffect } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';
import { PhotoGrid } from '../components/profile-setup/photo-grid/PhotoGrid';
import { FormInput } from '../components/profile-setup/form-inputs/FormInput';
import { OptionSelector } from '../components/profile-setup/form-inputs/OptionSelector';
import { ProfileHeader } from '../components/profile-setup/common/ProfileHeader';
import { SaveButton } from '../components/profile-setup/common/SaveButton';
import { usePhotoGrid } from '../hooks/usePhotoGrid';
import { useProfileForm } from '../hooks/useProfileForm';
import { 
  MAX_PHOTOS, 
  ORIENTATION_OPTIONS
} from '../components/profile-setup/constants';
import { LocationSelector } from '../components/profile-setup/form-inputs/LocationSelector';

export default function ProfileSetupScreen({ route, navigation }) {
  const { phoneNumber, isEdit, currentProfile } = route.params || {};
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  
  // 모든 훅을 컴포넌트 최상단에서 선언
  const {
    photos,
    pickImage,
    removePhoto,
    movePhoto
  } = usePhotoGrid(MAX_PHOTOS);

  const {
    formData,
    saving,
    updateField,
    saveProfile
  } = useProfileForm(phoneNumber, navigation);

  useEffect(() => {
    if (isEdit && currentProfile) {
      // 기존 프로필 데이터로 폼 초기화
      updateField('nickname', currentProfile.nickname || '');
      updateField('age', currentProfile.age?.toString() || '');
      updateField('height', currentProfile.height?.toString() || '');
      updateField('weight', currentProfile.weight?.toString() || '');
      updateField('location', currentProfile.location || '');
      updateField('orientation', currentProfile.orientation || '');
      updateField('bio', currentProfile.bio || '');

      // 기존 사진들 로드
      const existingPhotos = [
        currentProfile.mainPhotoURL,
        ...(currentProfile.photoURLs || [])
      ].filter(Boolean);
      setPhotos(existingPhotos);
    }
  }, [isEdit, currentProfile]);

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      // 위치 정보 업데이트
      updateField('location', `${selectedCity} ${selectedDistrict}`.trim());
      
      // 프로필 저장
      await saveProfile(photos);

      // 프로필 저장 성공
      Alert.alert(
        '성공',
        isEdit ? '프로필이 수정되었습니다.' : '프로필이 저장되었습니다.',
        [
          {
            text: '확인',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainStack' }],
              });
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('오류', error.message || '프로필 저장 중 오류가 발생했습니다.');
    }
  };

  const validateForm = () => {
    // 필수 항목 검증
    if (!formData.nickname?.trim()) {
      Alert.alert('오류', '닉네임을 입력해주세요');
      return false;
    }
    if (!photos[0]) {
      Alert.alert('오류', '대표사진을 등록해주세요');
      return false;
    }
    return true;
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 10 }}>
        <ProfileHeader />

        <PhotoGrid
          photos={photos}
          onPhotoPress={pickImage}
          onPhotoRemove={removePhoto}
          onPhotoMove={movePhoto}
        />
        
        <View style={styles.form}>
          <FormInput
            value={formData.nickname}
            onChangeText={(value) => updateField('nickname', value)}
            placeholder="닉네임 *"
          />
          <FormInput
            value={formData.age}
            onChangeText={(value) => updateField('age', value)}
            placeholder="나이"
            keyboardType="number-pad"
          />
          <View style={styles.row}>
            <FormInput
              style={styles.inputHalf}
              value={formData.height}
              onChangeText={(value) => updateField('height', value)}
              placeholder="키(cm)"
              keyboardType="number-pad"
            />
            <FormInput
              style={styles.inputHalf}
              value={formData.weight}
              onChangeText={(value) => updateField('weight', value)}
              placeholder="몸무게(kg)"
              keyboardType="number-pad"
            />
          </View>

          <OptionSelector
            label="성향"
            options={ORIENTATION_OPTIONS}
            selectedValue={formData.orientation}
            onSelect={(value) => updateField('orientation', value)}
          />

          <LocationSelector
            selectedCity={selectedCity}
            selectedDistrict={selectedDistrict}
            onCitySelect={setSelectedCity}
            onDistrictSelect={setSelectedDistrict}
          />

          <FormInput
            value={formData.bio}
            onChangeText={(value) => updateField('bio', value)}
            placeholder="자기소개를 입력하세요"
            multiline
            numberOfLines={4}
          />

          <SaveButton
            onPress={handleSave}
            disabled={saving}
            loading={saving}
          />
        </View>
      </ScrollView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  form: { padding: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  inputHalf: { width: '48%' }
}); 
