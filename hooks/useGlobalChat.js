import { useState, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { useAuth } from './useAuth';
import { useNotifications } from './useNotifications';

/**
 * 전역 채팅 모니터링 훅
 * 모든 채팅방의 새 메시지를 감지하고 현재 채팅방이 아닌 경우 알림을 표시
 */
export const useGlobalChat = () => {
  const { user } = useAuth();
  const { showNewMessageNotification } = useNotifications();
  const [allMessages, setAllMessages] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const currentChatRoomId = useRef(null);
  const lastProcessedMessageId = useRef(new Set());
  const appState = useRef(AppState.currentState);

  // 현재 채팅방 ID 설정
  const setCurrentChatRoomId = (chatRoomId) => {
    currentChatRoomId.current = chatRoomId;
    console.log('전역 채팅 - 현재 채팅방 설정:', chatRoomId);
  };

  // 현재 채팅방 ID 제거
  const clearCurrentChatRoomId = () => {
    currentChatRoomId.current = null;
    console.log('전역 채팅 - 현재 채팅방 제거');
  };

  // 앱 상태 변경 감지
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('앱이 foreground로 전환됨');
        // 앱이 활성화되면 모니터링 재시작
        if (user?.uuid) {
          setIsMonitoring(true);
        }
      } else if (nextAppState.match(/inactive|background/)) {
        console.log('앱이 background로 전환됨');
        // 백그라운드에서도 모니터링 계속
      }
      appState.current = nextAppState;
    });

    return () => subscription?.remove();
  }, [user?.uuid]);

  // 전역 메시지 모니터링
  useEffect(() => {
    if (!user?.uuid || !isMonitoring) return;

    console.log('전역 채팅 모니터링 시작:', user.uuid);

    // 최근 메시지들을 모니터링 (지난 1시간)
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const messagesQuery = query(
      collection(db, 'messages'),
      where('timestamp', '>=', oneDayAgo),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const newMessages = [];
      
      snapshot.docs.forEach(doc => {
        const message = {
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate() : new Date(doc.data().timestamp)
        };

        // 새로운 메시지이고, 자신이 보낸 메시지가 아닌 경우만 처리
        if (!lastProcessedMessageId.current.has(message.id) && message.uuid !== user.uuid) {
          newMessages.push(message);
          lastProcessedMessageId.current.add(message.id);
        }
      });

      if (newMessages.length > 0) {
        console.log('새로운 메시지들 감지:', newMessages.length);
        handleNewMessages(newMessages);
      }

      setAllMessages(prev => {
        const messageMap = new Map(prev.map(msg => [msg.id, msg]));
        snapshot.docs.forEach(doc => {
          const message = {
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate() : new Date(doc.data().timestamp)
          };
          messageMap.set(message.id, message);
        });
        return Array.from(messageMap.values()).sort((a, b) => b.timestamp - a.timestamp);
      });
    }, (error) => {
      console.error('전역 메시지 모니터링 오류:', error);
    });

    return () => {
      console.log('전역 채팅 모니터링 종료');
      unsubscribe();
    };
  }, [user?.uuid, isMonitoring]);

  // 새 메시지 처리
  const handleNewMessages = async (newMessages) => {
    for (const message of newMessages) {
      // 현재 채팅방과 다른 채팅방의 메시지인 경우만 알림
      if (message.chatId !== currentChatRoomId.current) {
        await showNotificationForMessage(message);
      } else {
        console.log('같은 채팅방 메시지 - 알림 표시 안함:', message.chatId);
      }
    }
  };

  // 메시지 알림 표시
  const showNotificationForMessage = async (message) => {
    try {
      // 채팅방 정보와 상대방 정보를 가져와야 함
      // 현재는 기본값으로 설정
      const otherUser = {
        uuid: message.uuid,
        nickname: message.senderName || '알 수 없는 사용자',
        mainPhotoURL: message.senderPhotoURL || null
      };

      console.log('메시지 알림 표시:', {
        chatId: message.chatId,
        content: message.content,
        currentChatRoom: currentChatRoomId.current
      });

      await showNewMessageNotification(message, message.chatId, otherUser);
    } catch (error) {
      console.error('메시지 알림 표시 실패:', error);
    }
  };

  // 모니터링 시작
  const startMonitoring = () => {
    if (user?.uuid) {
      setIsMonitoring(true);
      console.log('전역 채팅 모니터링 시작');
    }
  };

  // 모니터링 중지
  const stopMonitoring = () => {
    setIsMonitoring(false);
    console.log('전역 채팅 모니터링 중지');
  };

  // 초기화
  useEffect(() => {
    if (user?.uuid) {
      startMonitoring();
    }
    
    return () => {
      stopMonitoring();
    };
  }, [user?.uuid]);

  return {
    allMessages,
    isMonitoring,
    setCurrentChatRoomId,
    clearCurrentChatRoomId,
    startMonitoring,
    stopMonitoring,
  };
};