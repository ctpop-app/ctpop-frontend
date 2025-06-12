import { blockUser, unblockUser, getBlockedUsers } from '../api/block';

export const blockService = {
  // 사용자 차단
  blockUser: async (blockerUuid, blockedUuid) => {
    try {
      const result = await blockUser(blockerUuid, blockedUuid);
      return result;
    } catch (error) {
      throw new Error('사용자 차단 중 오류가 발생했습니다.');
    }
  },

  // 사용자 차단 해제
  unblockUser: async (blockerUuid, blockedUuid) => {
    try {
      const result = await unblockUser(blockerUuid, blockedUuid);
      return result;
    } catch (error) {
      throw new Error('사용자 차단 해제 중 오류가 발생했습니다.');
    }
  },

  // 차단된 사용자 목록 조회
  getBlockedUsers: async (blockerUuid) => {
    try {
      const blockedUsers = await getBlockedUsers(blockerUuid);
      return blockedUsers;
    } catch (error) {
      throw new Error('차단된 사용자 목록을 불러오는 중 오류가 발생했습니다.');
    }
  }
}; 