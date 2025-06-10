import { io } from 'socket.io-client';
import apiClient from './client';

class SocketApi {
  constructor() {
    this.socket = null;
  }

  connect(uuid) {
    if (this.socket) return;
    
    // apiClient의 get 메서드를 사용하여 baseURL 가져오기
    const wsUrl = apiClient.getUri() + '/ws';
    console.log('Connecting to WebSocket:', wsUrl);
    
    this.socket = io(wsUrl, {
      auth: { uuid },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // 이벤트 리스너 등록
  on(event, callback) {
    this.socket?.on(event, callback);
  }

  // 이벤트 리스너 제거
  off(event, callback) {
    this.socket?.off(event, callback);
  }

  // 이벤트 발생
  emit(event, data) {
    this.socket?.emit(event, data);
  }

  // 연결 상태 확인
  isConnected() {
    return this.socket?.connected || false;
  }
}

export const socketApi = new SocketApi(); 