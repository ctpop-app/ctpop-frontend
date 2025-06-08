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
  const d = new Date(date);
  return new Date(d.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
};

/**
 * 현재 시간을 한국 시간으로 반환
 * @returns {Date} 현재 한국 시간
 */
export const getCurrentKST = () => {
  return toKST(new Date());
};

/**
 * 날짜를 읽기 쉬운 형식으로 변환
 * @param {Date|string} date 변환할 날짜
 * @returns {string} "YYYY-MM-DD HH:mm" 형식의 문자열
 */
export const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
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
 * 상대적 시간 표시 (예: "3분 전", "1시간 전")
 * @param {Date|string} date 변환할 날짜
 * @returns {string} 상대적 시간 문자열
 */
export const getRelativeTime = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const target = new Date(date);
  const diffInSeconds = Math.floor((now - target) / 1000);
  
  if (diffInSeconds < 60) return '방금 전';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}일 전`;
  
  return formatDate(date);
};
