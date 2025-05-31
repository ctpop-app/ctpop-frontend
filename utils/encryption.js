import CryptoJS from 'crypto-js';

// 환경 변수에서 키를 가져오거나 기본값 사용
const SECRET_KEY = process.env.REACT_APP_ENCRYPTION_KEY || 'default-secure-key-for-development';

// 전화번호 해시화 (암호화 대신 해시 사용)
export const encryptPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return null;
  try {
    // 전화번호를 문자열로 변환하고 해시
    const phoneStr = String(phoneNumber);
    return CryptoJS.SHA256(phoneStr).toString();
  } catch (error) {
    console.error('전화번호 해시화 오류:', error);
    return null;
  }
};

// 해시된 전화번호는 복호화할 수 없으므로 복호화 함수는 제거 