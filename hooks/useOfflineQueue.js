import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import offlineQueue from '../utils/offlineQueue';

/**
 * 오프라인 큐를 관리하는 훅
 * @returns {Object} - 오프라인 큐 관련 상태와 메서드
 */
export const useOfflineQueue = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [queueStatus, setQueueStatus] = useState(offlineQueue.getQueueStatus());

  // 네트워크 상태 모니터링
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
      if (state.isConnected) {
        offlineQueue.processQueue();
      }
    });

    return () => unsubscribe();
  }, []);

  // 큐 상태 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setQueueStatus(offlineQueue.getQueueStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  /**
   * 작업을 큐에 추가합니다.
   * @param {string} type - 작업 유형
   * @param {Object} payload - 작업 데이터
   * @param {Function} action - 실행할 함수
   * @returns {string} - 작업 ID
   */
  const addOperation = (type, payload, action) => {
    const operationId = `${type}_${Date.now()}`;
    offlineQueue.addToQueue({
      id: operationId,
      type,
      payload,
      action
    });
    return operationId;
  };

  /**
   * 작업을 큐에서 제거합니다.
   * @param {string} operationId - 제거할 작업의 ID
   */
  const removeOperation = (operationId) => {
    offlineQueue.removeFromQueue(operationId);
  };

  /**
   * 큐를 비웁니다.
   */
  const clearQueue = () => {
    offlineQueue.clearQueue();
  };

  return {
    isOnline,
    queueStatus,
    addOperation,
    removeOperation,
    clearQueue
  };
};

export default useOfflineQueue; 