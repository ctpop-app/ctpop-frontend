import CryptoJS from 'crypto-js';

// 환경 변수에서 키를 가져오거나 기본값 사용
const SECRET_KEY = process.env.REACT_APP_ENCRYPTION_KEY || 'default-secure-key-for-development';

// 다른 암호화 함수들... 