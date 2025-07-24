import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

// Firestore에 접속/에러 로그 추가
export async function addAccessLogToFirestore(log) {
  return await addDoc(collection(db, "user_access_logs"), {
    ...log,
    createdAt: serverTimestamp()
  });
} 