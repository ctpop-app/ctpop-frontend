import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, and, updateDoc, doc, getDocs } from 'firebase/firestore';
import { useAuth } from './useAuth';

/**
 * 읽지 않은 메시지 카운트 관리 훅
 */
export const useUnreadMessages = () => {
  const { user } = useAuth();
  const [unreadCounts, setUnreadCounts] = useState({});
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [processingChats, setProcessingChats] = useState(new Set()); // 처리 중인 채팅방 추적

  useEffect(() => {
    if (!user?.uuid) return;

    console.log('읽지 않은 메시지 모니터링 시작:', user.uuid);

    // 모든 메시지를 조회하고 클라이언트에서 필터링
    const messagesQuery = query(
      collection(db, 'messages'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const unreadByChat = {};
      let totalCount = 0;

      snapshot.docs.forEach(doc => {
        const message = doc.data();
        
        // 자신이 보낸 메시지가 아니고, 읽지 않은 메시지인 경우
        if (message.uuid !== user.uuid && 
            (!message.readBy || !message.readBy.includes(user.uuid))) {
          const chatId = message.chatId;
          if (chatId) {
            unreadByChat[chatId] = (unreadByChat[chatId] || 0) + 1;
            totalCount++;
          }
        }
      });

      // 상태가 실제로 변경된 경우에만 업데이트
      setUnreadCounts(prev => {
        const prevString = JSON.stringify(prev);
        const newString = JSON.stringify(unreadByChat);
        if (prevString !== newString) {
          return unreadByChat;
        }
        return prev;
      });
      
      setTotalUnreadCount(prev => {
        if (prev !== totalCount) {
          return totalCount;
        }
        return prev;
      });
      
      // 디버깅용 로그 (필요시에만 활성화)
      // console.log('읽지 않은 메시지 업데이트:', {
      //   unreadByChat,
      //   totalCount,
      //   userUuid: user.uuid
      // });
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
    const count = unreadCounts[chatRoomId] || 0;
    return count;
  };

  // 채팅방 메시지를 읽음으로 표시
  const markChatAsRead = async (chatRoomId) => {
    if (!user?.uuid) return;

    // 이미 처리 중인 채팅방이면 중복 처리 방지
    if (processingChats.has(chatRoomId)) {
      return;
    }

    try {
      // 처리 중인 채팅방으로 표시
      setProcessingChats(prev => new Set(prev).add(chatRoomId));
      
      // 해당 채팅방의 읽지 않은 메시지들을 찾기
      const messagesQuery = query(
        collection(db, 'messages'),
        where('chatId', '==', chatRoomId),
        where('uuid', '!=', user.uuid) // 자신이 보낸 메시지 제외
      );

      const snapshot = await getDocs(messagesQuery);
      const updatePromises = [];

      snapshot.docs.forEach(docSnapshot => {
        const message = docSnapshot.data();
        
        // 읽지 않은 메시지인 경우
        if (!message.readBy || !message.readBy.includes(user.uuid)) {
          const messageRef = doc(db, 'messages', docSnapshot.id);
          const updatedReadBy = message.readBy ? [...message.readBy, user.uuid] : [user.uuid];
          
          updatePromises.push(
            updateDoc(messageRef, {
              readBy: updatedReadBy,
              status: 'read'
            })
          );
        }
      });

      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }

      // 로컬 상태 업데이트
      setUnreadCounts(prev => {
        const updated = { ...prev };
        const removedCount = updated[chatRoomId] || 0;
        delete updated[chatRoomId];
        
        setTotalUnreadCount(prevTotal => Math.max(0, prevTotal - removedCount));
        
        return updated;
      });
    } catch (error) {
      console.error(`채팅방 ${chatRoomId} 읽음 처리 오류:`, error);
    } finally {
      // 처리 완료 후 처리 중인 채팅방에서 제거
      setProcessingChats(prev => {
        const newSet = new Set(prev);
        newSet.delete(chatRoomId);
        return newSet;
      });
    }
  };

  return {
    unreadCounts,
    totalUnreadCount,
    getUnreadCount,
    markChatAsRead,
  };
};