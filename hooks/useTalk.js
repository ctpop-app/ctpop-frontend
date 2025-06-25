import { useState, useEffect, useCallback } from 'react';
import { talkService } from '../services/talkService';
import useUserStore from '../store/userStore';

/**
 * 내 토크 관리 Hook
 * @param {string} uuid - 사용자 UUID
 * @returns {Object} 내 토크 상태와 액션들
 */
export const useMyTalk = (uuid) => {
  const [myTalk, setMyTalk] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 내 토크 조회
  const fetchMyTalk = useCallback(async () => {
    if (!uuid) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const talk = await talkService.getMyTalk(uuid);
      setMyTalk(talk);
    } catch (err) {
      setError(err.message);
      console.error('내 토크 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [uuid]);

  // 토크 생성
  const createTalk = useCallback(async (content, imageUri = null) => {
    if (!uuid) throw new Error('사용자 UUID가 필요합니다.');
    
    setLoading(true);
    setError(null);
    
    try {
      // userStore에서 닉네임 가져오기
      const { userProfile } = useUserStore.getState();
      const nickname = userProfile?.nickname || '익명';
      
      const newTalk = await talkService.createTalk(uuid, nickname, content, imageUri);
      setMyTalk(newTalk);
      return newTalk;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [uuid]);

  // 토크 삭제
  const deleteTalk = useCallback(async (talkId) => {
    if (!uuid || !talkId) throw new Error('사용자 UUID와 토크 ID가 필요합니다.');
    
    setLoading(true);
    setError(null);
    
    try {
      await talkService.deleteTalk(uuid, talkId);
      setMyTalk(null);
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [uuid]);

  // 초기 로딩
  useEffect(() => {
    fetchMyTalk();
  }, [fetchMyTalk]);

  return {
    myTalk,
    loading,
    error,
    fetchMyTalk,
    createTalk,
    deleteTalk
  };
};

/**
 * 토크 생성 Hook
 * @param {string} uuid - 사용자 UUID
 * @returns {Object} 토크 생성 관련 상태와 액션들
 */
export const useCreateTalk = (uuid) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createTalk = useCallback(async (content, imageUri = null) => {
    if (!uuid) throw new Error('사용자 UUID가 필요합니다.');
    
    setLoading(true);
    setError(null);
    
    try {
      // userStore에서 닉네임 가져오기
      const { userProfile } = useUserStore.getState();
      const nickname = userProfile?.nickname || '익명';
      
      const newTalk = await talkService.createTalk(uuid, nickname, content, imageUri);
      return newTalk;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [uuid]);

  const validateContent = useCallback((content) => {
    return talkService.validateTalkContent(content);
  }, []);

  const getLengthInfo = useCallback(() => {
    return talkService.getTalkLengthInfo();
  }, []);

  return {
    loading,
    error,
    createTalk,
    validateContent,
    getLengthInfo
  };
};

/**
 * 토크 피드 Hook
 * @returns {Object} 토크 피드 상태와 액션들
 */
export const useTalkFeed = () => {
  const [talks, setTalks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  // 피드 조회
  const fetchFeed = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await talkService.getTalkFeed(params);
      setTalks(result.talks);
      setHasMore(result.hasMore);
      return result;
    } catch (err) {
      setError(err.message);
      console.error('토크 피드 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 피드 새로고침
  const refreshFeed = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    
    try {
      const result = await talkService.refreshTalkFeed();
      setTalks(result.talks);
      setHasMore(result.hasMore);
      return result;
    } catch (err) {
      setError(err.message);
      console.error('토크 피드 새로고침 실패:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // 더보기
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    
    setLoadingMore(true);
    setError(null);
    
    try {
      const lastTalk = talks[talks.length - 1];
      if (!lastTalk) return;
      
      const result = await talkService.loadMoreTalks(lastTalk);
      setTalks(prev => [...prev, ...result.talks]);
      setHasMore(result.hasMore);
      return result;
    } catch (err) {
      setError(err.message);
      console.error('토크 더보기 실패:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [talks, hasMore, loadingMore]);

  // 초기 로딩
  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  return {
    talks,
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore,
    fetchFeed,
    refreshFeed,
    loadMore
  };
};

/**
 * 토크 삭제 Hook
 * @param {string} uuid - 사용자 UUID
 * @returns {Object} 토크 삭제 관련 상태와 액션들
 */
export const useDeleteTalk = (uuid) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const deleteTalk = useCallback(async (talkId) => {
    if (!uuid || !talkId) throw new Error('사용자 UUID와 토크 ID가 필요합니다.');
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await talkService.deleteTalk(uuid, talkId);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [uuid]);

  return {
    loading,
    error,
    deleteTalk
  };
}; 