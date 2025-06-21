import io from 'socket.io-client/dist/socket.io.js';
import apiClient from './client';

class SocketApi {
  constructor() {
    this.socket = null;
    this.connectionPromise = null;
  }

  async connect(uuid) {
    if (this.socket?.connected) {
      return true;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }
    
    try {
      const response = await apiClient.get('/test/echo?message=test', { 
        authenticated: false,
        timeout: 5000 
      });

      if (response.data === 'test') {
        const baseUrl = apiClient.defaults.baseURL;
        const wsUrl = baseUrl.replace('http://', 'ws://').replace(':8080', ':9090');
        
        this.connectionPromise = new Promise((resolve, reject) => {
          this.socket = io(wsUrl, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            randomizationFactor: 0.5,
            timeout: 10000,
            autoConnect: true,
            forceNew: true,
            query: { uuid }
          });

          const timeout = setTimeout(() => {
            reject(new Error('Connection timeout'));
          }, 10000);

          this.socket.on('connect', () => {
            clearTimeout(timeout);
            resolve(true);
          });

          this.socket.on('connect_error', (error) => {
            clearTimeout(timeout);
            reject(error);
          });

          this.socket.on('error', (error) => {
            clearTimeout(timeout);
            reject(error);
          });

          this.socket.io.on('reconnect_attempt', () => {
            this.socket.io.opts.query = { uuid };
          });

          this.socket.io.on('reconnect_error', (error) => {
            clearTimeout(timeout);
            reject(error);
          });

          this.socket.io.on('reconnect_failed', () => {
            clearTimeout(timeout);
            reject(new Error('Reconnection failed'));
          });
        });

        return await this.connectionPromise;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    } finally {
      this.connectionPromise = null;
    }
  }

  disconnect() {
    console.log('SocketApi: disconnect called');
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionPromise = null;
  }

  // 이벤트 리스너 등록
  on(event, callback) {
    console.log('SocketApi: registering listener for event:', event);
    this.socket?.on(event, callback);
  }

  // 이벤트 리스너 제거
  off(event, callback) {
    this.socket?.off(event, callback);
  }

  // 이벤트 발생
  emit(event, data) {
    console.log('SocketApi: emitting event:', event);
    this.socket?.emit(event, data);
  }

  // 연결 상태 확인
  isConnected() {
    return this.socket?.connected || false;
  }

  // 현재 연결된 소켓의 UUID 가져오기
  getUuid() {
    return this.socket?.io?.opts?.query?.uuid;
  }
}

export const socketApi = new SocketApi(); 