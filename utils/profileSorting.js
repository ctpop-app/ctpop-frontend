/**
 * 프로필 목록을 정렬하는 함수
 * @param {Array} profiles - 정렬할 프로필 배열
 * @param {Object} user - 현재 사용자 정보
 * @param {Function} isUserOnline - 사용자 온라인 상태 확인 함수
 * @returns {Array} 정렬된 프로필 배열
 */
export const sortProfiles = (profiles, user, isUserOnline) => {
  return profiles.sort((a, b) => {
    // 0. 사용자 자신의 프로필을 최상위로
    if (a.uuid === user?.uuid) return -1;
    if (b.uuid === user?.uuid) return 1;

    // 1. 접속 중인 사용자를 그 다음으로
    const aIsOnline = isUserOnline(a.uuid);
    const bIsOnline = isUserOnline(b.uuid);
    if (aIsOnline && !bIsOnline) return -1;
    if (!aIsOnline && bIsOnline) return 1;
    
    // 2. 둘 다 접속 중이거나 둘 다 접속 중이 아닌 경우 lastActive로 정렬
    if (!a.lastActive) return 1;
    if (!b.lastActive) return -1;

    // lastActive를 Date 객체로 변환
    const dateA = a.lastActive.toDate ? a.lastActive.toDate() : new Date(a.lastActive);
    const dateB = b.lastActive.toDate ? b.lastActive.toDate() : new Date(b.lastActive);
    return dateB - dateA;
  });
}; 