import { v4 as uuidv4 } from 'uuid';
import { Timestamp } from 'firebase/firestore';

class Chat {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.participants = data.participants || [];
    this.lastMessage = data.lastMessage || null;
    this.unreadCount = data.unreadCount || {};
    this.createdAt = data.createdAt || Timestamp.now();
    this.updatedAt = data.updatedAt || Timestamp.now();
  }

  // 채팅방 생성
  static create(participants) {
    if (!Array.isArray(participants) || participants.length < 2) {
      throw new Error('채팅방은 최소 2명의 참여자가 필요합니다.');
    }

    return new Chat({
      participants,
      unreadCount: participants.reduce((acc, userId) => {
        acc[userId] = 0;
        return acc;
      }, {})
    });
  }

  // 마지막 메시지 업데이트
  updateLastMessage(message) {
    this.lastMessage = {
      content: message.content,
      senderId: message.senderId,
      timestamp: message.timestamp,
      type: message.type
    };
    this.updatedAt = Timestamp.now();
  }

  // 읽지 않은 메시지 수 업데이트
  updateUnreadCount(userId, count) {
    if (!this.participants.includes(userId)) {
      throw new Error('채팅방 참여자가 아닙니다.');
    }
    this.unreadCount[userId] = count;
  }

  // 채팅방 참여자 추가
  addParticipant(userId) {
    if (this.participants.includes(userId)) {
      throw new Error('이미 참여 중인 사용자입니다.');
    }
    this.participants.push(userId);
    this.unreadCount[userId] = 0;
    this.updatedAt = Timestamp.now();
  }

  // 채팅방 참여자 제거
  removeParticipant(userId) {
    const index = this.participants.indexOf(userId);
    if (index === -1) {
      throw new Error('참여 중이 아닌 사용자입니다.');
    }
    this.participants.splice(index, 1);
    delete this.unreadCount[userId];
    this.updatedAt = Timestamp.now();
  }

  // Firestore 데이터로 변환
  toFirestore() {
    return {
      participants: this.participants,
      lastMessage: this.lastMessage,
      unreadCount: this.unreadCount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Firestore 데이터로부터 객체 생성
  static fromFirestore(id, data) {
    return new Chat({
      id,
      ...data
    });
  }

  // 유효성 검사
  validate() {
    if (!Array.isArray(this.participants) || this.participants.length < 2) {
      throw new Error('채팅방은 최소 2명의 참여자가 필요합니다.');
    }

    if (this.lastMessage) {
      if (!this.lastMessage.content || !this.lastMessage.senderId || !this.lastMessage.timestamp || !this.lastMessage.type) {
        throw new Error('마지막 메시지 정보가 올바르지 않습니다.');
      }
    }

    return true;
  }
}

export default Chat; 