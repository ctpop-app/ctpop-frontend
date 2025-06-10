import { useState, useCallback, useEffect } from 'react';
import { profileService } from '../services/profileService';
import useUserStore from '../store/userStore';

export const useProfile = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, userProfile, setUserProfile, setHasProfile, clearUser } = useUserStore();

  const exists = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await profileService.checkProfileExists(user?.uuid);
      setHasProfile(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.uuid, setHasProfile]);

  const get = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const profile = await profileService.getProfile(user?.uuid);
      if (profile) {
        setUserProfile(profile);
      }
      return profile;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.uuid, setUserProfile]);

  const create = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      const profile = await profileService.create(user?.uuid, data);
      setUserProfile(profile);
      setHasProfile(true);
      return profile;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.uuid, setUserProfile, setHasProfile]);

  const update = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      const profile = await profileService.update(user?.uuid, data);
      setUserProfile(profile);
      return profile;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.uuid, setUserProfile]);

  const withdraw = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await profileService.withdraw(user?.uuid);
      if (result.success) {
        clearUser();
        return true;
      } else {
        console.error('회원 탈퇴 실패:', result.message);
        return false;
      }
    } catch (err) {
      console.error('회원 탈퇴 중 오류 발생:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.uuid, clearUser]);

  // getAll: isActive가 true인 모든 프로필을 가져옴
  const getAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const profiles = await profileService.getAllProfile();
      return profiles;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    profile: userProfile,
    exists,
    get,
    create,
    update,
    withdraw,
    getAll,
  };
};