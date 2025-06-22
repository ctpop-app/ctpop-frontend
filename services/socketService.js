import { socketApi } from '../api/socket';
import { profileService } from './profileService';
import { getCurrentKST } from '../utils/dateUtils';
import useUserStore from '../store/userStore';

let heartbeatInterval = null;

const startHeartbeat = () => {
  console.log('SocketService: Setting up heartbeat interval...');
  heartbeatInterval = setInterval(() => {
    if (socketApi.isConnected()) {
      console.log('Ping sent');
      socketApi.emit('heartbeat');
    } else {
      console.log('Socket not connected, skipping heartbeat');
    }
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
    useUserStore.getState().setOnlineStatus(true);
  });

  socketApi.on('disconnect', async () => {
    console.log('Socket disconnected');
    stopHeartbeat();
    useUserStore.getState().setOnlineStatus(false);
    
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

  socketApi.on('userStatus', ({ uuid, isOnline }) => {
    console.log('User status update:', { uuid, isOnline });
    // 소켓이 연결된 상태에서만 이벤트 emit
    if (socketApi.isConnected()) {
      socketApi.emit('userStatusUpdate', { uuid, isOnline });
    } else {
      console.log('Socket not connected, skipping userStatusUpdate emit');
    }
  });

  // 실시간 거리 정보 수신 - 직접 userStore에 저장
  socketApi.on('nearbyDistances', (distances) => {
    console.log('🎯 Received nearby distances from backend:', distances);
    console.log('📊 Distance data type:', typeof distances);
    console.log('📊 Distance data keys:', Object.keys(distances || {}));
    useUserStore.getState().setNearbyDistances(distances);
  });

  // 소켓이 연결된 상태에서만 온라인 사용자 목록 요청
  if (socketApi.isConnected()) {
    socketApi.emit('getOnlineUsers');
  }
};

const connect = async (uuid) => {
  console.log('SocketService: Starting connection...');
  try {
    const connected = await socketApi.connect(uuid);
    if (connected) {
      setupEventListeners();
      console.log('SocketService: Starting heartbeat...');
      startHeartbeat();
      return true;
    } else {
      console.log('SocketService: Connection failed, not starting heartbeat');
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

// 위치 업데이트 전송
const updateLocation = (latitude, longitude) => {
  if (socketApi.isConnected()) {
    const locationData = {
      latitude,
      longitude,
      timestamp: Date.now()
    };
    console.log('Sending location update:', locationData);
    socketApi.emit('updateLocation', locationData);
  } else {
    console.log('Socket not connected, cannot send location update');
  }
};

export const socketService = {
  connect,
  disconnect,
  startHeartbeat,
  stopHeartbeat,
  updateLocation,
  isConnected: () => socketApi.isConnected(),
  getUuid: () => socketApi.getUuid(),
  on: (event, callback) => socketApi.on(event, callback),
  off: (event, callback) => socketApi.off(event, callback),
  emit: (event, data) => {
    if (socketApi.isConnected()) {
      socketApi.emit(event, data);
    } else {
      console.log(`Socket not connected, skipping ${event} emit`);
    }
  }
}; 