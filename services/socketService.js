import { socketApi } from '../api/socket';
import { profileService } from './profileService';
import { getCurrentKST } from '../utils/dateUtils';
import { userStore } from '../store/userStore';

let heartbeatInterval = null;

const startHeartbeat = () => {
  console.log('SocketService: Setting up heartbeat interval...');
  heartbeatInterval = setInterval(() => {
    console.log('Ping sent');
    socketApi.emit('heartbeat');
  }, 30000);
};

const stopHeartbeat = () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
};

const setupEventListeners = () => {
  socketApi.on('connect', () => {
    console.log('Socket connected');
  });

  socketApi.on('disconnect', async () => {
    console.log('Socket disconnected');
    stopHeartbeat();
    
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

  socketApi.on('pong', () => {
    console.log('Pong received');
    console.log('Connection alive');
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
      startHeartbeat();
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
  stopHeartbeat();
  
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
  startHeartbeat,
  stopHeartbeat,
  isConnected: () => socketApi.isConnected(),
  getUuid: () => socketApi.getUuid(),
  on: (event, callback) => socketApi.on(event, callback),
  off: (event, callback) => socketApi.off(event, callback),
  emit: (event, data) => socketApi.emit(event, data)
}; 