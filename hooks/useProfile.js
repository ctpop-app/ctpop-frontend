import { useState, useCallback } from 'react';
import { profileService } from '../services/profileService';
import useUserStore from '../store/userStore';

export const useProfile = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, userProfile, setUserProfile, setHasProfile } = useUserStore();

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

  const deactivate = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await profileService.deactivateProfile(user?.uuid);
      setUserProfile(null);
      setHasProfile(false);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.uuid, setUserProfile, setHasProfile]);

  return {
    loading,
    error,
    profile: userProfile,
    exists,
    get,
    create,
    update,
    deactivate
  };
}; 