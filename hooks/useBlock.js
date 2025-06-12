import { useState, useCallback } from 'react';
import { blockService } from '../services/blockService';
import { Alert } from 'react-native';
import { useAuth } from './useAuth';
import useUserStore from '../store/userStore';
import { profileService } from '../services/profileService';

export const useBlock = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { setUserProfile } = useUserStore();

  // 사용자 차단
  const blockUser = useCallback(async (blockedUuid) => {
    if (!user?.uuid) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await blockService.blockUser(user.uuid, blockedUuid);
      // 차단 후 내 프로필 정보 갱신
      const updatedProfile = await profileService.getProfile(user.uuid);
      setUserProfile(updatedProfile);
      Alert.alert('알림', result.message);
      return result;
    } catch (err) {
      setError(err.message);
      Alert.alert('오류', err.message);
    } finally {
      setLoading(false);
    }
  }, [user, setUserProfile]);

  // 사용자 차단 해제
  const unblockUser = useCallback(async (blockedUuid) => {
    if (!user?.uuid) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await blockService.unblockUser(user.uuid, blockedUuid);
      // 차단 해제 후 내 프로필 정보 갱신
      const updatedProfile = await profileService.getProfile(user.uuid);
      setUserProfile(updatedProfile);
      Alert.alert('알림', result.message);
      return result;
    } catch (err) {
      setError(err.message);
      Alert.alert('오류', err.message);
    } finally {
      setLoading(false);
    }
  }, [user, setUserProfile]);

  // 차단된 사용자 목록 조회
  const getBlockedUsers = useCallback(async () => {
    if (!user?.uuid) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return [];
    }

    try {
      setLoading(true);
      setError(null);
      return await blockService.getBlockedUsers(user.uuid);
    } catch (err) {
      setError(err.message);
      Alert.alert('오류', err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 사용자가 차단되었는지 확인
  const isUserBlocked = useCallback(async (targetUuid) => {
    if (!user?.uuid || !targetUuid) return false;
    
    try {
      const blockedUsers = await getBlockedUsers();
      return blockedUsers.includes(targetUuid);
    } catch (err) {
      console.error('Error checking block status:', err);
      return false;
    }
  }, [user, getBlockedUsers]);

  return {
    blockUser,
    unblockUser,
    getBlockedUsers,
    isUserBlocked,
    loading,
    error
  };
}; 