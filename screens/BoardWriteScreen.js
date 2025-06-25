import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useCreateTalk } from '../hooks/useTalk';
import { uploadImage } from '../services/imageService';
import { useAuth } from '../hooks/useAuth';

export default function BoardWriteScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [imageUri, setImageUri] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const { loading, error, createTalk, validateContent, getLengthInfo } = useCreateTalk(user?.uuid);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const selectedImage = result.assets[0];
        setImage(selectedImage.uri);
        setImageUri(selectedImage.uri);
      }
    } catch (error) {
      Alert.alert('오류', '이미지를 선택할 수 없습니다.');
      console.error('이미지 선택 오류:', error);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImageUri(null);
  };

  const handleSubmit = async () => {
    try {
      // 유효성 검사
      const validation = validateContent(content);
      if (!validation.isValid) {
        Alert.alert('알림', validation.errors[0]);
        return;
      }

      Alert.alert(
        '토크 작성',
        '토크를 작성하시겠습니까?',
        [
          {
            text: '취소',
            style: 'cancel'
          },
          {
            text: '작성',
            onPress: async () => {
              try {
                let imageUrl = null;
                
                // 이미지가 있으면 업로드
                if (imageUri) {
                  setUploadingImage(true);
                  try {
                    imageUrl = await uploadImage(imageUri, 'talk', user?.uuid);
                  } catch (uploadError) {
                    Alert.alert('오류', '이미지 업로드에 실패했습니다.');
                    setUploadingImage(false);
                    return;
                  }
                  setUploadingImage(false);
                }
                
                // 토크 생성
                await createTalk(content, imageUrl);
                
                Alert.alert('성공', '토크가 작성되었습니다.');
                navigation.goBack();
              } catch (error) {
                setUploadingImage(false);
                Alert.alert('오류', error.message || '토크 작성에 실패했습니다.');
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('오류', error.message || '토크 작성에 실패했습니다.');
    }
  };

  const lengthInfo = getLengthInfo();
  const currentLength = content.length;
  const isOverLimit = currentLength > lengthInfo.maxLength;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        {/* 이미지 업로드 영역 */}
        <View style={styles.imageContainer}>
          {image ? (
            <View style={styles.imageWrapper}>
              <Image source={{ uri: image }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={removeImage}
                disabled={uploadingImage}
              >
                <Ionicons name="close-circle" size={24} color="#fff" />
              </TouchableOpacity>
              {uploadingImage && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.uploadingText}>업로드 중...</Text>
                </View>
              )}
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addImageButton}
              onPress={pickImage}
              disabled={uploadingImage}
            >
              <Ionicons name="camera-outline" size={32} color="#666" />
              <Text style={styles.addImageText}>사진 추가</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 내용 입력 영역 */}
        <TextInput
          style={[styles.input, isOverLimit && styles.inputError]}
          placeholder="무슨 생각을 하고 계신가요?"
          multiline
          maxLength={lengthInfo.maxLength}
          value={content}
          onChangeText={setContent}
          editable={!uploadingImage}
        />

        {/* 글자 수 표시 */}
        <View style={styles.characterCount}>
          <Text style={[
            styles.characterCountText,
            isOverLimit && styles.characterCountError
          ]}>
            {currentLength}/{lengthInfo.maxLength}
          </Text>
        </View>

        {/* 에러 메시지 */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>

      {/* 하단 버튼 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (loading || !content.trim() || isOverLimit || uploadingImage) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={loading || !content.trim() || isOverLimit || uploadingImage}
        >
          {loading || uploadingImage ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>토크하기</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  imageContainer: {
    marginBottom: 16,
  },
  imageWrapper: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
  },
  addImageButton: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    marginTop: 4,
    fontSize: 10,
    color: '#666',
  },
  input: {
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    padding: 0,
  },
  inputError: {
    borderColor: '#FF6B6B',
    borderWidth: 1,
  },
  characterCount: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  characterCountText: {
    fontSize: 12,
    color: '#666',
  },
  characterCountError: {
    color: '#FF6B6B',
  },
  errorContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
  },
  errorText: {
    color: '#fff',
    fontSize: 12,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  submitButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ddd',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 8,
  },
}); 