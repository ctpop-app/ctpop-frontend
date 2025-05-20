import * as ImagePicker from 'expo-image-picker';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, storage } from '../firebase';
import useUserStore from '../store/userStore';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

// 기본 프로필 이미지 URL
const DEFAULT_PROFILE_IMAGE = 'https://via.placeholder.com/150';

export default function ProfileSetupScreen({ navigation }) {
  const { updateUserProfile } = useUserStore();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [saving, setSaving] = useState(false);

  const genderOptions = ['남성', '여성', '논바이너리', '기타'];
  
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('권한이 필요합니다', '갤러리 접근 권한을 허용해주세요.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const uploadImage = async () => {
    if (!profileImage) return null;
    
    try {
      const response = await fetch(profileImage);
      const blob = await response.blob();
      
      const storageRef = ref(storage, `profileImages/${auth.currentUser.uid}`);
      await uploadBytes(storageRef, blob);
      
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error uploading image: ', error);
      return null;
    }
  };

  const saveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('알림', '이름을 입력해주세요.');
      return;
    }
    
    if (!age || isNaN(parseInt(age)) || parseInt(age) < 18) {
      Alert.alert('알림', '유효한 나이를 입력해주세요. 18세 이상이어야 합니다.');
      return;
    }
    
    if (!gender) {
      Alert.alert('알림', '성별을 선택해주세요.');
      return;
    }
    
    if (!location.trim()) {
      Alert.alert('알림', '위치를 입력해주세요.');
      return;
    }
    
    try {
      setSaving(true);
      
      let profilePhotoURL = null;
      if (profileImage) {
        profilePhotoURL = await uploadImage();
      }
      
      const userId = auth.currentUser.uid;
      const profileData = {
        name: name.trim(),
        age: parseInt(age),
        gender,
        location: location.trim(),
        bio: bio.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
        profilePhotoURL,
      };
      
      await setDoc(doc(db, 'users', userId), profileData);
      console.log('프로필 저장 성공');
      
      useUserStore.getState().fetchUserProfile(userId);
      
      Alert.alert('성공', '프로필이 저장되었습니다.', [
        { text: '확인', onPress: () => console.log('프로필 설정 완료') }
      ]);
      
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error) {
      console.error('프로필 저장 오류:', error);
      Alert.alert('오류', '프로필을 저장하는 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>프로필 설정</Text>
        <Text style={styles.subtitle}>당신에 대해 알려주세요!</Text>
      </View>

      <View style={styles.profileImageContainer}>
        <Image
          style={styles.profileImage}
          source={profileImage ? { uri: profileImage } : require('../assets/default-profile.png')}
        />
        <TouchableOpacity style={styles.changePhotoButton} onPress={pickImage}>
          <Text style={styles.changePhotoText}>사진 변경</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>이름</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="실명 또는 닉네임"
        />

        <Text style={styles.label}>나이</Text>
        <TextInput
          style={styles.input}
          value={age}
          onChangeText={setAge}
          placeholder="만 나이"
          keyboardType="number-pad"
        />

        <Text style={styles.label}>성별</Text>
        <View style={styles.genderOptions}>
          {genderOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.genderOption,
                gender === option && styles.selectedGenderOption
              ]}
              onPress={() => setGender(option)}
            >
              <Text
                style={[
                  styles.genderOptionText,
                  gender === option && styles.selectedGenderOptionText
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>위치</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="서울, 부산 등"
        />

        <Text style={styles.label}>자기소개</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          value={bio}
          onChangeText={setBio}
          placeholder="당신에 대해 간략히 설명해주세요"
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.savingButton]}
          onPress={saveProfile}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? '저장 중...' : '프로필 저장하기'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  changePhotoButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  changePhotoText: {
    color: '#444',
    fontSize: 14,
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  genderOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  genderOption: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  selectedGenderOption: {
    backgroundColor: '#FF6B6B',
  },
  genderOptionText: {
    color: '#444',
    fontSize: 14,
  },
  selectedGenderOptionText: {
    color: '#fff',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  savingButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 