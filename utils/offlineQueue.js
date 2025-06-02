import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const QUEUE_KEY = '@offline_queue';
const MAX_RETRIES = 3;

class OfflineQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.retryCounts = new Map();
    this.initializeQueue();
  }

  /**
   * 저장된 큐를 초기화합니다.
   */
  async initializeQueue() {
    try {
      const savedQueue = await AsyncStorage.getItem(QUEUE_KEY);
      if (savedQueue) {
        this.queue = JSON.parse(savedQueue);
      }
    } catch (error) {
      console.error('Error initializing offline queue:', error);
    }
  }

  /**
   * 큐를 저장합니다.
   */
  async saveQueue() {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }

  /**
   * 작업을 큐에 추가합니다.
   * @param {Object} operation - 추가할 작업
   */
  async addToQueue(operation) {
    this.queue.push({
      ...operation,
      timestamp: Date.now(),
      retryCount: 0
    });
    await this.saveQueue();
    this.processQueue();
  }

  /**
   * 큐의 작업들을 처리합니다.
   */
  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const networkState = await NetInfo.fetch();

    if (!networkState.isConnected) {
      this.isProcessing = false;
      return;
    }

    while (this.queue.length > 0) {
      const operation = this.queue[0];
      const retryCount = this.retryCounts.get(operation.id) || 0;

      try {
        await this.executeOperation(operation);
        this.queue.shift();
        this.retryCounts.delete(operation.id);
        await this.saveQueue();
      } catch (error) {
        console.error('Error processing operation:', error);
        
        if (retryCount < MAX_RETRIES) {
          this.retryCounts.set(operation.id, retryCount + 1);
          // 실패한 작업을 큐의 끝으로 이동
          this.queue.push(this.queue.shift());
        } else {
          // 최대 재시도 횟수를 초과한 작업 제거
          this.queue.shift();
          this.retryCounts.delete(operation.id);
          await this.saveQueue();
        }
        break;
      }
    }

    this.isProcessing = false;
  }

  /**
   * 작업을 실행합니다.
   * @param {Object} operation - 실행할 작업
   */
  async executeOperation(operation) {
    const { type, payload, action } = operation;

    switch (type) {
      case 'SEND_MESSAGE':
        await action(payload);
        break;
      case 'UPLOAD_IMAGE':
        await action(payload);
        break;
      case 'UPDATE_PROFILE':
        await action(payload);
        break;
      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
  }

  /**
   * 특정 작업을 큐에서 제거합니다.
   * @param {string} operationId - 제거할 작업의 ID
   */
  async removeFromQueue(operationId) {
    this.queue = this.queue.filter(op => op.id !== operationId);
    this.retryCounts.delete(operationId);
    await this.saveQueue();
  }

  /**
   * 큐를 비웁니다.
   */
  async clearQueue() {
    this.queue = [];
    this.retryCounts.clear();
    await this.saveQueue();
  }

  /**
   * 큐의 상태를 반환합니다.
   * @returns {Object} - 큐의 상태
   */
  getQueueStatus() {
    return {
      pendingOperations: this.queue.length,
      isProcessing: this.isProcessing,
      retryCounts: Object.fromEntries(this.retryCounts)
    };
  }
}

// 싱글톤 인스턴스 생성
const offlineQueue = new OfflineQueue();
export default offlineQueue; 