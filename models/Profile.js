/**
 * 사용자 프로필 데이터 모델
 */
export class Profile {
  /**
   * 프로필 생성자
   * @param {Object} props 프로필 속성
   */
  constructor(props = {}) {
    this.id = props.id || null;
    this.uid = props.uid || null;         // Firebase 인증 ID 또는 전화번호
    this.nickname = props.nickname || ''; // 닉네임 (필수)
    this.age = props.age || null;         // 나이
    this.height = props.height || null;   // 키 (cm)
    this.weight = props.weight || null;   // 몸무게 (kg)
    this.location = props.location || ''; // 지역 (광역시도)
    this.bio = props.bio || '';           // 소개
    this.orientation = props.orientation || props.preference || ''; // 성향 (트젠, 시디, 러버)
    this.mainPhotoURL = props.mainPhotoURL || props.photoURL || null; // 대표 프로필 사진 (필수)
    this.photoURLs = props.photoURLs || []; // 추가 프로필 사진들 (최대 5개)
    this.isActive = props.isActive !== undefined ? props.isActive : true;
    this.createdAt = props.createdAt || null;
    this.updatedAt = props.updatedAt || null;
    this.lastActive = props.lastActive || null;
  }

  /**
   * Firestore 문서에서 Profile 객체 생성
   * @param {Object} doc Firestore 문서 스냅샷
   * @returns {Profile} Profile 객체
   */
  static fromFirestore(doc) {
    const data = doc.data();
    return new Profile({
      id: doc.id,
      ...data,
      // Firestore 타임스탬프를 JavaScript Date 객체로 변환
      createdAt: data.createdAt?.toDate() || null,
      updatedAt: data.updatedAt?.toDate() || null,
      lastActive: data.lastActive?.toDate() || null
    });
  }

  /**
   * Profile 객체를 Firestore에 저장할 수 있는 형태로 변환
   * @returns {Object} Firestore 문서 데이터
   */
  toFirestore() {
    // id는 문서 ID이므로 제외
    const { id, createdAt, updatedAt, lastActive, ...data } = this;
    return data;
  }
} 