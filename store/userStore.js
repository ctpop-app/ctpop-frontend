// userStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useUserStore = create(
  persist(
    (set) => ({
      // 상태
      user: null,        // 현재 로그인한 사용자 정보
      userProfile: null, // 사용자 프로필 정보
      loading: false,    // 로딩 상태
      error: null,       // 에러 상태
      
      // 액션
      setUser: (user) => set({ user }),
      setUserProfile: (profile) => set({ userProfile: profile }),
      
      // 사용자 정보 업데이트
      updateUser: (userData) => set((state) => ({
        user: { ...state.user, ...userData }
      })),
      
      // 프로필 정보 업데이트
      updateUserProfile: async (userId, profileData) => {
        set({ loading: true, error: null });
        try {
          await AsyncStorage.setItem(`user_profile_${userId}`, JSON.stringify(profileData));
          set({ userProfile: profileData, loading: false });
          return true;
        } catch (error) {
          set({ error: error.message, loading: false });
          return false;
        }
      },
      
      // 로그아웃
      logout: () => set({ user: null, userProfile: null }),
      
      // 회원 탈퇴
      withdraw: () => set({ user: null, userProfile: null })
    }),
    {
      name: 'user-storage',
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
      partialize: (state) => ({ 
        user: state.user,
        userProfile: state.userProfile
      })
    }
  )
);

export default useUserStore; 