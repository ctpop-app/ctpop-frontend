/**
 * 사용자 프로필 데이터 모델
 */
import { toKST, getUTCTimestamp } from '../utils/dateUtils';

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
    createdAt = null,
    updatedAt = null,
    lastActive = null
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
    this.createdAt = createdAt ? toKST(createdAt) : null;
    this.updatedAt = updatedAt ? toKST(updatedAt) : null;
    this.lastActive = lastActive ? toKST(lastActive) : null;
  }

  /**
   * Firestore 문서에서 Profile 객체 생성
   * @param {DocumentSnapshot} doc Firestore 문서
   * @returns {Profile} Profile 객체
   */
  static fromFirestore(doc) {
    const data = doc.data();
    return new Profile({
      id: doc.id,
      ...data,
      createdAt: data.createdAt ? toKST(data.createdAt) : null,
      updatedAt: data.updatedAt ? toKST(data.updatedAt) : null,
      lastActive: data.lastActive ? toKST(data.lastActive) : null
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
      createdAt: this.createdAt ? this.createdAt.toISOString() : getUTCTimestamp(),
      updatedAt: getUTCTimestamp(),
      lastActive: this.lastActive ? this.lastActive.toISOString() : getUTCTimestamp()
    };
  }

  /**
   * 프로필 데이터 유효성 검사
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  validate() {
    const errors = {};

    // 필수 필드 검사 (닉네임과 대표사진만 필수)
    if (!this.nickname) errors.nickname = '닉네임은 필수입니다.';
    if (!this.mainPhotoURL) errors.mainPhotoURL = '대표 사진은 필수입니다.';

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

    // 사진 URL 개수 검사
    if (this.photoURLs && this.photoURLs.length > 5) {
      errors.photoURLs = '추가 사진은 최대 5장까지 가능합니다.';
    }

    return Object.keys(errors).length === 0 ? null : errors;
  }
} 