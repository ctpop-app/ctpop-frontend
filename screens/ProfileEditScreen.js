import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { PhotoGrid } from '../components/profile-setup/photo-grid/PhotoGrid';
import { useProfileForm } from '../hooks/useProfileForm';
import { usePhotoGrid } from '../hooks/usePhotoGrid';
import { FormInput } from '../components/profile-setup/form-inputs/FormInput';
import { OptionSelector } from '../components/profile-setup/form-inputs/OptionSelector';
import { LocationSelector } from '../components/profile-setup/form-inputs/LocationSelector';
import { Button } from '../components/Button';
import { ProfileHeader } from '../components/profile-setup/common/ProfileHeader';
import { ORIENTATION_OPTIONS, MAX_PHOTOS } from '../components/profile-setup/constants';
import { profileService } from '../services/profileService';
import userStore from '../store/userStore';

const ProfileEditScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { currentProfile } = route.params || {};
  const { setUserProfile } = userStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 모든 로직을 훅으로 이동
  const {
    photoList,
    handlePhotoPress,
    removePhoto,
    handlePhotoMove,
    uploadPhotos,
    isLoading: isPhotoLoading
  } = usePhotoGrid(currentProfile?.uuid, currentProfile?.photoURLs || []);

  const {
    formData,
    errors,
    isLoading: isFormLoading,
    updateField,
    handleSubmit
  } = useProfileForm(currentProfile?.uuid, {
    nickname: currentProfile?.nickname || '',
    age: currentProfile?.age || '',
    height: currentProfile?.height || '',
    weight: currentProfile?.weight || '',
    city: currentProfile?.city || '',
    district: currentProfile?.district || '',
    orientation: currentProfile?.orientation || '',
    bio: currentProfile?.bio || '',
    mainPhotoURL: currentProfile?.mainPhotoURL || '',
    photoURLs: currentProfile?.photoURLs || []
  });

  useEffect(() => {
    if (!currentProfile) {
      setError('프로필 정보를 불러올 수 없습니다.');
      navigation.goBack();
      return;
    }

    if (!currentProfile.uuid) {
      setError('프로필 정보가 올바르지 않습니다.');
      navigation.goBack();
      return;
    }

    setIsLoading(false);
  }, [currentProfile, navigation]);

  const handleSave = async () => {
    try {
      // 사진 업로드
      const photoURLs = await uploadPhotos();
      if (!photoURLs) {
        Alert.alert('오류', '사진 업로드에 실패했습니다.');
        return;
      }

      // 프로필 저장
      const profileData = await handleSubmit({
        mainPhotoURL: photoURLs[0],
        photoURLs: photoURLs
      });

      if (profileData) {
        setUserProfile(profileData);
        navigation.goBack();
      }
    } catch (error) {
      console.error('프로필 저장 실패:', error);
      setError(error.message);
      Alert.alert('오류', error.message || '프로필 저장에 실패했습니다.');
    }
  };

  if (isLoading || isPhotoLoading || isFormLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text>로딩 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ProfileHeader
        title="프로필 수정"
        subtitle="프로필 정보를 수정해보세요"
      />
      <View style={styles.scrollContainer}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView 
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
              <View style={styles.photoSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>프로필 사진</Text>
                  <View style={styles.requiredBadge}>
                    <Text style={styles.requiredText}>필수</Text>
                  </View>
                </View>
                <Text style={styles.sectionSubtitle}>
                  최대 6장까지 등록 가능합니다
                  <Text style={styles.requiredNote}> (대표사진 필수)</Text>
                </Text>
                <PhotoGrid
                  photos={photoList}
                  onPhotoPress={handlePhotoPress}
                  onPhotoRemove={removePhoto}
                  onPhotoMove={handlePhotoMove}
                  isLoading={isPhotoLoading}
                  error={error}
                />
              </View>

              <View style={styles.form}>
                <Text style={styles.sectionTitle}>기본 정보</Text>
                <FormInput
                  value={formData.nickname}
                  onChangeText={(value) => updateField('nickname', value)}
                  placeholder="닉네임 *"
                  error={errors.nickname}
                  editable={!isFormLoading}
                />

                <FormInput
                  value={formData.age}
                  onChangeText={(value) => updateField('age', value)}
                  placeholder="나이"
                  keyboardType="number-pad"
                  error={errors.age}
                  editable={!isFormLoading}
                />

                <View style={styles.row}>
                  <FormInput
                    style={styles.inputHalf}
                    value={formData.height}
                    onChangeText={(value) => updateField('height', value)}
                    placeholder="키(cm)"
                    keyboardType="number-pad"
                    error={errors.height}
                    editable={!isFormLoading}
                  />
                  <FormInput
                    style={styles.inputHalf}
                    value={formData.weight}
                    onChangeText={(value) => updateField('weight', value)}
                    placeholder="체중(kg)"
                    keyboardType="number-pad"
                    error={errors.weight}
                    editable={!isFormLoading}
                  />
                </View>

                <Text style={styles.sectionTitle}>성향</Text>
                <OptionSelector
                  options={ORIENTATION_OPTIONS}
                  selectedValue={formData.orientation}
                  onSelect={(value) => updateField('orientation', value)}
                  disabled={isFormLoading}
                />

                <Text style={styles.sectionTitle}>지역</Text>
                <View style={styles.locationContainer}>
                  <LocationSelector
                    selectedCity={formData.city}
                    selectedDistrict={formData.district}
                    onCitySelect={(value) => updateField('city', value)}
                    onDistrictSelect={(value) => updateField('district', value)}
                    disabled={isFormLoading}
                  />
                </View>

                <Text style={styles.sectionTitle}>자기소개</Text>
                <FormInput
                  value={formData.bio}
                  onChangeText={(value) => updateField('bio', value)}
                  placeholder="자기소개를 입력하세요"
                  multiline
                  numberOfLines={4}
                  error={errors.bio}
                  editable={!isFormLoading}
                />
              </View>

              <Button
                title="저장하기"
                onPress={handleSave}
                disabled={isPhotoLoading || isFormLoading}
                loading={isPhotoLoading || isFormLoading}
                style={styles.saveButton}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 110 : 100,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  content: {
    padding: 16,
  },
  photoSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  requiredBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  requiredText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  requiredNote: {
    color: '#FF6B6B',
    fontWeight: '500',
  },
  form: {
    marginTop: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputHalf: {
    width: '48%',
  },
  locationContainer: {
    marginVertical: 8,
  },
  saveButton: {
    marginTop: 24,
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileEditScreen; 