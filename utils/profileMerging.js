/**
 * 기존 프로필 목록과 새로운 프로필 목록을 병합하는 함수
 * @param {Array} newProfiles - 새로운 프로필 배열
 * @param {Array} existingProfiles - 기존 프로필 배열
 * @param {Function} sortFunction - 정렬 함수
 * @returns {Array} 병합된 프로필 배열
 */
export const mergeProfiles = (newProfiles, existingProfiles, sortFunction) => {
  const mergedProfiles = newProfiles.map(newProfile => {
    const existingProfile = existingProfiles.find(p => p.uuid === newProfile.uuid);
    if (existingProfile) {
      return {
        ...existingProfile,
        ...newProfile
      };
    }
    return newProfile;
  });
  
  return sortFunction(mergedProfiles);
}; 