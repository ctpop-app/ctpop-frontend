export const MESSAGE_STATUS = {
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  ERROR: 'error'
};

export const MESSAGE_STATUS_TEXT = {
  [MESSAGE_STATUS.SENDING]: '전송 중',
  [MESSAGE_STATUS.SENT]: '전송됨',
  [MESSAGE_STATUS.DELIVERED]: '전달됨',
  [MESSAGE_STATUS.READ]: '읽음',
  [MESSAGE_STATUS.ERROR]: '전송 실패'
};

export const getMessageStatusText = (status, error) => {
  if (status === MESSAGE_STATUS.ERROR && error) {
    return error;
  }
  return MESSAGE_STATUS_TEXT[status] || '';
}; 