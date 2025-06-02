import { v4 as uuidv4 } from 'uuid';
import { Timestamp } from 'firebase/firestore';

class Message {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.chatId = data.chatId;
    this.content = data.content;
    this.senderId = data.senderId;
    this.timestamp = data.timestamp || Timestamp.now();
    this.isRead = data.isRead || false;
    this.type = data.type || 'text';
    this.metadata = data.metadata || {};
    this.status = data.status || 'sending';
    this.error = data.error || null;
  }

  // 텍스트 메시지 생성
  static createText(chatId, senderId, content) {
    if (!content || typeof content !== 'string') {
      throw new Error('메시지 내용이 올바르지 않습니다.');
    }

    return new Message({
      chatId,
      senderId,
      content,
      type: 'text'
    });
  }

  // 이미지 메시지 생성
  static createImage(chatId, senderId, imageUrl, imageSize, imageWidth, imageHeight) {
    if (!imageUrl) {
      throw new Error('이미지 URL이 필요합니다.');
    }

    return new Message({
      chatId,
      senderId,
      content: imageUrl,
      type: 'image',
      metadata: {
        imageUrl,
        imageSize,
        imageWidth,
        imageHeight
      }
    });
  }

  // 시스템 메시지 생성
  static createSystem(chatId, content, systemType) {
    return new Message({
      chatId,
      senderId: 'system',
      content,
      type: 'system',
      metadata: {
        systemType
      }
    });
  }

  // 메시지 상태 업데이트
  updateStatus(status) {
    const validStatuses = ['sending', 'sent', 'delivered', 'read', 'failed'];
    if (!validStatuses.includes(status)) {
      throw new Error('올바르지 않은 메시지 상태입니다.');
    }
    this.status = status;
  }

  // 에러 정보 설정
  setError(code, message) {
    this.error = { code, message };
    this.status = 'failed';
  }

  // 읽음 상태 업데이트
  markAsRead() {
    this.isRead = true;
    this.status = 'read';
  }

  // Firestore 데이터로 변환
  toFirestore() {
    return {
      chatId: this.chatId,
      content: this.content,
      senderId: this.senderId,
      timestamp: this.timestamp,
      isRead: this.isRead,
      type: this.type,
      metadata: this.metadata,
      status: this.status,
      error: this.error
    };
  }

  // Firestore 데이터로부터 객체 생성
  static fromFirestore(id, data) {
    return new Message({
      id,
      ...data
    });
  }

  // 유효성 검사
  validate() {
    if (!this.chatId) {
      throw new Error('채팅방 ID가 필요합니다.');
    }

    if (!this.senderId) {
      throw new Error('발신자 ID가 필요합니다.');
    }

    if (!this.content) {
      throw new Error('메시지 내용이 필요합니다.');
    }

    const validTypes = ['text', 'image', 'system'];
    if (!validTypes.includes(this.type)) {
      throw new Error('올바르지 않은 메시지 타입입니다.');
    }

    if (this.type === 'image' && !this.metadata.imageUrl) {
      throw new Error('이미지 메시지에는 이미지 URL이 필요합니다.');
    }

    if (this.type === 'system' && !this.metadata.systemType) {
      throw new Error('시스템 메시지에는 시스템 타입이 필요합니다.');
    }

    return true;
  }
}

export default Message; 