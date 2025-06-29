/**
 * 토크 작성 관련 상수
 */
export const TALK_CONSTANTS = {
  // 글자 수 제한
  MAX_CONTENT_LENGTH: 100,
  
  // 업로드 경로
  UPLOAD_PATH: 'talk',
  
  // 다이얼로그 텍스트
  DIALOG: {
    TITLE: '토크 작성',
    MESSAGE: '토크를 작성하시겠습니까?',
    CANCEL: '취소',
    CONFIRM: '작성'
  },
  
  // 성공/에러 메시지
  MESSAGES: {
    SUCCESS: '토크가 등록되었습니다.',
    CONTENT_REQUIRED: '내용을 입력해주세요.',
    UPLOAD_FAILED: '이미지 업로드에 실패했습니다.',
    SUBMIT_FAILED: '토크 등록에 실패했습니다.',
    PICK_IMAGE_ERROR: '이미지를 선택할 수 없습니다.'
  }
}; 