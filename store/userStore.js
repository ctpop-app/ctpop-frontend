// userStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { toKST, getUTCTimestamp } from '../utils/dateUtils';

const useUserStore = create(
  persist(
    (set) => ({
      user: null,
      userProfile: null,
      hasProfile: false,
      setUser: (user) => {
        if (user) {
          // 시간 관련 필드를 한국 시간으로 변환
          const kstUser = {
            ...user,
            createdAt: toKST(user.createdAt),
            lastLoginAt: toKST(user.lastLoginAt),
          };
          set({ user: kstUser });
        } else {
          set({ user: null });
        }
      },
      setUserProfile: (profile) => {
        if (profile) {
          // 프로필의 시간 관련 필드를 한국 시간으로 변환
          const kstProfile = {
            ...profile,
            createdAt: toKST(profile.createdAt),
            updatedAt: toKST(profile.updatedAt),
          };
          set({ userProfile: kstProfile });
        } else {
          set({ userProfile: null });
        }
      },
      setHasProfile: async (hasProfile) => {
        set({ hasProfile });
        // Firestore에 프로필 상태 저장
        const user = useUserStore.getState().user;
        if (user?.uuid) {
          try {
            const userRef = doc(db, 'users', user.uuid);
            await setDoc(userRef, { 
              updatedAt: getUTCTimestamp() // UTC 시간으로 저장
            }, { merge: true });
          } catch (error) {
            console.error('프로필 상태 저장 실패:', error);
          }
        }
      },
      checkProfileStatus: async (uuid) => {
        if (!uuid) return false;
        try {
          const userRef = doc(db, 'users', uuid);
          const userDoc = await getDoc(userRef);
          // 문서가 존재하면 프로필이 있는 것으로 간주
          const hasProfile = userDoc.exists();
          set({ hasProfile });
          return hasProfile;
        } catch (error) {
          console.error('프로필 상태 확인 실패:', error);
          return false;
        }
      },
      clearUser: () => set({ 
        user: null, 
        userProfile: null,
        hasProfile: false  // 로그아웃 시에도 초기화
      }),

      // 회원탈퇴 시 호출되는 함수
      withdrawUser: () => set({ 
        user: null, 
        userProfile: null,
        hasProfile: false  // 회원탈퇴 시에만 false로 초기화
      }),

    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useUserStore; 