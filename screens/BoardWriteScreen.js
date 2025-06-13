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
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function BoardWriteScreen() {
  const navigation = useNavigation();
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);

  const pickImage = async () => {
    // 더미 이미지 추가
    setImage(`https://picsum.photos/100/100?random=${Date.now()}`);
  };

  const removeImage = () => {
    setImage(null);
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('알림', '내용을 입력해주세요.');
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
          onPress: () => {
            Alert.alert('알림', '토크가 작성되었습니다.');
            navigation.goBack();
          }
        }
      ]
    );
  };

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
              >
                <Ionicons name="close-circle" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addImageButton}
              onPress={pickImage}
            >
              <Ionicons name="camera-outline" size={32} color="#666" />
              <Text style={styles.addImageText}>사진 추가</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 내용 입력 영역 */}
        <TextInput
          style={styles.input}
          placeholder="무슨 생각을 하고 계신가요?"
          multiline
          maxLength={100}
          value={content}
          onChangeText={setContent}
        />
      </View>

      {/* 하단 버튼 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>토크하기</Text>
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
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 