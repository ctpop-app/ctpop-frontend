// store/userStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { toKST, getCurrentKST } from '../utils/dateUtils';
import { AUTH_KEYS } from '../utils/constants';

const useUserStore = create(
  persist(
    (set, get) => ({
      // 상태
      user: null,
      userProfile: null,
      isAuthenticated: false,
      hasProfile: false,

      // 액션
      setUser: (user) => {
        console.log('setUser called with:', user);
        set((state) => ({ 
          ...state,
          user, 
          isAuthenticated: !!user 
        }));
        console.log('New state:', get());
      },
      
      setUserProfile: (profile) => {
        console.log('setUserProfile called with:', profile);
        if (!profile?.uuid) {
          console.error('Invalid profile: missing uuid field', profile);
          return;
        }
        set((state) => ({ 
          ...state,
          userProfile: profile,
          hasProfile: !!profile 
        }));
        console.log('New state:', get());
      },
      
      setHasProfile: (hasProfile) => {
        console.log('setHasProfile called with:', hasProfile);
        set((state) => ({ 
          ...state,
          hasProfile 
        }));
        console.log('New state:', get());
      },
      
      clearUser: () => {
        console.log('clearUser called');
        set((state) => ({ 
          ...state,
          user: null, 
          userProfile: null, 
          isAuthenticated: false,
          hasProfile: false
        }));
        console.log('New state:', get());
      },

      // 회원탈퇴
      withdrawUser: async () => {
        console.log('withdrawUser called');
        try {
          // 1. 상태 초기화
          set((state) => ({ 
            ...state,
            user: null, 
            userProfile: null, 
            isAuthenticated: false, 
            hasProfile: false 
          }));
          // 2. persist 스토리지 초기화
          await AsyncStorage.removeItem('user-storage');
          // 3. 인증 관련 데이터 삭제
          await AsyncStorage.removeItem(AUTH_KEYS.ACCESS_TOKEN);
          await AsyncStorage.removeItem(AUTH_KEYS.REFRESH_TOKEN);
          await AsyncStorage.removeItem(AUTH_KEYS.PHONE_NUMBER);
          await AsyncStorage.removeItem(AUTH_KEYS.USER);
          console.log('User data cleared');
        } catch (error) {
          console.error('User data clear failed:', error);
        }
        console.log('New state:', get());
      },

      // 초기화
      initialize: async () => {
        try {
          const stored = await AsyncStorage.getItem('user-storage');
          if (stored) {
            const { state } = JSON.parse(stored);
            set(state);
          }
        } catch (error) {
          console.error('Storage 로드 실패:', error);
        }
      }
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      skipHydration: true
    }
  )
);

// store 초기화
useUserStore.getState().initialize();

export default useUserStore; 