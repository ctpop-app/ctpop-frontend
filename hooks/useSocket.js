import { useState, useCallback, useEffect } from 'react';
import { socketService } from '../services/socketService';
import { useAuth } from './useAuth';

export const useSocket = () => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  // 사용자 상태 변경 핸들러
  const handleUserStatus = useCallback(({ uuid, isOnline }) => {
    console.log('Handling user status:', { uuid, isOnline });
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

  // 온라인 사용자 목록 핸들러
  const handleOnlineUsersList = useCallback((users) => {
    console.log('Received online users list:', users);
    setOnlineUsers(new Set(users));
  }, []);

  // 소켓 연결
  const connect = useCallback(() => {
    if (!user?.uuid) return;
    
    socketService.connect(user.uuid);
    socketService.on('userStatusUpdate', handleUserStatus);
    socketService.on('onlineUsersList', handleOnlineUsersList);
    
    // 현재 사용자의 온라인 상태 추가
    setOnlineUsers(prev => {
      const newSet = new Set(prev);
      newSet.add(user.uuid);
      return newSet;
    });
  }, [user?.uuid, handleUserStatus, handleOnlineUsersList]);

  // 소켓 연결 해제
  const disconnect = useCallback(async () => {
    socketService.off('userStatusUpdate', handleUserStatus);
    socketService.off('onlineUsersList', handleOnlineUsersList);
    await socketService.disconnect();
  }, [handleUserStatus, handleOnlineUsersList]);

  // 사용자가 온라인인지 확인
  const isUserOnline = useCallback((uuid) => {
    return onlineUsers.has(uuid);
  }, [onlineUsers]);

  // 컴포넌트 마운트/언마운트 시 이벤트 리스너 설정/해제
  useEffect(() => {
    if (user?.uuid) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [user?.uuid, connect, disconnect]);

  return {
    isUserOnline,
    onlineUsers,
    connect,
    disconnect
  };
}; 