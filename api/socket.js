import io from 'socket.io-client/dist/socket.io.js';
import apiClient from './client';
import config from '../utils/config';

class SocketApi {
  constructor() {
    this.socket = null;
    this.connectionPromise = null;
  }

  async connect(uuid) {
    console.log('SocketApi: connect called with uuid:', uuid);
    console.log('SocketApi: current socket exists?', !!this.socket);
    
    if (this.socket?.connected) {
      console.log('SocketApi: socket already connected, returning');
      return true;
    }

    if (this.connectionPromise) {
      console.log('SocketApi: connection in progress, returning existing promise');
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
        console.log('SocketApi: Connecting to WebSocket:', wsUrl);
        
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
            console.log('SocketApi: socket connected successfully');
            clearTimeout(timeout);
            resolve(true);
          });

          this.socket.on('connect_error', (error) => {
            console.log('SocketApi: connection error details:', {
              message: error.message,
              description: error.description,
              type: error.type,
              stack: error.stack
            });
            clearTimeout(timeout);
            reject(error);
          });

          this.socket.on('error', (error) => {
            console.log('SocketApi: socket error:', {
              message: error.message,
              description: error.description,
              type: error.type,
              stack: error.stack
            });
            clearTimeout(timeout);
            reject(error);
          });

          this.socket.io.on('reconnect_attempt', () => {
            console.log('SocketApi: reconnection attempt');
            this.socket.io.opts.query = { uuid };
          });

          this.socket.io.on('reconnect_error', (error) => {
            console.log('SocketApi: reconnection error:', {
              message: error.message,
              description: error.description,
              type: error.type,
              stack: error.stack
            });
            clearTimeout(timeout);
            reject(error);
          });

          this.socket.io.on('reconnect_failed', () => {
            console.log('SocketApi: reconnection failed');
            clearTimeout(timeout);
            reject(new Error('Reconnection failed'));
          });
        });

        return await this.connectionPromise;
      } else {
        console.log('SocketApi: Server connection test failed');
        return false;
      }
    } catch (error) {
      console.log('SocketApi: Error during socket initialization:', {
        message: error.message,
        stack: error.stack
      });
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
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.log(`SocketApi: Cannot emit ${event}, socket not connected`);
    }
  }

  // 연결 상태 확인
  isConnected() {
    const connected = this.socket?.connected || false;
    console.log('SocketApi: isConnected called, returning:', connected);
    return connected;
  }

  // 현재 연결된 소켓의 UUID 가져오기
  getUuid() {
    return this.socket?.io?.opts?.query?.uuid;
  }
}

export const socketApi = new SocketApi(); 