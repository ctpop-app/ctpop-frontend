// Firestore 접속/에러 로그 모델
export default class AccessLog {
  constructor({
    uuid,
    eventType,
    ipAddress = '',
    userAgent = '',
    success = true,
    message = '',
    createdAt = null
  }) {
    this.uuid = uuid; // 사용자 식별자
    this.eventType = eventType; // LOGIN, LOGOUT, ERROR 등
    this.ipAddress = ipAddress;
    this.userAgent = userAgent;
    this.success = success;
    this.message = message;
    this.createdAt = createdAt; // Firestore Timestamp (null이면 서버에서 자동)
  }

  // Firestore 저장용 객체 변환
  toFirestore() {
    return {
      uuid: this.uuid,
      eventType: this.eventType,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      success: this.success,
      message: this.message,
      createdAt: this.createdAt
    };
  }
} 