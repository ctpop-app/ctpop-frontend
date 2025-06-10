import { socketApi } from '../api/socket';

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

  disconnect() {
    this.stopHeartbeat();
    this.statusListeners.clear();
    socketApi.disconnect();
  }

  setupEventListeners() {
    socketApi.on('connect', () => {
      console.log('Socket connected');
    });

    socketApi.on('disconnect', () => {
      console.log('Socket disconnected');
      this.stopHeartbeat();
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