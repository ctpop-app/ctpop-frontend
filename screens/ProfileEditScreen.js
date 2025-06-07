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
import { profile } from '../api';
import userStore from '../store/userStore';

const ProfileEditScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { currentProfile } = route.params || {};
  const { setUserProfile } = userStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // usePhotoGrid에서 photoList와 사진 관련 메서드만 사용
  const {
    photoList,
    handlePhotoPress,
    removePhoto,
    handlePhotoMove,
    uploadPhotos
  } = usePhotoGrid(currentProfile?.id, currentProfile?.photoURLs || []);

  useEffect(() => {
    if (!currentProfile) {
      Alert.alert('오류', '프로필 정보를 불러올 수 없습니다.');
      navigation.goBack();
      return;
    }
    setIsLoading(false);
  }, [currentProfile, navigation]);

  const {
    formData,
    errors,
    isLoading: isFormLoading,
    updateField,
    handleSubmit
  } = useProfileForm(currentProfile?.id, {
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

  console.log('Current Profile PhotoURLs:', currentProfile?.photoURLs);
  console.log('PhotoList:', photoList);

  const handleSave = async () => {
    if (isSaving) return;
    try {
      setIsSaving(true);
      // 1. 사진 업로드 준비 - 중복 제거 및 유효한 사진만 필터링
      const uniquePhotos = photoList.filter((item, index, self) => 
        item?.photo?.uri && 
        index === self.findIndex((t) => t?.photo?.uri === item?.photo?.uri)
      );
      
      const photosToUpload = uniquePhotos.filter(item => item?.photo?.uri);
      if (photosToUpload.length === 0) {
        throw new Error('대표 사진을 등록해주세요.');
      }
      // 2. file://로 된 새 사진만 따로 모으고, 기존 https:// 사진은 그대로 저장
      const localPhotos = [];
      const existingPhotoURLs = [];
      photosToUpload.forEach(item => {
        if (!item?.photo?.uri) return;
        const uri = item.photo.uri;
        if (uri.startsWith('file://')) {
          localPhotos.push({ uri });
        } else if (uri.startsWith('https://')) {
          existingPhotoURLs.push(uri);
        }
      });
      // 3. 새로 추가된 사진만 Storage에 업로드
      let newPhotoURLs = [];
      if (localPhotos.length > 0) {
        newPhotoURLs = await uploadPhotos(); // 여러 장 한 번에 업로드
      }
      // 4. photoList 순서대로 최종 https:// URL 배열 만들기
      let newPhotoIndex = 0;
      const finalPhotoURLs = photosToUpload.map(item => {
        const uri = item?.photo?.uri;
        if (uri?.startsWith('file://')) {
          return newPhotoURLs[newPhotoIndex++];
        } else if (uri?.startsWith('https://')) {
          return uri;
        }
        return null;
      }).filter(Boolean);
      if (finalPhotoURLs.length === 0) {
        throw new Error('사진 업로드에 실패했습니다.');
      }

      // 5. Firestore에 프로필 정보 저장 (대표사진, 전체 사진 배열)
      const profileData = await profile.updateProfile(currentProfile.id, {
        id: currentProfile.id,
        nickname: formData.nickname,
        age: formData.age,
        height: formData.height,
        weight: formData.weight,
        city: formData.city,
        district: formData.district,
        orientation: formData.orientation,
        bio: formData.bio,
        mainPhotoURL: finalPhotoURLs[0],
        photoURLs: finalPhotoURLs,
        createdAt: currentProfile.createdAt,
        updatedAt: new Date()
      });

      // Profile 객체가 반환되면 성공으로 처리
      if (!profileData || !profileData.id) {
        throw new Error('프로필 저장에 실패했습니다.');
      }
      setUserProfile(profileData);
      // 6. 이전 화면으로 이동
      navigation.goBack();
    } catch (error) {
      console.error('프로필 저장 중 오류:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      Alert.alert('오류', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
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
                  isLoading={false}
                  error={null}
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
                disabled={isSaving}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileEditScreen; 