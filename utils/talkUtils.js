import { Alert } from 'react-native';

/**
 * 토크 제출 확인 다이얼로그 표시
 * @param {Function} onConfirm - 확인 시 실행할 함수
 * @param {Function} onCancel - 취소 시 실행할 함수
 */
export const showTalkSubmitDialog = (onConfirm, onCancel = null) => {
  Alert.alert(
    '토크 작성',
    '토크를 작성하시겠습니까?',
    [
      {
        text: '취소',
        style: 'cancel',
        onPress: onCancel
      },
      {
        text: '작성',
        onPress: onConfirm
      }
    ]
  );
};

/**
 * 토크 제출 프로세스 실행
 * @param {Object} params
 * @param {boolean} params.hasImage - 이미지 존재 여부
 * @param {Function} params.uploadImage - 이미지 업로드 함수
 * @param {Function} params.submitTalk - 토크 제출 함수
 * @returns {Promise<boolean>} 성공 여부
 */
export const executeTalkSubmit = async ({
  hasImage,
  uploadImage,
  submitTalk
}) => {
  try {
    let imageUrl = null;
    
    // 이미지가 있으면 업로드
    if (hasImage) {
      imageUrl = await uploadImage();
      if (!imageUrl) {
        return false; // 업로드 실패 시 함수 종료
      }
    }
    
    // 토크 제출
    const success = await submitTalk(imageUrl);
    return success;
  } catch (error) {
    console.error('토크 제출 오류:', error);
    return false;
  }
};

/**
 * 토크 제출 핸들러 생성
 * @param {Object} params
 * @param {boolean} params.hasImage - 이미지 존재 여부
 * @param {Function} params.uploadImage - 이미지 업로드 함수
 * @param {Function} params.submitTalk - 토크 제출 함수
 * @returns {Function} 제출 핸들러 함수
 */
export const createTalkSubmitHandler = ({
  hasImage,
  uploadImage,
  submitTalk
}) => {
  return () => {
    showTalkSubmitDialog(async () => {
      const success = await executeTalkSubmit({
        hasImage,
        uploadImage,
        submitTalk
      });
      
      if (success) {
        // 성공 시 추가 처리는 콜백에서 처리됨
      }
    });
  };
}; 