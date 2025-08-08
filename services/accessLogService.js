import { addAccessLogToFirestore } from "../api/accessLog";
import AccessLog from "../models/AccessLog";

// 접속/에러 로그를 Firestore에 저장
export async function logAccessLog({ uuid, eventType, ipAddress = '', userAgent = '', success = true, message = '' }) {
  const log = new AccessLog({ uuid, eventType, ipAddress, userAgent, success, message });
  console.log('[logAccessLog] 파라미터:', { uuid, eventType, ipAddress, userAgent, success, message });
  try {
    const result = await addAccessLogToFirestore(log.toFirestore());
    console.log('[logAccessLog] Firestore 저장 성공:', result);
    return result;
  } catch (error) {
    console.error('[logAccessLog] Firestore 저장 실패:', error);
    throw error;
  }
} 