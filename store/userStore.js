// store/userStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_KEYS } from '../utils/constants';

const useUserStore = create(
  persist(
    (set, get) => ({
      // 상태
      user: null,
      userProfile: null,
      isAuthenticated: false,
      hasProfile: false,
      isOnline: false,
      nearbyDistances: {}, // 실시간 거리 정보 저장

      // 액션
      setUser: (user) => {
        set((state) => ({ 
          ...state,
          user, 
          isAuthenticated: !!user 
        }));
      },
      
      setUserProfile: (profile) => {
        if (!profile?.uuid) {
          console.error('Invalid profile: missing uuid field', profile);
          return;
        }
        set((state) => ({ 
          ...state,
          userProfile: profile,
          hasProfile: !!profile 
        }));
      },
      
      setHasProfile: (hasProfile) => {
        const currentState = get();
        if (currentState.hasProfile !== hasProfile) {
          set((state) => ({ 
            ...state,
            hasProfile 
          }));
        }
      },
    
      clearUser: () => {
        set((state) => ({ 
          ...state,      
          user: null, 
          userProfile: null, 
          isAuthenticated: false,
          hasProfile: false
        }));
      },

      // 회원탈퇴
      withdrawUser: async () => {
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
        } catch (error) {
          console.error('User data clear failed:', error);
        }
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
      },

      setOnlineStatus: (status) => set({ isOnline: status }),
      
      // 실시간 거리 정보 업데이트
      setNearbyDistances: (distances) => {
        console.log('Setting nearby distances:', distances);
        set({ nearbyDistances: distances });
      },
      
      // 특정 사용자와의 거리 가져오기
      getDistanceToUser: (uuid) => {
        const { nearbyDistances } = get();
        const distance = nearbyDistances[uuid] || null;
        console.log(`Getting distance for ${uuid}:`, distance);
        return distance;
      },

      // 모든 거리 정보 초기화
      clearNearbyDistances: () => set({ nearbyDistances: {} }),

      // 디버깅용: 현재 거리 정보 상태 확인
      debugNearbyDistances: () => {
        const { nearbyDistances } = get();
        console.log('Current nearbyDistances state:', nearbyDistances);
        return nearbyDistances;
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      skipHydration: false
    }
  )
);

// store 초기화
useUserStore.getState().initialize();

export default useUserStore; 