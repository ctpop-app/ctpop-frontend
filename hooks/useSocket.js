import { useState, useCallback, useEffect } from 'react';
import { socketService } from '../services/socketService';
import { useAuth } from './useAuth';

// 전역 소켓 연결 상태 관리
let globalSocketConnected = false;
let isConnecting = false; // 연결 중인지 확인하는 플래그

// Hot Reload 시 전역 상태 초기화
if (__DEV__) {
  // 개발 모드에서만 전역 상태 초기화
  const resetGlobalState = () => {
    globalSocketConnected = false;
    isConnecting = false;
    console.log('Hot Reload: 전역 소켓 상태 초기화됨');
  };
  
  // 앱이 다시 로드될 때마다 호출
  if (global.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    resetGlobalState();
  }
}

export const useSocket = () => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState([]);

  // 사용자 상태 변경 핸들러 (불변 함수)
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

  // 온라인 사용자 목록 처리
  const handleOnlineUsersList = useCallback((data) => {
    console.log('📨 온라인 사용자 목록 수신:', data);
    
    if (!data || !Array.isArray(data)) {
      console.log('❌ 온라인 사용자 목록이 유효하지 않음:', data);
      return;
    }
    
    console.log(`✅ 온라인 사용자 ${data.length}명 수신됨`);
    setOnlineUsers(data);
    
    // 각 온라인 사용자에 대해 상태 업데이트
    data.forEach(userId => {
      console.log(`🟢 사용자 ${userId} 온라인 상태로 설정`);
    });
  }, []);

  // 소켓 연결 (불변 함수)
  const connect = useCallback(async () => {
    if (!user?.uuid) return;
    
    // 이미 연결되어 있으면 이벤트 리스너만 설정
    if (globalSocketConnected) {
      console.log('✅ 이미 소켓이 연결되어 있음. 이벤트 리스너만 설정');
      socketService.on('userStatus', handleUserStatus);
      socketService.on('onlineUsersList', handleOnlineUsersList);
      // 현재 온라인 사용자 목록 요청
      console.log('📡 온라인 사용자 목록 요청 중...');
      socketService.emit('getOnlineUsers');
      return;
    }
    
    // 이미 연결 중이면 중복 연결 방지
    if (isConnecting) {
      console.log('⏳ 이미 연결 중입니다. 중복 연결 시도 무시');
      return;
    }
    
    // 새로운 연결 시도
    try {
      isConnecting = true;
      console.log('🔄 새로운 소켓 연결 시도...');
      const connected = await socketService.connect(user.uuid);

      if (connected) {
        globalSocketConnected = true;
        console.log('✅ 소켓 연결 성공! 이벤트 리스너 설정 중...');
        socketService.on('userStatus', handleUserStatus);
        socketService.on('onlineUsersList', handleOnlineUsersList);
        // 서버에서 현재 온라인 사용자 목록 요청
        console.log('📡 온라인 사용자 목록 요청 중...');
        socketService.emit('getOnlineUsers');
      } else {
        globalSocketConnected = false;
        console.log('❌ 소켓 연결 실패');
      }
    } catch (error) {
      globalSocketConnected = false;
      console.error('❌ 소켓 연결 에러:', error);
    } finally {
      isConnecting = false;
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

  // 사용자 온라인 상태 확인
  const isUserOnline = useCallback((userId) => {
    const isOnline = onlineUsers.includes(userId);
    // console.log(`🔍 사용자 ${userId} 온라인 상태 확인:`, {
    //   isOnline,
    //   onlineUsersCount: onlineUsers.length,
    //   onlineUsers: onlineUsers.slice(0, 5) // 처음 5개만 로그에 표시
    // });
    return isOnline;
  }, [onlineUsers]);

  // 컴포넌트 마운트 시 이벤트 리스너만 설정 (연결 해제하지 않음)
  useEffect(() => {
    if (user?.uuid) {
      connect();
    }
    return () => {
      socketService.off('userStatus', handleUserStatus);
      socketService.off('onlineUsersList', handleOnlineUsersList);
    };
  }, [user?.uuid]);

  return {
    isUserOnline,
    onlineUsers,
    connect,
    disconnect
  };
}; 