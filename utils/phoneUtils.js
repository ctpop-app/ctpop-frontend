/**
 * 전화번호를 E.164 형식으로 변환합니다.
 * @param {string} phoneNumber - 변환할 전화번호
 * @returns {string} E.164 형식의 전화번호
 */
export const toE164Format = (phoneNumber) => {
  // 숫자만 추출
  const numbers = phoneNumber.replace(/\D/g, '');
  
  // 한국 전화번호 형식 검사 (010으로 시작하는 11자리)
  if (numbers.length === 11 && numbers.startsWith('010')) {
    return numbers;  // +82를 붙이지 않고 숫자만 반환
  }
  
  return numbers;
};

/**
 * 전화번호 형식이 유효한지 검사합니다.
 * @param {string} phoneNumber - 검사할 전화번호
 * @returns {boolean} 유효성 여부
 */
export const isValidPhoneNumber = (phoneNumber) => {
  // 숫자만 추출
  const numbers = phoneNumber.replace(/\D/g, '');
  
  // 한국 전화번호 형식 검사 (010으로 시작하는 11자리)
  return numbers.length === 11 && numbers.startsWith('010');
}; 