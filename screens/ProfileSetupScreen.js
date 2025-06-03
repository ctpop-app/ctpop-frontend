import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Text, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
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
import { ORIENTATION_OPTIONS, MAX_PHOTOS } from '../components/profile-setup/constants';

const ProfileSetupScreen = () => {
  const navigation = useNavigation();
  const { user, setHasProfile, setUserProfile } = userStore();
  const [isSaving, setIsSaving] = useState(false);
  const [photoList, setPhotoList] = useState(Array(MAX_PHOTOS).fill(null));

  // user 상태 확인
  useEffect(() => {
    console.log('ProfileSetupScreen - 현재 상태:', {
      user: user,
      hasProfile: userStore.getState().hasProfile,
      userProfile: userStore.getState().userProfile
    });
    
    if (!user || !user.uuid) {
      console.error('사용자 정보가 없습니다:', user);
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
  } = useProfileForm(user?.uuid, {
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

  const {
    photos,
    isLoading: isPhotoLoading,
    error: photoError,
    addPhoto,
    removePhoto,
    uploadPhotos
  } = usePhotoGrid(user?.uuid);

  const handlePhotoPress = async (index) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '사진 접근 권한이 필요합니다.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const photo = {
          uri: result.assets[0].uri,
          type: 'image/jpeg/png',
          name: `photo_${Date.now()}.jpg`
        };
        
        // photoList 업데이트
        const newPhotoList = [...photoList];
        newPhotoList[index] = photo;
        setPhotoList(newPhotoList);
        
        // usePhotoGrid의 addPhoto 호출
        addPhoto(photo);
      }
    } catch (error) {
      Alert.alert('오류', '사진 선택 중 오류가 발생했습니다.');
    }
  };

  const handlePhotoRemove = (index) => {
    removePhoto(index);
    const newPhotoList = [...photoList];
    newPhotoList[index] = null;
    setPhotoList(newPhotoList);
  };

  const handlePhotoMove = (fromIndex, toIndex) => {
    const newPhotoList = [...photoList];
    const [movedPhoto] = newPhotoList.splice(fromIndex, 1);
    newPhotoList.splice(toIndex, 0, movedPhoto);
    setPhotoList(newPhotoList);
  };

  const handleSave = async () => {
    if (isSaving) return;

    try {
      setIsSaving(true);
      console.log('프로필 저장 시작:', { user, formData, photoList });

      // 1. 사진 업로드
      const photosToUpload = photoList.filter(photo => photo !== null);
      console.log('업로드할 사진:', photosToUpload);
      
      if (photosToUpload.length === 0) {
        throw new Error('대표 사진을 등록해주세요.');
      }
      
      // usePhotoGrid의 photos 배열 업데이트
      photosToUpload.forEach(photo => {
        if (!photos.find(p => p.uri === photo.uri)) {
          addPhoto(photo);
        }
      });
      
      let photoUrls = [];
      if (photosToUpload.length > 0) {
        photoUrls = await uploadPhotos();
        console.log('사진 업로드 결과:', photoUrls);
        
        if (!photoUrls || photoUrls.length === 0) {
          throw new Error('사진 업로드에 실패했습니다.');
        }
      }

      // 2. 프로필 정보 저장 (사진 URL 포함)
      console.log('프로필 저장 시작 - formData:', formData);
      console.log('프로필 저장 시작 - photoUrls:', photoUrls);
      
      const profileData = await handleSubmit({
        mainPhotoURL: photoUrls[0],  // 첫 번째 사진을 대표사진으로
        photoURLs: photoUrls
      });
      console.log('프로필 저장 결과:', profileData);
      
      if (!profileData) {
        throw new Error('프로필 저장에 실패했습니다.');
      }

      // 3. 프로필 생성 완료 상태로 변경
      const store = userStore.getState();
      console.log('프로필 저장 전 상태:', {
        hasProfile: store.hasProfile,
        userProfile: store.userProfile
      });
      
      store.setUserProfile(profileData);  // userProfile과 hasProfile을 함께 업데이트
      
      // 상태가 제대로 업데이트되었는지 확인
      const updatedState = userStore.getState();
      console.log('프로필 저장 완료, 현재 상태:', {
        hasProfile: updatedState.hasProfile,
        userProfile: updatedState.userProfile
      });

      // 4. 홈 화면으로 이동
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: ROUTES.MAIN.HOME
            }
          ]
        })
      );
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
                  onPhotoPress={handlePhotoPress}
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
