import { useState, useCallback, useEffect } from 'react';
import { useProfile } from './useProfile';
import { useAuth } from './useAuth';
import { useSocket } from './useSocket';
import useUserStore from '../store/userStore';
import { sortProfiles } from '../utils/profileSorting';
import { mergeProfiles } from '../utils/profileMerging';

export const useProfileList = () => {
  const { getAll, loading } = useProfile();
  const { user } = useAuth();
  const { isUserOnline } = useSocket();
  const { userProfile } = useUserStore();
  
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false);

  const loadProfiles = useCallback(async (isBackground = false) => {
    if (isBackground) {
      setIsBackgroundRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const newData = await getAll();
      const dataWithUserProfile = userProfile ? [userProfile, ...newData] : newData;
      
      if (isBackground) {
        setProfiles(prevProfiles => {
          return mergeProfiles(dataWithUserProfile, prevProfiles, (profiles) => 
            sortProfiles(profiles, user, isUserOnline)
          );
        });
      } else {
        const sortedData = sortProfiles(dataWithUserProfile, user, isUserOnline);
        setProfiles(sortedData);
      }
    } catch (error) {
      console.error('프로필 로드 실패:', error);
    } finally {
      if (isBackground) {
        setIsBackgroundRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [getAll, userProfile, isUserOnline, user]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadProfiles().finally(() => setRefreshing(false));
  }, [loadProfiles]);

  return {
    profiles,
    isLoading,
    refreshing,
    isBackgroundRefreshing,
    loadProfiles,
    handleRefresh,
    isUserOnline
  };
}; 