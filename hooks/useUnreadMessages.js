import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, and } from 'firebase/firestore';
import { useAuth } from './useAuth';

/**
 * 읽지 않은 메시지 카운트 관리 훅
 */
export const useUnreadMessages = () => {
  const { user } = useAuth();
  const [unreadCounts, setUnreadCounts] = useState({});
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.uuid) return;

    console.log('읽지 않은 메시지 모니터링 시작:', user.uuid);

    // 읽지 않은 메시지 조회
    const unreadQuery = query(
      collection(db, 'messages'),
      where('readBy', 'array-contains', user.uuid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(unreadQuery, (snapshot) => {
      const unreadByChat = {};
      let totalCount = 0;

      snapshot.docs.forEach(doc => {
        const message = doc.data();
        // 자신이 보낸 메시지가 아니고, 읽지 않은 메시지인 경우
        if (message.uuid !== user.uuid && !message.readBy?.includes(user.uuid)) {
          const chatId = message.chatId;
          unreadByChat[chatId] = (unreadByChat[chatId] || 0) + 1;
          totalCount++;
        }
      });

      setUnreadCounts(unreadByChat);
      setTotalUnreadCount(totalCount);
      
      console.log('읽지 않은 메시지 업데이트:', {
        unreadByChat,
        totalCount
      });
    }, (error) => {
      console.error('읽지 않은 메시지 모니터링 오류:', error);
    });

    return () => {
      console.log('읽지 않은 메시지 모니터링 종료');
      unsubscribe();
    };
  }, [user?.uuid]);

  // 특정 채팅방의 읽지 않은 메시지 수
  const getUnreadCount = (chatRoomId) => {
    return unreadCounts[chatRoomId] || 0;
  };

  // 채팅방 메시지를 읽음으로 표시
  const markChatAsRead = (chatRoomId) => {
    setUnreadCounts(prev => {
      const updated = { ...prev };
      const removedCount = updated[chatRoomId] || 0;
      delete updated[chatRoomId];
      
      setTotalUnreadCount(prevTotal => Math.max(0, prevTotal - removedCount));
      
      return updated;
    });
  };

  return {
    unreadCounts,
    totalUnreadCount,
    getUnreadCount,
    markChatAsRead,
  };
};