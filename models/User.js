/**
 * 사용자 인증 정보 모델
 */
export class User {
  constructor(props = {}) {
    this.uid = props.uid || null;              // 전화번호 (인증용)
    this.uuid = props.uuid || null;            // 고유 식별자
    this.firstAuthAt = props.firstAuthAt || null; // 최초 인증 시간
    this.lastAuthAt = props.lastAuthAt || null;   // 마지막 인증 시간
    this.isActive = props.isActive !== undefined ? props.isActive : true;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new User({
      uid: doc.id,
      ...data,
      firstAuthAt: data.firstAuthAt?.toDate() || null,
      lastAuthAt: data.lastAuthAt?.toDate() || null
    });
  }

  toFirestore() {
    const { uid, ...data } = this;
    return data;
  }
} 