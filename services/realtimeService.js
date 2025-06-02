import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, onSnapshotsInSync } from 'firebase/firestore';
import NetInfo from '@react-native-community/netinfo';

class RealtimeService {
  constructor() {
    this.subscriptions = new Map();
    this.connectionState = 'unknown';
    this.connectionListeners = new Set();
    this.initializeConnectionListener();
  }

  /**
   * 네트워크 연결 상태 리스너를 초기화합니다.
   */
  initializeConnectionListener = () => {
    NetInfo.addEventListener(state => {
      const newState = state.isConnected ? 'connected' : 'disconnected';
      if (this.connectionState !== newState) {
        this.connectionState = newState;
        this.notifyConnectionListeners();
      }
    });
  };

  /**
   * 연결 상태 변경 리스너를 추가합니다.
   * @param {Function} listener - 연결 상태 변경 시 호출될 콜백
   */
  addConnectionListener = (listener) => {
    this.connectionListeners.add(listener);
    return () => this.connectionListeners.delete(listener);
  };

  /**
   * 연결 상태 변경을 모든 리스너에게 알립니다.
   */
  notifyConnectionListeners = () => {
    this.connectionListeners.forEach(listener => listener(this.connectionState));
  };

  /**
   * Firestore 컬렉션의 실시간 업데이트를 구독합니다.
   * @param {string} collectionName - 컬렉션 이름
   * @param {Object} options - 쿼리 옵션
   * @param {Function} callback - 데이터 변경 시 호출될 콜백
   * @returns {Function} - 구독 해제 함수
   */
  subscribeToCollection = (collectionName, options = {}, callback) => {
    const { where: whereConditions = [], orderBy: orderByField = null, limit: limitCount = null } = options;
    
    let q = collection(db, collectionName);
    
    // where 조건 적용
    whereConditions.forEach(condition => {
      q = query(q, where(condition.field, condition.operator, condition.value));
    });

    // orderBy 적용
    if (orderByField) {
      q = query(q, orderBy(orderByField.field, orderByField.direction || 'asc'));
    }

    // limit 적용
    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    // 실시간 구독
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback({ data, error: null });
      },
      (error) => {
        console.error(`Error subscribing to ${collectionName}:`, error);
        callback({ data: null, error });
      }
    );

    // 구독 정보 저장
    const subscriptionId = `${collectionName}_${Date.now()}`;
    this.subscriptions.set(subscriptionId, unsubscribe);

    // 구독 해제 함수 반환
    return () => {
      const unsubscribe = this.subscriptions.get(subscriptionId);
      if (unsubscribe) {
        unsubscribe();
        this.subscriptions.delete(subscriptionId);
      }
    };
  };

  /**
   * 특정 문서의 실시간 업데이트를 구독합니다.
   * @param {string} collectionName - 컬렉션 이름
   * @param {string} documentId - 문서 ID
   * @param {Function} callback - 데이터 변경 시 호출될 콜백
   * @returns {Function} - 구독 해제 함수
   */
  subscribeToDocument = (collectionName, documentId, callback) => {
    const docRef = doc(db, collectionName, documentId);
    
    const unsubscribe = onSnapshot(docRef,
      (doc) => {
        if (doc.exists()) {
          callback({ data: { id: doc.id, ...doc.data() }, error: null });
        } else {
          callback({ data: null, error: new Error('Document does not exist') });
        }
      },
      (error) => {
        console.error(`Error subscribing to document ${documentId}:`, error);
        callback({ data: null, error });
      }
    );

    const subscriptionId = `${collectionName}/${documentId}_${Date.now()}`;
    this.subscriptions.set(subscriptionId, unsubscribe);

    return () => {
      const unsubscribe = this.subscriptions.get(subscriptionId);
      if (unsubscribe) {
        unsubscribe();
        this.subscriptions.delete(subscriptionId);
      }
    };
  };

  /**
   * 모든 실시간 구독을 해제합니다.
   */
  unsubscribeAll = () => {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions.clear();
  };
}

// 싱글톤 인스턴스 생성
const realtimeService = new RealtimeService();
export default realtimeService; 