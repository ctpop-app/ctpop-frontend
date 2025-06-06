/**
 * 사용자 인증 정보 모델
 */
export class User {
  constructor(props = {}) {
    this.id = props.id || null;              // Firestore 문서 ID (UUID)
    this.uuid = props.uuid || null;          // 시스템 UUID (데이터 연관 관계용)
    this.firstAuthAt = props.firstAuthAt || null; // 최초 인증 시간
    this.lastAuthAt = props.lastAuthAt || null;   // 마지막 인증 시간
    this.isActive = props.isActive !== undefined ? props.isActive : true;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new User({
      id: doc.id,
      ...data,
      firstAuthAt: data.firstAuthAt?.toDate() || null,
      lastAuthAt: data.lastAuthAt?.toDate() || null
    });
  }

  toFirestore() {
    const { id, ...data } = this;
    return data;
  }
} 