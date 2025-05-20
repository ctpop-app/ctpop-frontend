/**
 * 사용자 프로필 데이터 모델
 */
export class Profile {
  constructor(data = {}) {
    this.id = data.id || null;
    this.uid = data.uid || null;         // Firebase 인증 ID 또는 전화번호
    this.nickname = data.nickname || ''; // 닉네임 (필수)
    this.age = data.age || null;         // 나이
    this.height = data.height || null;   // 키 (cm)
    this.weight = data.weight || null;   // 몸무게 (kg)
    this.location = data.location || ''; // 지역 (광역시도)
    this.bio = data.bio || '';           // 소개
    this.preference = data.preference || ''; // 성향 (트젠, CD, 러버)
    this.photoURL = data.photoURL || null; // 프로필 사진
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.lastActive = data.lastActive || new Date();
  }

  /**
   * Firestore 문서에서 프로필 객체 생성
   * @param {Object} doc Firestore 문서 스냅샷
   * @returns {Profile} 프로필 객체
   */
  static fromFirestore(doc) {
    const data = doc.data();
    return new Profile({
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      lastActive: data.lastActive?.toDate() || new Date()
    });
  }

  /**
   * Firestore에 저장할 수 있는 객체로 변환
   * @returns {Object} Firestore에 저장할 객체
   */
  toFirestore() {
    return {
      uid: this.uid,
      nickname: this.nickname,
      age: this.age,
      height: this.height,
      weight: this.weight,
      location: this.location,
      bio: this.bio,
      preference: this.preference,
      photoURL: this.photoURL,
      createdAt: this.createdAt,
      updatedAt: new Date(),
      isActive: this.isActive,
      lastActive: this.lastActive
    };
  }
} 