import { useState, useEffect, useCallback } from 'react';
import { socketService } from '../services/socketService';
import { useAuth } from './useAuth';

// 전역 변수로 연결 상태 관리
let isConnecting = false;

export const useSocket = () => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  // 사용자 상태 변경 핸들러
  const handleStatusChange = useCallback((uuid, isOnline) => {
    setOnlineUsers(prev => {
      const newSet = new Set(prev);
      if (isOnline) {
        newSet.add(uuid);
      } else {
        newSet.delete(uuid);
      }
      return newSet;
    });
  }, []);

  // 소켓 연결 설정
  useEffect(() => {
    // 이미 연결 중이거나 user가 없으면 무시
    if (isConnecting || !user?.uuid) return;

    isConnecting = true;
    socketService.connect(user.uuid);
    
    // 현재 사용자의 온라인 상태 추가
    setOnlineUsers(prev => {
      const newSet = new Set(prev);
      newSet.add(user.uuid);
      return newSet;
    });

    // 하트비트 시작
    socketService.startHeartbeat();

    // cleanup 함수
    return () => {
      isConnecting = false;
      socketService.stopHeartbeat();
      socketService.disconnect();
    };
  }, [user?.uuid]); // user.uuid만 의존성으로 사용

  // 하트비트 로깅을 위한 별도의 useEffect
  useEffect(() => {
    if (onlineUsers.size > 0) {
      console.log('현재 접속자 목록:', Array.from(onlineUsers));
    }
  }, [onlineUsers]);

  // 특정 사용자의 온라인 상태 구독
  const subscribeToUser = useCallback((uuid) => {
    socketService.subscribeToUserStatus(uuid, (isOnline) => {
      handleStatusChange(uuid, isOnline);
    });
  }, [handleStatusChange]);

  // 특정 사용자의 온라인 상태 구독 해제
  const unsubscribeFromUser = useCallback((uuid) => {
    socketService.unsubscribeFromUserStatus(uuid, handleStatusChange);
  }, [handleStatusChange]);

  // 사용자가 온라인인지 확인
  const isUserOnline = useCallback((uuid) => {
    return onlineUsers.has(uuid);
  }, [onlineUsers]);

  return {
    isUserOnline,
    subscribeToUser,
    unsubscribeFromUser,
    onlineUsers
  };
}; 