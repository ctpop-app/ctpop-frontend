import { useState, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import notificationService from '../services/notificationService';
import { useAuth } from './useAuth';

export const useNotifications = () => {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [pushToken, setPushToken] = useState(null);
  const [permission, setPermission] = useState(null);
  const appState = useRef(AppState.currentState);

  // 알림 서비스 초기화
  useEffect(() => {
    const initializeNotifications = async () => {
      if (user?.uuid && !isInitialized) {
        try {
          const token = await notificationService.initialize();
          setPushToken(token);
          setIsInitialized(true);
          
          // 권한 상태 확인
          const { status } = await import('expo-notifications').then(n => n.getPermissionsAsync());
          setPermission(status);
          
          console.log('알림 훅 초기화 완료:', { token, permission: status });
        } catch (error) {
          console.error('알림 훅 초기화 실패:', error);
        }
      }
    };

    initializeNotifications();
  }, [user?.uuid, isInitialized]);

  // 앱 상태 변경 감지
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('앱이 다시 활성화됨');
        // 필요한 경우 알림 상태 업데이트
      }
      appState.current = nextAppState;
    });

    return () => subscription?.remove();
  }, []);

  // 현재 채팅방 설정
  const setCurrentChatRoom = (chatRoomId) => {
    notificationService.setCurrentChatRoomId(chatRoomId);
  };

  // 현재 채팅방 제거
  const clearCurrentChatRoom = () => {
    notificationService.clearCurrentChatRoomId();
  };

  // 새 메시지 알림 표시
  const showNewMessageNotification = async (message, chatRoomId, otherUser) => {
    if (!isInitialized) {
      console.log('알림 서비스가 초기화되지 않음');
      return;
    }

    try {
      await notificationService.showNewMessageNotification(message, chatRoomId, otherUser);
    } catch (error) {
      console.error('메시지 알림 표시 실패:', error);
    }
  };

  // 테스트 알림 표시
  const showTestNotification = async (title = '테스트 알림', body = '알림이 정상적으로 작동합니다') => {
    if (!isInitialized) {
      console.log('알림 서비스가 초기화되지 않음');
      return;
    }

    try {
      await notificationService.showLocalNotification(title, body, { type: 'test' });
    } catch (error) {
      console.error('테스트 알림 표시 실패:', error);
    }
  };

  // 알림 권한 재요청
  const requestPermission = async () => {
    try {
      const { status } = await import('expo-notifications').then(n => n.requestPermissionsAsync());
      setPermission(status);
      return status === 'granted';
    } catch (error) {
      console.error('알림 권한 요청 실패:', error);
      return false;
    }
  };

  // 정리
  useEffect(() => {
    return () => {
      notificationService.cleanup();
    };
  }, []);

  return {
    isInitialized,
    pushToken,
    permission,
    setCurrentChatRoom,
    clearCurrentChatRoom,
    showNewMessageNotification,
    showTestNotification,
    requestPermission,
  };
};