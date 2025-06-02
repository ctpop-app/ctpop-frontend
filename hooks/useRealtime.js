import { useState, useEffect, useCallback } from 'react';
import realtimeService from '../utils/realtimeService';

/**
 * 실시간 데이터 구독을 위한 커스텀 훅
 * @param {string} collectionName - 구독할 컬렉션 이름
 * @param {Object} options - 쿼리 옵션
 * @returns {Object} - 구독된 데이터와 상태
 */
export const useRealtimeCollection = (collectionName, options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionState, setConnectionState] = useState('unknown');

  useEffect(() => {
    // 연결 상태 구독
    const unsubscribeConnection = realtimeService.addConnectionListener(setConnectionState);

    // 컬렉션 구독
    const unsubscribe = realtimeService.subscribeToCollection(
      collectionName,
      options,
      ({ data, error }) => {
        if (error) {
          setError(error);
        } else {
          setData(data);
        }
        setLoading(false);
      }
    );

    // 구독 해제
    return () => {
      unsubscribe();
      unsubscribeConnection();
    };
  }, [collectionName, JSON.stringify(options)]);

  return { data, loading, error, connectionState };
};

/**
 * 특정 문서의 실시간 구독을 위한 커스텀 훅
 * @param {string} collectionName - 구독할 컬렉션 이름
 * @param {string} documentId - 구독할 문서 ID
 * @returns {Object} - 구독된 데이터와 상태
 */
export const useRealtimeDocument = (collectionName, documentId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionState, setConnectionState] = useState('unknown');

  useEffect(() => {
    if (!documentId) {
      setLoading(false);
      return;
    }

    // 연결 상태 구독
    const unsubscribeConnection = realtimeService.addConnectionListener(setConnectionState);

    // 문서 구독
    const unsubscribe = realtimeService.subscribeToDocument(
      collectionName,
      documentId,
      ({ data, error }) => {
        if (error) {
          setError(error);
        } else {
          setData(data);
        }
        setLoading(false);
      }
    );

    // 구독 해제
    return () => {
      unsubscribe();
      unsubscribeConnection();
    };
  }, [collectionName, documentId]);

  return { data, loading, error, connectionState };
};

/**
 * 실시간 연결 상태를 관리하는 커스텀 훅
 * @returns {string} - 현재 연결 상태
 */
export const useConnectionState = () => {
  const [connectionState, setConnectionState] = useState('unknown');

  useEffect(() => {
    const unsubscribe = realtimeService.addConnectionListener(setConnectionState);
    return unsubscribe;
  }, []);

  return connectionState;
}; 