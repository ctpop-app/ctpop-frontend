import { socketApi } from '../api/socket';
import { profileService } from './profileService';
import { getCurrentKST } from '../utils/dateUtils';

class SocketService {
  constructor() {
    this.heartbeatInterval = null;
    this.statusListeners = new Map();
    this.lastPongTime = null;
    this.connectionCheckInterval = null;
  }

  connect(uuid) {
    console.log('SocketService: Starting connection...');
    socketApi.connect(uuid);
    this.setupEventListeners();
    console.log('SocketService: Starting heartbeat...');
    this.startHeartbeat();
    this.startConnectionCheck();
  }

  async disconnect() {
    this.stopHeartbeat();
    this.stopConnectionCheck();
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
      this.lastPongTime = Date.now();
    });

    socketApi.on('disconnect', async () => {
      console.log('Socket disconnected');
      this.stopHeartbeat();
      this.stopConnectionCheck();
      
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

    socketApi.on('pong', () => {
      console.log('Pong received');
      this.lastPongTime = Date.now();
      console.log('Connection alive');
    });

    socketApi.on('userStatus', ({ uuid, isOnline }) => {
      const listeners = this.statusListeners.get(uuid);
      if (listeners) {
        listeners.forEach(callback => callback(isOnline));
      }
    });
  }

  startHeartbeat() {
    console.log('SocketService: Setting up heartbeat interval...');
    this.heartbeatInterval = setInterval(() => {
      if (socketApi.isConnected()) {
        console.log('Ping sent');
        socketApi.emit('heartbeat');
      } else {
        console.log('Socket not connected, skipping heartbeat');
      }
    }, 30000);
  }

  startConnectionCheck() {
    this.connectionCheckInterval = setInterval(() => {
      if (this.lastPongTime && Date.now() - this.lastPongTime > 60000) { // 60초 동안 pong이 없으면
        console.log('Connection lost - attempting to reconnect');
        this.disconnect();
        this.connect(socketApi.uuid); // 재연결 시도
      }
    }, 10000); // 10초마다 체크
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  stopConnectionCheck() {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
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