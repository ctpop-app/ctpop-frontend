/**
 * 날짜/시간 관련 유틸리티 함수들
 */

/**
 * UTC 시간을 한국 시간(KST)으로 변환
 * @param {string|Date} date - 변환할 날짜/시간
 * @returns {Date|null} 한국 시간으로 변환된 Date 객체
 */
export const toKST = (date) => {
  if (!date) return null;
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return new Date(d.getTime() + (9 * 60 * 60 * 1000));
  } catch (error) {
    console.error('toKST 변환 실패:', error);
    return null;
  }
};

/**
 * 현재 시간을 한국 시간으로 반환
 * @returns {Date} 현재 한국 시간
 */
export const getCurrentKST = () => {
  try {
    const now = new Date();
    return new Date(now.getTime() + (9 * 60 * 60 * 1000));
  } catch (error) {
    console.error('getCurrentKST 실패:', error);
    return new Date();
  }
};

/**
 * 날짜를 읽기 쉬운 형식으로 변환 (24시간 형식)
 * @param {Date|string} date 변환할 날짜
 * @returns {string} "YYYY-MM-DD HH:mm" 형식의 문자열
 */
export const formatDate = (date) => {
  if (!date) return null;
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch (error) {
    console.error('formatDate 변환 실패:', error);
    return null;
  }
};

/**
 * 시간을 'HH:mm:ss' 형식의 문자열로 변환 (24시간 형식)
 * @param {Date} date - 변환할 시간
 * @returns {string} 'HH:mm:ss' 형식의 문자열
 */
export const formatTime = (date) => {
  if (!date) return '';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  } catch (error) {
    console.error('formatTime 변환 실패:', error);
    return '';
  }
};

/**
 * 날짜와 시간을 'YYYY-MM-DD HH:mm:ss' 형식의 문자열로 변환 (24시간 형식)
 * @param {Date} date - 변환할 날짜/시간
 * @returns {string} 'YYYY-MM-DD HH:mm:ss' 형식의 문자열
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return `${formatDate(d)}:${String(d.getSeconds()).padStart(2, '0')}`;
  } catch (error) {
    console.error('formatDateTime 변환 실패:', error);
    return '';
  }
};

/**
 * Firestore에 저장하기 위한 표준화된 시간 포맷
 * @param {Date|string} date 변환할 날짜/시간
 * @returns {string} 'YYYY-MM-DD HH:mm:ss' 형식의 한국 시간 문자열
 */
export const toFirestoreTimestamp = (date) => {
  if (!date) return null;
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    
    // 현재 시간을 기준으로 변환
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('toFirestoreTimestamp 변환 실패:', error);
    return null;
  }
};

/**
 * Firestore에서 가져온 시간을 한국 시간으로 변환하여 표시
 * @param {string} firestoreDate Firestore 시간 문자열
 * @returns {string} 'YYYY-MM-DD HH:mm:ss' 형식의 한국 시간 문자열
 */
export const fromFirestoreTimestamp = (firestoreDate) => {
  if (!firestoreDate) return null;
  try {
    const kstDate = toKST(firestoreDate);
    if (!kstDate) return null;
    return formatDateTime(kstDate);
  } catch (error) {
    console.error('fromFirestoreTimestamp 변환 실패:', error);
    return null;
  }
};

/**
 * 상대적 시간 표시 (예: "3분 전", "1시간 전")
 * @param {Date|string} date 변환할 날짜
 * @returns {string} 상대적 시간 문자열
 */
export const getRelativeTime = (date) => {
  if (!date) return '';
  try {
    const now = new Date();
    const target = new Date(date);
    if (isNaN(target.getTime())) return '';
    
    const diffInSeconds = Math.floor((now - target) / 1000);
    
    if (diffInSeconds < 60) return '방금 전';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}일 전`;
    
    return formatDate(date);
  } catch (error) {
    console.error('getRelativeTime 변환 실패:', error);
    return '';
  }
};
