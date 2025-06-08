import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Text, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { ROUTES } from '../navigation/constants';
import { useProfileForm } from '../hooks/useProfileForm';
import { usePhotoGrid } from '../hooks/usePhotoGrid';
import { PhotoGrid } from '../components/profile-setup/photo-grid/PhotoGrid';
import { FormInput } from '../components/profile-setup/form-inputs/FormInput';
import { OptionSelector } from '../components/profile-setup/form-inputs/OptionSelector';
import { LocationSelector } from '../components/profile-setup/form-inputs/LocationSelector';
import { Button } from '../components/Button';
import { ProfileHeader } from '../components/profile-setup/common/ProfileHeader';
import userStore from '../store/userStore';
import { ORIENTATION_OPTIONS } from '../components/profile-setup/constants';
import { profileService } from '../services/profileService';

const ProfileSetupScreen = () => {
  const navigation = useNavigation();
  const { user, setUserProfile } = userStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    photoList,
    handlePhotoPress,
    removePhoto,
    handlePhotoMove,
    uploadPhotos,
    isLoading: isPhotoLoading,
    isValid: isPhotoValid
  } = usePhotoGrid(user?.uuid || '');

  const {
    formData,
    errors,
    isLoading: isFormLoading,
    updateField,
    isValid: isFormValid,
    handleSubmit
  } = useProfileForm(user?.uuid || '');

  useEffect(() => {
    if (!user?.uuid) {
      setError('사용자 정보를 불러올 수 없습니다. 다시 로그인해주세요.');
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: ROUTES.AUTH.LOGIN }]
        })
      );
    } else {
      setIsLoading(false);
    }
  }, [user, navigation]);

  const handleSave = async () => {
    if (!user?.uuid) {
      Alert.alert('오류', '사용자 정보를 불러올 수 없습니다.');
      return;
    }

    if (!isPhotoValid || !isFormValid) {
      Alert.alert('오류', '사용자 정보를 불러올 수 없습니다.');
      return;
    }

    // 닉네임이 없으면 에러 표시
    if (!formData.nickname) {
      Alert.alert('오류', '닉네임을 입력해주세요.');
      return;
    }

    try {
      // 사진 업로드
      const photoUrls = await uploadPhotos();
      if (!photoUrls) {
        Alert.alert('오류', '사진 업로드에 실패했습니다.');
        return;
      }

      // 프로필 저장
      const profileData = await handleSubmit({
        mainPhotoURL: photoUrls[0],
        photoURLs: photoUrls
      });

      if (profileData) {
        Alert.alert('성공', '프로필이 저장되었습니다.');
        navigation.reset({
          index: 0,
          routes: [{ name: ROUTES.MAIN }]
        });
      }
    } catch (error) {
      console.error('프로필 생성 실패:', error);
      setError(error.message);
      Alert.alert('오류', error.message || '프로필 저장에 실패했습니다.');
    }
  };

  if (isLoading || !user?.uuid || !isPhotoValid) {
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
        title="프로필 생성"
        subtitle="나를 표현하는 프로필을 만들어보세요"
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

export default ProfileSetupScreen; 
