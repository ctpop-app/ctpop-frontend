import { addAccessLogToFirestore } from "../api/accessLog";
import AccessLog from "../models/AccessLog";

// 접속/에러 로그를 Firestore에 저장
export async function logAccessLog({ uuid, eventType, ipAddress = '', userAgent = '', success = true, message = '' }) {
  const log = new AccessLog({ uuid, eventType, ipAddress, userAgent, success, message });
  return await addAccessLogToFirestore(log.toFirestore());
} 