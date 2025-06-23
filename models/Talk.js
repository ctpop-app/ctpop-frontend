import { getCurrentKST } from '../utils/dateUtils';

export class Talk {
  constructor(data = {}) {
    this.id = data.id || null;
    this.content = data.content || '';
    this.imageUrl = data.imageUrl || null;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || getCurrentKST();
  }

  // Firestore 문서로 변환
  toFirestore() {
    return {
      id: this.id,
      content: this.content,
      imageUrl: this.imageUrl,
      isActive: this.isActive,
      createdAt: this.createdAt
    };
  }

  // Firestore 문서에서 모델로 변환
  static fromFirestore(doc) {
    const data = doc.data();
    return new Talk({
      id: doc.id,
      content: data.content,
      imageUrl: data.imageUrl,
      isActive: data.isActive,
      createdAt: data.createdAt?.toDate() || new Date()
    });
  }

  // 새 토크 생성
  static create(content, imageUrl = null) {
    return new Talk({
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
    return this.content && this.content.trim().length > 0;
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