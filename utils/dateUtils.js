/**
 * 날짜/시간 관련 유틸리티 함수들
 */
import { Timestamp } from 'firebase/firestore';

/**
 * UTC 시간을 한국 시간(KST)으로 변환
 * @param {string|Date|Timestamp} date - 변환할 날짜/시간
 * @returns {Date|null} 한국 시간으로 변환된 Date 객체
 */
export const toKST = (date) => {
  if (!date) return null;
  try {
    let d;
    if (date instanceof Timestamp) {
      d = date.toDate();
    } else {
      d = new Date(date);
    }
    if (isNaN(d.getTime())) return null;
    return new Date(d.getTime());
  } catch (error) {
    console.error('toKST 변환 실패:', error);
    return null;
  }
};

/**
 * 현재 시간을 한국 시간으로 반환
 * @returns {string} 'YYYY-MM-DD HH:mm' 형식의 현재 한국 시간 문자열
 */
export const getCurrentKST = () => {
  try {
    const now = new Date();
    const kstDate = toKST(now);
    return `${kstDate.getFullYear()}-${String(kstDate.getMonth() + 1).padStart(2, '0')}-${String(kstDate.getDate()).padStart(2, '0')} ${String(kstDate.getHours()).padStart(2, '0')}:${String(kstDate.getMinutes()).padStart(2, '0')}`;
  } catch (error) {
    console.error('getCurrentKST 실패:', error);
    return null;
  }
};

export const getLastActiveText = (lastActive) => {
  if (!lastActive) return '';
  
  const now = new Date();
  const lastActiveDate = new Date(lastActive);
  const diffMinutes = Math.floor((now - lastActiveDate) / (1000 * 60));
  
  if (diffMinutes < 1) return '접속중';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}시간 전`;
  return `${Math.floor(diffMinutes / 1440)}일 전`;
};

