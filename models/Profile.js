/**
 * 사용자 프로필 데이터 모델
 */
export class Profile {
  /**
   * 프로필 생성자
   * @param {Object} props 프로필 속성
   */
  constructor({
    uid, // UUID (사용자 식별자)
    nickname,
    age,
    height,
    weight,
    location,
    bio,
    orientation,
    mainPhotoURL,
    photoURLs = [],
    isActive = true,
    createdAt,
    updatedAt,
    lastActive
  }) {
    this.uid = uid;
    this.nickname = nickname;
    this.age = age;
    this.height = height;
    this.weight = weight;
    this.location = location;
    this.bio = bio;
    this.orientation = orientation;
    this.mainPhotoURL = mainPhotoURL;
    this.photoURLs = photoURLs;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.lastActive = lastActive;
  }

  /**
   * Firestore 문서에서 Profile 객체 생성
   * @param {DocumentSnapshot} doc Firestore 문서
   * @returns {Profile} Profile 객체
   */
  static fromFirestore(doc) {
    const data = doc.data();
    return new Profile({
      uid: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      lastActive: data.lastActive?.toDate()
    });
  }

  /**
   * Firestore에 저장할 데이터 객체 생성
   * @returns {Object} Firestore 데이터
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
      orientation: this.orientation,
      mainPhotoURL: this.mainPhotoURL,
      photoURLs: this.photoURLs,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastActive: this.lastActive
    };
  }

  /**
   * 프로필 데이터 유효성 검사
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  validate() {
    const errors = [];

    // 필수 필드 검사
    if (!this.nickname) errors.push('닉네임은 필수입니다.');
    if (!this.mainPhotoURL) errors.push('메인 사진은 필수입니다.');
    if (!this.location) errors.push('지역은 필수입니다.');
    if (!this.orientation) errors.push('성향은 필수입니다.');

    // 숫자 필드 범위 검사
    if (this.age && (this.age < 18 || this.age > 100)) {
      errors.push('나이는 18세 이상 100세 이하여야 합니다.');
    }
    if (this.height && (this.height < 140 || this.height > 220)) {
      errors.push('키는 140cm 이상 220cm 이하여야 합니다.');
    }
    if (this.weight && (this.weight < 30 || this.weight > 200)) {
      errors.push('체중은 30kg 이상 200kg 이하여야 합니다.');
    }

    // 사진 URL 개수 검사
    if (this.photoURLs && this.photoURLs.length > 5) {
      errors.push('추가 사진은 최대 5장까지 가능합니다.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
} 