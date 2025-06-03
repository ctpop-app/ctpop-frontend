import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { profileService } from '../services/profileService';
import { imageService } from '../services/imageService';
import userStore from '../store/userStore';
import { ROUTES } from '../navigation/constants';

const ProfileEditScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { currentProfile } = route.params;
  const { setUserProfile } = userStore();
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState({
    nickname: currentProfile?.nickname || '',
    age: currentProfile?.age || '',
    height: currentProfile?.height || '',
    weight: currentProfile?.weight || '',
    city: currentProfile?.city || '',
    district: currentProfile?.district || '',
    bio: currentProfile?.bio || '',
    orientation: currentProfile?.orientation || '',
    mainPhotoURL: currentProfile?.mainPhotoURL || '',
    photoURLs: currentProfile?.photoURLs || []
  });

  const handleSave = async () => {
    if (!profile.nickname) {
      Alert.alert('알림', '닉네임을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const updatedProfile = await profileService.updateProfile(currentProfile.id, profile);
      setUserProfile(updatedProfile);
      Alert.alert('성공', '프로필이 수정되었습니다.');
      navigation.goBack();
    } catch (error) {
      console.error('프로필 수정 실패:', error);
      Alert.alert('오류', '프로필 수정에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async () => {
    try {
      const result = await imageService.pickImage();
      if (result.canceled) return;

      const newPhotoURL = result.assets[0].uri;
      setProfile(prev => ({
        ...prev,
        mainPhotoURL: newPhotoURL,
        photoURLs: [newPhotoURL, ...prev.photoURLs]
      }));
    } catch (error) {
      console.error('사진 업로드 실패:', error);
      Alert.alert('오류', '사진 업로드에 실패했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>프로필 수정</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>저장</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.photoSection}>
          <TouchableOpacity onPress={handlePhotoUpload} style={styles.photoContainer}>
            {profile.mainPhotoURL ? (
              <Image source={{ uri: profile.mainPhotoURL }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera" size={40} color="#999" />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.photoText}>프로필 사진 변경</Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>닉네임</Text>
            <TextInput
              style={styles.input}
              value={profile.nickname}
              onChangeText={(text) => setProfile(prev => ({ ...prev, nickname: text }))}
              placeholder="닉네임을 입력하세요"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>나이</Text>
            <TextInput
              style={styles.input}
              value={profile.age?.toString()}
              onChangeText={(text) => setProfile(prev => ({ ...prev, age: text }))}
              placeholder="나이를 입력하세요"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>키</Text>
            <TextInput
              style={styles.input}
              value={profile.height?.toString()}
              onChangeText={(text) => setProfile(prev => ({ ...prev, height: text }))}
              placeholder="키를 입력하세요 (cm)"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>체중</Text>
            <TextInput
              style={styles.input}
              value={profile.weight?.toString()}
              onChangeText={(text) => setProfile(prev => ({ ...prev, weight: text }))}
              placeholder="체중을 입력하세요 (kg)"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>지역</Text>
            <View style={styles.locationInputs}>
              <TextInput
                style={[styles.input, styles.locationInput]}
                value={profile.city}
                onChangeText={(text) => setProfile(prev => ({ ...prev, city: text }))}
                placeholder="시/도"
              />
              <TextInput
                style={[styles.input, styles.locationInput]}
                value={profile.district}
                onChangeText={(text) => setProfile(prev => ({ ...prev, district: text }))}
                placeholder="시/군/구"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>소개</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={profile.bio}
              onChangeText={(text) => setProfile(prev => ({ ...prev, bio: text }))}
              placeholder="자신을 소개해주세요"
              multiline
              numberOfLines={4}
            />
          </View>
        </View>
      </ScrollView>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FF6B6B" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  photoSection: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  photoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 10,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoText: {
    color: '#666',
    fontSize: 14,
  },
  formSection: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  locationInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  locationInput: {
    flex: 1,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileEditScreen; 