import React from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useImageUpload } from '../hooks/useImageUpload';
import { useTalkSubmit } from '../hooks/useTalkSubmit';
import { useAuth } from '../hooks/useAuth';
import { ImageUploader } from '../components/board/ImageUploader';
import { TextInputWithCounter } from '../components/board/TextInputWithCounter';
import { SubmitButton } from '../components/board/SubmitButton';
import { createTalkSubmitHandler } from '../utils/talkUtils';
import { TALK_CONSTANTS } from '../constants/talkConstants';

/**
 * 토크 작성 화면
 * 
 * 사용자가 새로운 토크를 작성할 수 있는 화면입니다.
 * 이미지 업로드, 텍스트 입력, 제출 기능을 제공합니다.
 * 
 * @returns {React.Component} 토크 작성 화면 컴포넌트
 */
export default function BoardWriteScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  // 커스텀 훅 사용
  const {
    imageUri,
    uploadingImage,
    pickImage,
    removeImage,
    uploadImage,
    hasImage
  } = useImageUpload(TALK_CONSTANTS.UPLOAD_PATH, user?.uuid);

  const {
    content,
    submitting,
    handleContentChange,
    submitTalk,
    canSubmit,
    contentLength
  } = useTalkSubmit(
    // 성공 콜백
    (data) => {
      navigation.goBack();
    },
    // 에러 콜백
    (error) => {
      console.error('토크 제출 오류:', error);
    }
  );

  // 토크 제출 핸들러 생성
  const handleSubmit = createTalkSubmitHandler({
    hasImage,
    uploadImage,
    submitTalk
  });

  const isOverLimit = contentLength > TALK_CONSTANTS.MAX_CONTENT_LENGTH;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 40}
    >
      <View style={styles.content}>
        {/* 이미지 업로드 컴포넌트 */}
        <ImageUploader
          imageUri={imageUri}
          uploadingImage={uploadingImage}
          onPickImage={pickImage}
          onRemoveImage={removeImage}
        />

        {/* 텍스트 입력 컴포넌트 */}
        <TextInputWithCounter
          value={content}
          onChangeText={handleContentChange}
          maxLength={TALK_CONSTANTS.MAX_CONTENT_LENGTH}
          editable={!uploadingImage}
        />
      </View>

      {/* 제출 버튼 컴포넌트 */}
      <View style={[styles.submitContainer, { paddingBottom: insets.bottom }]}>
        <SubmitButton
          loading={submitting || uploadingImage}
          disabled={!canSubmit || isOverLimit}
          onPress={handleSubmit}
        />
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
  submitContainer: {
    padding: 16,
  },
}); 