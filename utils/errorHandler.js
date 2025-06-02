import { Alert } from 'react-native';

// 에러 타입 정의
export const ErrorTypes = {
  NETWORK: 'NETWORK_ERROR',
  AUTH: 'AUTH_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  PERMISSION: 'PERMISSION_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

// 에러 메시지 매핑
const errorMessages = {
  [ErrorTypes.NETWORK]: '네트워크 연결을 확인해주세요.',
  [ErrorTypes.AUTH]: '인증이 만료되었습니다. 다시 로그인해주세요.',
  [ErrorTypes.VALIDATION]: '입력값이 올바르지 않습니다.',
  [ErrorTypes.PERMISSION]: '권한이 필요합니다.',
  [ErrorTypes.UNKNOWN]: '알 수 없는 오류가 발생했습니다.'
};

/**
 * 에러 타입을 결정합니다.
 * @param {Error} error - 발생한 에러
 * @returns {string} - 에러 타입
 */
export const determineErrorType = (error) => {
  if (error.name === 'NetworkError' || error.message.includes('network')) {
    return ErrorTypes.NETWORK;
  }
  if (error.name === 'AuthError' || error.message.includes('auth')) {
    return ErrorTypes.AUTH;
  }
  if (error.name === 'ValidationError' || error.message.includes('validation')) {
    return ErrorTypes.VALIDATION;
  }
  if (error.name === 'PermissionError' || error.message.includes('permission')) {
    return ErrorTypes.PERMISSION;
  }
  return ErrorTypes.UNKNOWN;
};

/**
 * 에러를 처리하고 사용자에게 알립니다.
 * @param {Error} error - 발생한 에러
 * @param {Object} options - 처리 옵션
 * @returns {Promise<void>}
 */
export const handleError = async (error, options = {}) => {
  const {
    showAlert = true,
    customMessage = null,
    onError = null
  } = options;

  const errorType = determineErrorType(error);
  const message = customMessage || errorMessages[errorType];

  console.error(`[${errorType}]`, error);

  if (showAlert) {
    Alert.alert('오류', message);
  }

  if (onError) {
    await onError(errorType, error);
  }
};

/**
 * 재시도 로직을 포함한 함수 실행
 * @param {Function} fn - 실행할 함수
 * @param {Object} options - 재시도 옵션
 * @returns {Promise<any>} - 함수 실행 결과
 */
export const withRetry = async (fn, options = {}) => {
  const {
    maxRetries = 3,
    delay = 1000,
    onRetry = null,
    shouldRetry = null
  } = options;

  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // shouldRetry 함수가 있고 false를 반환하면 재시도하지 않음
      if (shouldRetry && !shouldRetry(error)) {
        throw error;
      }

      if (attempt < maxRetries) {
        if (onRetry) {
          await onRetry(error, attempt);
        }
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }

  throw lastError;
};

/**
 * 네트워크 요청을 위한 재시도 로직
 * @param {Function} requestFn - 네트워크 요청 함수
 * @param {Object} options - 재시도 옵션
 * @returns {Promise<any>} - 요청 결과
 */
export const withNetworkRetry = async (requestFn, options = {}) => {
  return withRetry(requestFn, {
    maxRetries: 3,
    delay: 1000,
    shouldRetry: (error) => {
      const errorType = determineErrorType(error);
      return errorType === ErrorTypes.NETWORK;
    },
    onRetry: async (error, attempt) => {
      console.log(`Retrying network request (attempt ${attempt})...`);
    },
    ...options
  });
}; 