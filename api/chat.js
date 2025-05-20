import apiClient, { handleApiResponse, handleApiError } from './client';

/**
 * 사용자의 채팅방 목록을 가져옵니다.
 * @param {string} userId - 사용자 ID (전화번호)
 * @param {Object} params - 페이징 등의 파라미터
 * @returns {Promise<Object>} - 성공 여부와 채팅방 목록
 */
export const getChatRooms = async (userId, params = {}) => {
  try {
    const response = await apiClient.get(`/chats/rooms`, { params });
    return { success: true, data: handleApiResponse(response) };
  } catch (error) {
    console.error('채팅방 목록 가져오기 오류:', error);
    return handleApiError(error);
  }
};

/**
 * 특정 채팅방의 메시지 목록을 가져옵니다.
 * @param {string} roomId - 채팅방 ID
 * @param {Object} params - 페이징 등의 파라미터
 * @returns {Promise<Object>} - 성공 여부와 메시지 목록
 */
export const getChatMessages = async (roomId, params = {}) => {
  try {
    const response = await apiClient.get(`/chats/rooms/${roomId}/messages`, { params });
    return { success: true, data: handleApiResponse(response) };
  } catch (error) {
    console.error('채팅 메시지 가져오기 오류:', error);
    return handleApiError(error);
  }
};

/**
 * 새로운 채팅 메시지를 전송합니다.
 * @param {string} roomId - 채팅방 ID
 * @param {Object} messageData - 메시지 데이터
 * @returns {Promise<Object>} - 성공 여부와 전송된 메시지 정보
 */
export const sendChatMessage = async (roomId, messageData) => {
  try {
    const response = await apiClient.post(`/chats/rooms/${roomId}/messages`, messageData);
    return { success: true, data: handleApiResponse(response) };
  } catch (error) {
    console.error('메시지 전송 오류:', error);
    return handleApiError(error);
  }
};

/**
 * 새로운 채팅방을 생성합니다.
 * @param {Object} roomData - 채팅방 생성 데이터 (참가자 등)
 * @returns {Promise<Object>} - 성공 여부와 생성된 채팅방 정보
 */
export const createChatRoom = async (roomData) => {
  try {
    const response = await apiClient.post('/chats/rooms', roomData);
    return { success: true, data: handleApiResponse(response) };
  } catch (error) {
    console.error('채팅방 생성 오류:', error);
    return handleApiError(error);
  }
};

/**
 * 채팅방에서 나갑니다.
 * @param {string} roomId - 채팅방 ID
 * @returns {Promise<Object>} - 성공 여부
 */
export const leaveChatRoom = async (roomId) => {
  try {
    const response = await apiClient.delete(`/chats/rooms/${roomId}/leave`);
    return { success: true, data: handleApiResponse(response) };
  } catch (error) {
    console.error('채팅방 나가기 오류:', error);
    return handleApiError(error);
  }
};

/**
 * 채팅방에 사용자를 초대합니다.
 * @param {string} roomId - 채팅방 ID
 * @param {Array} userIds - 초대할 사용자 ID 목록
 * @returns {Promise<Object>} - 성공 여부와 초대 결과
 */
export const inviteToChat = async (roomId, userIds) => {
  try {
    const response = await apiClient.post(`/chats/rooms/${roomId}/invite`, { userIds });
    return { success: true, data: handleApiResponse(response) };
  } catch (error) {
    console.error('사용자 초대 오류:', error);
    return handleApiError(error);
  }
};

/**
 * 채팅방 정보를 업데이트합니다 (이름, 썸네일 등).
 * @param {string} roomId - 채팅방 ID
 * @param {Object} roomData - 업데이트할 채팅방 데이터
 * @returns {Promise<Object>} - 성공 여부와 업데이트된 채팅방 정보
 */
export const updateChatRoom = async (roomId, roomData) => {
  try {
    const response = await apiClient.patch(`/chats/rooms/${roomId}`, roomData);
    return { success: true, data: handleApiResponse(response) };
  } catch (error) {
    console.error('채팅방 정보 업데이트 오류:', error);
    return handleApiError(error);
  }
}; 