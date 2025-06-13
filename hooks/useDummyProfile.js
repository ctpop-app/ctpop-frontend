import { useState } from 'react';
import { profileApi } from '../api/profile';
import { Profile } from '../models/Profile';
import { getCurrentKST } from '../utils/dateUtils';

export const useDummyProfile = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const create = async (data) => {
    try {
      setLoading(true);
      setError(null);
      const profile = new Profile({
        ...data,
        createdAt: getCurrentKST(),
        updatedAt: getCurrentKST(),
        isActive: true
      });

      // 프로필 유효성 검사
      const validationErrors = profile.validate();
      if (validationErrors) {
        throw new Error(JSON.stringify(validationErrors));
      }

      return await profileApi.create(profile.toFirestore());
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const update = async (uuid) => {
    try {
      setLoading(true);
      setError(null);
      return await profileApi.update(uuid, { isActive: false });
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    create,
    update
  };
}; 