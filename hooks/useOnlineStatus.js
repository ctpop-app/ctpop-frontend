import { useState, useEffect, useCallback } from 'react';
import { socketService } from '../services/socketService';
import { useAuth } from './useAuth';

export const useOnlineStatus = () => {
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
    if (user?.uuid) {
      socketService.connect(user.uuid);
      // 현재 사용자의 온라인 상태 추가
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.add(user.uuid);
        return newSet;
      });
    }
    return () => {
      socketService.disconnect();
    };
  }, [user]);

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