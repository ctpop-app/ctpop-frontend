import { socketApi } from '../api/socket';
import { profileService } from './profileService';
import { getCurrentKST } from '../utils/dateUtils';

class SocketService {
  constructor() {
    this.heartbeatInterval = null;
    this.statusListeners = new Map();
  }

  connect(uuid) {
    // TODO: 소켓 연결이 완성되면 아래 주석을 해제하고 소켓 연결을 활성화하세요
    // socketApi.connect(uuid);
    // this.setupEventListeners();
    // this.startHeartbeat();
    console.log('소켓 연결이 비활성화되어 있습니다.');
  }

  disconnect() {
    // TODO: 소켓 연결이 완성되면 아래 주석을 해제하고 연결을 해제하세요
    // socketApi.disconnect();
    // this.stopHeartbeat();
    console.log('소켓 연결이 비활성화되어 있습니다.');
  }

  setupEventListeners() {
    // TODO: 소켓 연결이 완성되면 아래 주석을 해제하고 이벤트 리스너를 활성화하세요
    // socketApi.on('connect', () => {
    //   console.log('Socket connected');
    // });

    // socketApi.on('disconnect', async () => {
    //   console.log('Socket disconnected');
    //   this.stopHeartbeat();
      
    //   if (socketApi.socket?.auth?.uuid) {
    //     try {
    //       await profileService.updateLastActive(socketApi.socket.auth.uuid, getCurrentKST());
    //     } catch (error) {
    //       console.error('Failed to update lastActive:', error);
    //     }
    //   }
    // });

    // socketApi.on('error', (error) => {
    //   console.error('Socket error:', error);
    // });

    // socketApi.on('userStatus', ({ uuid, isOnline }) => {
    //   const listeners = this.statusListeners.get(uuid);
    //   if (listeners) {
    //     listeners.forEach(callback => callback(isOnline));
    //   }
    // });
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (socketApi.isConnected()) {
        socketApi.emit('heartbeat');
      }
    }, 30000);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  subscribeToUserStatus(uuid, callback) {
    if (!this.statusListeners.has(uuid)) {
      this.statusListeners.set(uuid, new Set());
    }
    this.statusListeners.get(uuid).add(callback);
  }

  unsubscribeFromUserStatus(uuid, callback) {
    const listeners = this.statusListeners.get(uuid);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.statusListeners.delete(uuid);
      }
    }
  }
}

export const socketService = new SocketService(); 