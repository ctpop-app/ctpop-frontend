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
  const utcDate = new Date(date);
  return new Date(utcDate.getTime() + (9 * 60 * 60 * 1000));
};

/**
 * 현재 시간을 한국 시간으로 반환
 * @returns {Date} 현재 한국 시간
 */
export const getCurrentKST = () => {
  return toKST(new Date());
};

/**
 * 날짜를 'YYYY-MM-DD' 형식의 문자열로 변환
 * @param {Date} date - 변환할 날짜
 * @returns {string} 'YYYY-MM-DD' 형식의 문자열
 */
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 시간을 'HH:mm:ss' 형식의 문자열로 변환
 * @param {Date} date - 변환할 시간
 * @returns {string} 'HH:mm:ss' 형식의 문자열
 */
export const formatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

/**
 * 날짜와 시간을 'YYYY-MM-DD HH:mm:ss' 형식의 문자열로 변환
 * @param {Date} date - 변환할 날짜/시간
 * @returns {string} 'YYYY-MM-DD HH:mm:ss' 형식의 문자열
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  return `${formatDate(date)} ${formatTime(date)}`;
};

/**
 * 상대적 시간 표시 (예: '3분 전', '1시간 전', '어제' 등)
 * @param {Date} date - 변환할 날짜/시간
 * @returns {string} 상대적 시간 문자열
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';
  const now = getCurrentKST();
  const diff = now - new Date(date);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return formatDate(date);
  } else if (days > 0) {
    return `${days}일 전`;
  } else if (hours > 0) {
    return `${hours}시간 전`;
  } else if (minutes > 0) {
    return `${minutes}분 전`;
  } else {
    return '방금 전';
  }
};

/**
 * Firestore에 저장할 UTC 시간 문자열 생성
 * @returns {string} ISO 형식의 UTC 시간 문자열
 */
export const getUTCTimestamp = () => {
  return new Date().toISOString();
}; 