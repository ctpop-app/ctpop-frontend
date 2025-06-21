import { useState, useCallback, useEffect } from 'react';
import { socketService } from '../services/socketService';
import { useAuth } from './useAuth';

// 전역 소켓 연결 상태 관리
let globalSocketConnected = false;

export const useSocket = () => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState([]);

  // 사용자 상태 변경 핸들러
  const handleUserStatus = useCallback(({ uuid, isOnline }) => {
    console.log('Handling user status:', { uuid, isOnline });
    setOnlineUsers(prev => {
      if (isOnline) {
        // 이미 존재하지 않는 경우에만 추가
        return prev.includes(uuid) ? prev : [...prev, uuid];
      } else {
        // 연결 해제된 사용자 제거
        return prev.filter(userId => userId !== uuid);
      }
    });
  }, []);

  // 온라인 사용자 목록 핸들러 (서버에서 받은 실제 연결된 사용자 목록)
  const handleOnlineUsersList = useCallback((users) => {
    console.log('Received online users list from server:', users);
    setOnlineUsers(users);
  }, []);

  // 소켓 연결
  const connect = useCallback(async () => {
    if (!user?.uuid) return;
    
    // 이미 연결되어 있으면 이벤트 리스너만 설정
    if (globalSocketConnected) {
      socketService.on('userStatus', handleUserStatus);
      socketService.on('onlineUsersList', handleOnlineUsersList);
      // 현재 온라인 사용자 목록 요청
      socketService.emit('getOnlineUsers');
      return;
    }
    
    // 새로운 연결 시도
    try {
      const connected = await socketService.connect(user.uuid);
      
      if (connected) {
        globalSocketConnected = true;
        socketService.on('userStatus', handleUserStatus);
        socketService.on('onlineUsersList', handleOnlineUsersList);
        
        // 서버에서 현재 온라인 사용자 목록 요청
        socketService.emit('getOnlineUsers');
      } else {
        globalSocketConnected = false;
      }
    } catch (error) {
      globalSocketConnected = false;
    }
  }, [user?.uuid, handleUserStatus, handleOnlineUsersList]);

  // 소켓 연결 해제 (전역에서만 호출)
  const disconnect = useCallback(async () => {
    socketService.off('userStatus', handleUserStatus);
    socketService.off('onlineUsersList', handleOnlineUsersList);
    
    // 전역 연결 해제는 App.js에서만 수행
    if (globalSocketConnected) {
      await socketService.disconnect();
      globalSocketConnected = false;
    }
  }, [handleUserStatus, handleOnlineUsersList]);

  // 사용자가 온라인인지 확인
  const isUserOnline = useCallback((uuid) => {
    return onlineUsers.includes(uuid);
  }, [onlineUsers]);

  // 컴포넌트 마운트 시 이벤트 리스너만 설정 (연결 해제하지 않음)
  useEffect(() => {
    if (user?.uuid) {
      connect();
    }
    // 컴포넌트 언마운트 시 이벤트 리스너만 제거 (소켓 연결은 유지)
    return () => {
      socketService.off('userStatus', handleUserStatus);
      socketService.off('onlineUsersList', handleOnlineUsersList);
    };
  }, [user?.uuid, connect, handleUserStatus, handleOnlineUsersList]);

  return {
    isUserOnline,
    onlineUsers,
    connect,
    disconnect
  };
}; 