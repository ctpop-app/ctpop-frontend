/**
 * 사용자 프로필 데이터 모델
 */
import { getCurrentKST } from '../utils/dateUtils';

// 닉네임 정책 상수
const NICKNAME_POLICY = {
  MIN_LENGTH: 2,
  MAX_LENGTH: 12,
  ALLOWED_CHARS: /^[가-힣a-zA-Z0-9]+$/, // 한글, 영문, 숫자만 허용
};

export class Profile {
  /**
   * 프로필 생성자
   * @param {Object} props 프로필 속성
   */
  constructor({
    id = null, // 문서 ID
    uuid, // 사용자 UUID (User와 연결)
    nickname,
    age,
    height,
    weight,
    city,
    district,
    bio,
    orientation,
    mainPhotoURL,
    photoURLs = [],
    isActive = true,
    lastActive = null,
    createdAt = null,
    updatedAt = null,
    blockedUuid = []
  }) {
    this.id = id;
    this.uuid = uuid;
    this.nickname = nickname;
    this.age = age;
    this.height = height;
    this.weight = weight;
    this.city = city;
    this.district = district;
    this.bio = bio;
    this.orientation = orientation;
    this.mainPhotoURL = mainPhotoURL;
    this.photoURLs = photoURLs;
    this.isActive = isActive;
    this.lastActive = lastActive ? getCurrentKST() : null;
    this.createdAt = createdAt ? getCurrentKST() : null;
    this.updatedAt = updatedAt ? getCurrentKST() : null;
    this.blockedUuid = blockedUuid;
  }

  /**
   * 닉네임 유효성 검사
   * @returns {string|null} 에러 메시지 또는 null
   */
  validateNickname() {
    if (!this.nickname) {
      return '닉네임은 필수입니다.';
    }

    if (this.nickname.length < NICKNAME_POLICY.MIN_LENGTH) {
      return `닉네임은 최소 ${NICKNAME_POLICY.MIN_LENGTH}자 이상이어야 합니다.`;
    }

    if (this.nickname.length > NICKNAME_POLICY.MAX_LENGTH) {
      return `닉네임은 최대 ${NICKNAME_POLICY.MAX_LENGTH}자까지 가능합니다.`;
    }

    return null;
  }

  /**
   * 프로필 데이터 유효성 검사
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  validate() {
    const errors = {};

    // 닉네임 검증
    const nicknameError = this.validateNickname();
    if (nicknameError) {
      errors.nickname = nicknameError;
    }

    // 대표사진 검증
    if (!this.mainPhotoURL) {
      errors.mainPhotoURL = '대표 사진은 필수입니다.';
    }

    // 선택적 필드의 유효성 검사 (값이 있는 경우에만 검사)
    if (this.age && (this.age < 18 || this.age > 100)) {
      errors.age = '나이는 18세 이상 100세 이하여야 합니다.';
    }
    if (this.height && (this.height < 140 || this.height > 220)) {
      errors.height = '키는 140cm 이상 220cm 이하여야 합니다.';
    }
    if (this.weight && (this.weight < 30 || this.weight > 200)) {
      errors.weight = '체중은 30kg 이상 200kg 이하여야 합니다.';
    }

    // 사진 URL 개수 검사 (null 체크 추가)
    if (!Array.isArray(this.photoURLs)) {
      errors.photoURLs = '사진 URL이 올바르지 않습니다.';
    } else if (this.photoURLs.length === 0) {
      errors.photoURLs = '최소 1장의 사진이 필요합니다.';
    } else if (this.photoURLs.length > 6) {
      errors.photoURLs = '추가 사진은 최대 6장까지 가능합니다.';
    }

    return Object.keys(errors).length === 0 ? null : errors;
  }

  /**
   * Firestore에서 가져온 데이터로 Profile 객체 생성
   * @param {Object} doc Firestore 문서
   * @returns {Profile}
   */
  static fromFirestore(doc) {
    const data = doc.data();
    return new Profile({
      id: doc.id,
      ...data
    });
  }

  /**
   * Firestore에 저장할 데이터 객체 생성
   * @returns {Object} Firestore 데이터
   */
  toFirestore() {
    return {
      uuid: this.uuid,
      nickname: this.nickname,
      age: this.age || null,
      height: this.height || null,
      weight: this.weight || null,
      city: this.city || '',
      district: this.district || '',
      bio: this.bio || '',
      orientation: this.orientation || null,
      mainPhotoURL: this.mainPhotoURL,
      photoURLs: this.photoURLs || [],
      isActive: this.isActive,
      lastActive: this.lastActive ? getCurrentKST() : null,
      createdAt: this.createdAt ? getCurrentKST() : getCurrentKST(),
      updatedAt: getCurrentKST(),
      blockedUuid: this.blockedUuid || []
    };
  }
} 