import io from 'socket.io-client/dist/socket.io.js';
import apiClient from './client';
import config from '../utils/config';

class SocketApi {
  constructor() {
    this.socket = null;
    this.uuid = null;  // uuid를 클래스 멤버로 저장
  }

  async connect(uuid) {
    console.log('SocketApi: connect called with uuid:', uuid);
    console.log('SocketApi: current socket exists?', !!this.socket);
    
    if (this.socket) {
      console.log('SocketApi: socket exists, returning');
      return;
    }
    
    this.uuid = uuid;
    
    try {
      const response = await apiClient.get('/test/echo?message=test', { 
        authenticated: false,
        timeout: 5000 
      });

      if (response.data === 'test') {
        const baseUrl = apiClient.defaults.baseURL;
        const wsUrl = baseUrl.replace('http://', 'ws://').replace(':8080', ':9090');
        console.log('SocketApi: Connecting to WebSocket:', wsUrl);
        
        this.socket = io(wsUrl, {
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          query: { uuid },
          timeout: 10000
        });

        this.socket.on('connect', () => {
          console.log('SocketApi: socket connected successfully');
        });

        this.socket.on('connect_error', (error) => {
          console.log('SocketApi: connection error details:', {
            message: error.message,
            description: error.description,
            type: error.type,
            stack: error.stack
          });
        });

        this.socket.on('error', (error) => {
          console.log('SocketApi: socket error:', {
            message: error.message,
            description: error.description,
            type: error.type,
            stack: error.stack
          });
        });

        this.socket.io.on('reconnect_attempt', () => {
          console.log('SocketApi: reconnection attempt');
          this.socket.io.opts.query = { uuid: this.uuid };
        });

        this.socket.io.on('reconnect_error', (error) => {
          console.log('SocketApi: reconnection error:', {
            message: error.message,
            description: error.description,
            type: error.type,
            stack: error.stack
          });
        });
      } else {
        console.log('SocketApi: Server connection test failed');
      }
    } catch (error) {
      console.log('SocketApi: Error during socket initialization:', {
        message: error.message,
        stack: error.stack
      });
    }
  }

  disconnect() {
    console.log('SocketApi: disconnect called');
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.uuid = null;  // uuid 초기화
    }
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
    const connected = this.socket?.connected || false;
    console.log('SocketApi: isConnected called, returning:', connected);
    return connected;
  }
}

export const socketApi = new SocketApi(); 