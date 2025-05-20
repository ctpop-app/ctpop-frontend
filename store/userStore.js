// userStore.js
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useUserStore = create((set) => ({
  user: null,
  userProfile: null,
  loading: false,
  error: null,
  
  // 인증 후 사용자 정보 설정
  setUser: (user) => set({ user }),
  
  // 사용자 정보 초기화
  clearUser: () => set({ user: null, userProfile: null }),
  
  // 사용자 프로필 가져오기 (백엔드 API 구현 시 수정 필요)
  fetchUserProfile: async (userId) => {
    try {
      console.log('프로필 정보 가져오는 중:', userId);
      
      // 프로필 데이터가 AsyncStorage에 저장되어 있는지 확인
      const profileData = await AsyncStorage.getItem(`user_profile_${userId}`);
      
      if (profileData) {
        const parsedProfile = JSON.parse(profileData);
        console.log('프로필 정보 가져오기 성공');
        set({ userProfile: parsedProfile });
        return parsedProfile;
      } else {
        console.log('프로필이 존재하지 않습니다');
        return null;
      }
    } catch (error) {
      console.error('프로필 가져오기 오류:', error);
      return null;
    }
  },
  
  // 사용자 프로필 생성 또는 업데이트 (백엔드 API 구현 시 수정 필요)
  updateUserProfile: async (userId, profileData) => {
    set({ loading: true, error: null });
    try {
      // 실제 백엔드 API 대신 임시로 AsyncStorage에 저장
      await AsyncStorage.setItem(`user_profile_${userId}`, JSON.stringify(profileData));
      set({ userProfile: profileData, loading: false });
      return true;
    } catch (error) {
      set({ error: error.message, loading: false });
      return false;
    }
  },
}));

export default useUserStore; 