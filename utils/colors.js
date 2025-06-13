export const getOrientationColor = (orientation) => {
  switch (orientation) {
    case '트젠':
      return '#FF6B6B';  // 기존 메인 컬러
    case '시디':
      return '#4CAF50';  // 초록색
    case '러버':
      return '#9C27B0';  // 보라색
    case '기타':
      return '#2196F3';  // 파란색
    default:
      return '#CCCCCC';  // 미입력 시 회색
  }
}; 