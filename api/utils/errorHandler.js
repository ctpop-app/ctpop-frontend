/**
 * API 에러 처리 유틸리티
 */

/**
 * API 에러 처리
 * @param {Error} error - 발생한 에러
 * @returns {Object} 에러 응답
 */
export const handleApiError = (error) => {
  console.error('API Error:', error);
  return {
    success: false,
    error: error.message || '알 수 없는 오류가 발생했습니다.'
  };
}; 