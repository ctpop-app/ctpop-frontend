import { getCurrentKST } from '../utils/dateUtils';

export class Talk {
  constructor(data = {}) {
    this.id = data.id || null;
    this.uuid = data.uuid || null;
    this.nickname = data.nickname || null;
    this.content = data.content || '';
    this.imageUrl = data.imageUrl || null;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || getCurrentKST();
  }

  // Firestore 문서로 변환 (id 필드 제외)
  toFirestore() {
    return {
      uuid: this.uuid,
      nickname: this.nickname,
      content: this.content,
      imageUrl: this.imageUrl,
      isActive: this.isActive,
      createdAt: this.createdAt
    };
  }

  // Firestore 문서에서 모델로 변환
  static fromFirestore(doc) {
    const data = doc.data();
    
    // createdAt 필드 안전하게 처리
    let createdAt;
    if (data.createdAt) {
      // Firestore Timestamp인지 확인
      if (data.createdAt.toDate && typeof data.createdAt.toDate === 'function') {
        createdAt = data.createdAt.toDate();
      } else if (data.createdAt instanceof Date) {
        createdAt = data.createdAt;
      } else {
        createdAt = new Date(data.createdAt);
      }
    } else {
      createdAt = new Date();
    }
    
    return new Talk({
      id: doc.id,  // Firestore의 doc.id 사용
      uuid: data.uuid,
      nickname: data.nickname,
      content: data.content,
      imageUrl: data.imageUrl,
      isActive: data.isActive,
      createdAt: createdAt
    });
  }

  // 새 토크 생성
  static create(uuid, nickname, content, imageUrl = null) {
    return new Talk({
      uuid,
      nickname,
      content,
      imageUrl,
      isActive: true
    });
  }

  // 토크 비활성화 (삭제)
  deactivate() {
    this.isActive = false;
    return this;
  }

  // 유효성 검사
  isValid() {
    return this.uuid && this.nickname && this.content && this.content.trim().length > 0;
  }

  // 내용 길이 제한 (100자)
  static getMaxContentLength() {
    return 100;
  }

  // 내용이 최대 길이를 초과하는지 확인
  isContentTooLong() {
    return this.content.length > Talk.getMaxContentLength();
  }
} 