import { socketApi } from '../api/socket';
import { profileService } from './profileService';
import { getCurrentKST } from '../utils/dateUtils';

class SocketService {
  constructor() {
    this.heartbeatInterval = null;
    this.statusListeners = new Map();
  }

  connect(uuid) {
    socketApi.connect(uuid);
    this.setupEventListeners();
    this.startHeartbeat();
  }

  async disconnect() {
    this.stopHeartbeat();
    this.statusListeners.clear();
    
    // 연결 해제 시 lastActive 업데이트
    if (socketApi.socket?.auth?.uuid) {
      try {
        await profileService.updateLastActive(socketApi.socket.auth.uuid, getCurrentKST());
      } catch (error) {
        console.error('Failed to update lastActive:', error);
      }
    }
    
    socketApi.disconnect();
  }

  setupEventListeners() {
    socketApi.on('connect', () => {
      console.log('Socket connected');
    });

    socketApi.on('disconnect', async () => {
      console.log('Socket disconnected');
      this.stopHeartbeat();
      
      // 연결 끊김 시 lastActive 업데이트
      if (socketApi.socket?.auth?.uuid) {
        try {
          await profileService.updateLastActive(socketApi.socket.auth.uuid, getCurrentKST());
        } catch (error) {
          console.error('Failed to update lastActive:', error);
        }
      }
    });

    socketApi.on('error', (error) => {
      console.error('Socket error:', error);
    });

    socketApi.on('userStatus', ({ uuid, isOnline }) => {
      const listeners = this.statusListeners.get(uuid);
      if (listeners) {
        listeners.forEach(callback => callback(isOnline));
      }
    });
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