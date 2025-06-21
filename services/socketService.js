import { socketApi } from '../api/socket';
import { profileService } from './profileService';
import { getCurrentKST } from '../utils/dateUtils';
import { userStore } from '../store/userStore';

let connectionCheckInterval = null;

const startConnectionCheck = () => {
  console.log('Starting connection check...');
  connectionCheckInterval = setInterval(() => {
    if (!socketApi.isConnected()) {
      console.log('Connection lost, triggering reconnection...');
      // Socket.IO 자체 재연결 트리거
      socketApi.socket?.connect();
    }
  }, 10000); // 10초마다 체크
};

const stopConnectionCheck = () => {
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
    connectionCheckInterval = null;
  }
};

const setupEventListeners = () => {
  socketApi.on('connect', () => {
    console.log('Socket connected');
  });

  socketApi.on('disconnect', async () => {
    console.log('Socket disconnected');
    stopConnectionCheck();
    
    const uuid = socketApi.getUuid();
    if (uuid) {
      try {
        await profileService.updateLastActive(uuid, getCurrentKST());
      } catch (error) {
        console.error('Failed to update lastActive:', error);
      }
    }
  });

  socketApi.on('error', (error) => {
    console.error('Socket error:', error);
  });

  // 서버에서 직접 받은 사용자 상태 업데이트
  socketApi.on('userStatus', ({ uuid, isOnline }) => {
    console.log('User status update from server:', { uuid, isOnline });
  });

  // 소켓이 연결된 상태에서만 온라인 사용자 목록 요청
  if (socketApi.isConnected()) {
    socketApi.emit('getOnlineUsers');
  }
};

const connect = async (uuid) => {
  try {
    const connected = await socketApi.connect(uuid);
    
    if (connected) {
      setupEventListeners();
      startConnectionCheck();
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('SocketService: Connection error:', error);
    return false;
  }
};

const disconnect = async () => {
  stopConnectionCheck();
  
  const uuid = socketApi.getUuid();
  if (uuid) {
    try {
      await profileService.updateLastActive(uuid, getCurrentKST());
    } catch (error) {
      console.error('Failed to update lastActive:', error);
    }
  }
  
  socketApi.disconnect();
};

export const socketService = {
  connect,
  disconnect,
  isConnected: () => socketApi.isConnected(),
  getUuid: () => socketApi.getUuid(),
  on: (event, callback) => socketApi.on(event, callback),
  off: (event, callback) => socketApi.off(event, callback),
  emit: (event, data) => socketApi.emit(event, data)
}; 