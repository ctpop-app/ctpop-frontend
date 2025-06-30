import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { talkService } from '../services/talkService';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';
import { TALK_CONSTANTS } from '../constants/talkConstants';

/**
 * 토크 작성 및 제출 관련 로직을 관리하는 커스텀 훅
 * @param {Function} onSuccess - 성공 시 콜백 함수
 * @param {Function} onError - 에러 시 콜백 함수
 * @returns {Object} 토크 제출 관련 상태와 함수들
 */
export const useTalkSubmit = (onSuccess = null, onError = null) => {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { profile, get: loadProfile } = useProfile();

  // 컴포넌트 마운트 시 프로필 로드
  useEffect(() => {
    if (user?.uuid && !profile) {
      loadProfile();
    }
  }, [user?.uuid, profile, loadProfile]);

  /**
   * 내용 변경
   */
  const handleContentChange = useCallback((text) => {
    setContent(text);
  }, []);

  /**
   * 내용 초기화
   */
  const resetContent = useCallback(() => {
    setContent('');
  }, []);

  /**
   * 토크 제출
   */
  const submitTalk = useCallback(async (imageUrl = null) => {
    console.log('=== 토크 제출 시작 ===');
    console.log('content:', content);
    console.log('user:', user);
    console.log('profile:', profile);
    console.log('profile?.nickname:', profile?.nickname);
    console.log('user?.nickname:', user?.nickname);
    
    if (!content.trim()) {
      Alert.alert('알림', TALK_CONSTANTS.MESSAGES.CONTENT_REQUIRED);
      return false;
    }

    // 내용 검증
    const validationResult = talkService.validateTalkContent(content);
    console.log('validationResult:', validationResult);
    if (!validationResult.isValid) {
      Alert.alert('알림', validationResult.errors[0]);
      return false;
    }

    try {
      setSubmitting(true);
      
      console.log('사용할 uuid:', user?.uuid);
      
      // talkService.createTalk은 (uuid, content, imageUri) 순서로 파라미터를 받음 (nickname 제거)
      const result = await talkService.createTalk(
        user?.uuid,
        content,
        imageUrl
      );
      
      Alert.alert('성공', TALK_CONSTANTS.MESSAGES.SUCCESS);
      resetContent();
      
      if (onSuccess) {
        onSuccess(result);
      }
      return true;
    } catch (error) {
      console.error('토크 제출 에러 상세:', error);
      const errorMessage = error.message || TALK_CONSTANTS.MESSAGES.SUBMIT_FAILED;
      Alert.alert('오류', errorMessage);
      
      if (onError) {
        onError(error);
      }
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [content, user, profile, onSuccess, onError, resetContent]);

  /**
   * 토크 초기화
   */
  const resetTalk = useCallback(() => {
    setContent('');
    setSubmitting(false);
  }, []);

  return {
    // 상태
    content,
    submitting,
    
    // 함수
    handleContentChange,
    submitTalk,
    resetContent,
    resetTalk,
    
    // 유틸리티
    hasContent: !!content.trim(),
    canSubmit: !!content.trim() && !submitting,
    contentLength: content.length
  };
}; 