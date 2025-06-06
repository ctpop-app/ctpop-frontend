import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Text, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { ROUTES } from '../navigation/constants';
import { useProfileForm } from '../hooks/useProfileForm';
import { useProfilePhotos } from '../hooks/useProfilePhotos';
import { PhotoGrid } from '../components/profile-setup/photo-grid/PhotoGrid';
import { FormInput } from '../components/profile-setup/form-inputs/FormInput';
import { OptionSelector } from '../components/profile-setup/form-inputs/OptionSelector';
import { LocationSelector } from '../components/profile-setup/form-inputs/LocationSelector';
import { Button } from '../components/Button';
import { ProfileHeader } from '../components/profile-setup/common/ProfileHeader';
import userStore from '../store/userStore';
import { ORIENTATION_OPTIONS } from '../components/profile-setup/constants';

const ProfileSetupScreen = () => {
  const navigation = useNavigation();
  const { user, setUserProfile } = userStore();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user || !user.uuid) {
      Alert.alert('오류', '사용자 정보를 불러올 수 없습니다. 다시 로그인해주세요.');
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: ROUTES.AUTH.LOGIN }]
        })
      );
    }
  }, [user, navigation]);

  const {
    formData,
    errors,
    isLoading: isFormLoading,
    updateField,
    handleSubmit
  } = useProfileForm(user?.uuid);

  const {
    photos,
    photoList,
    isLoading: isPhotoLoading,
    error: photoError,
    handlePhotoPress,
    removePhoto,
    handlePhotoMove,
    uploadPhotos
  } = useProfilePhotos(user?.uuid);

  const onPhotoPress = async (index) => {
    const photo = await handlePhotoPress(index);
    if (photo) {
      const newPhotoList = [...photoList];
      newPhotoList[index] = photo;
      setPhotoList(newPhotoList);
    }
  };

  const handlePhotoRemove = (index) => {
    removePhoto(index);
    const newPhotoList = [...photoList];
    newPhotoList[index] = null;
    setPhotoList(newPhotoList);
  };

  const handleSave = async () => {
    if (isSaving) return;

    try {
      setIsSaving(true);
      
      // 1. 사진 업로드
      const uploadedURLs = await uploadPhotos();
      
      // 2. 프로필 데이터 저장
      const profileData = await handleSubmit({
        mainPhotoURL: uploadedURLs[0] || null,
        photoURLs: uploadedURLs
      });
      
      // 3. 프로필 생성 완료 상태로 변경
      setUserProfile(profileData);

      // 4. 홈 화면으로 이동
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }]
      });
    } catch (error) {
      console.error('프로필 저장 중 오류:', error);
      Alert.alert('오류', error.message);
    } finally {
      setIsSaving(false);
    }
  };

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
                  onPhotoPress={onPhotoPress}
                  onPhotoRemove={handlePhotoRemove}
                  onPhotoMove={handlePhotoMove}
                  isLoading={isPhotoLoading}
                  error={photoError}
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
                disabled={isSaving || isFormLoading || isPhotoLoading}
                loading={isSaving}
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
});

export default ProfileSetupScreen; 
