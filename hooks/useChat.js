import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, limit } from 'firebase/firestore';
import { sendChatMessage, updateMessageReadStatus } from '../api/chat';
import { useOfflineQueue } from './useOfflineQueue';
import { handleError } from '../utils/errorHandler';

const MESSAGES_PER_PAGE = 20;

export const useChat = (chatId, uuid) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastMessageId, setLastMessageId] = useState(null);

  const { addOperation } = useOfflineQueue();

  // TODO: 소켓 연결이 완성되면 아래 주석을 해제하고 실시간 메시지 구독을 활성화하세요
  // const { data: realtimeMessages, loading: realtimeLoading, error: realtimeError } = useRealtimeCollection(
  //   'messages',
  //   {
  //     where: [['chatId', '==', chatId]],
  //     orderBy: ['timestamp', 'desc'],
  //     limit: MESSAGES_PER_PAGE
  //   }
  // );

  // 실시간 메시지 구독
  useEffect(() => {
    if (!chatId) return;

    // TODO: 소켓 연결이 완성되면 아래 주석을 해제하고 실시간 메시지 구독을 활성화하세요
    // if (realtimeMessages) {
    //   setMessages(realtimeMessages);
    //   setLoading(false);
    //   if (realtimeMessages.length < MESSAGES_PER_PAGE) {
    //     setHasMore(false);
    //   }
    //   if (realtimeMessages.length > 0) {
    //     setLastMessageId(realtimeMessages[realtimeMessages.length - 1].id);
    //   }
    // }

    // 임시: Firestore에서 직접 메시지 가져오기
    const messagesQuery = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      orderBy('timestamp', 'desc'),
      limit(MESSAGES_PER_PAGE)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(newMessages);
      setLoading(false);
      if (newMessages.length < MESSAGES_PER_PAGE) {
        setHasMore(false);
      }
      if (newMessages.length > 0) {
        setLastMessageId(newMessages[newMessages.length - 1].id);
      }
    }, (error) => {
      console.error('메시지 구독 오류:', error);
      setError(error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chatId]);

  // 메시지 전송
  const sendMessage = useCallback(async (content, type = 'text', metadata = {}) => {
    try {
      const messageData = {
        content,
        senderId: uuid,
        type,
        metadata,
        status: 'sending'
      };

      // 오프라인 큐에 메시지 전송 작업 추가
      return await addOperation({
        type: 'SEND_MESSAGE',
        data: {
          chatId,
          messageData
        },
        execute: async () => {
          const result = await sendChatMessage(chatId, messageData);
          if (!result.success) {
            throw new Error(result.error);
          }
          return result.data;
        }
      });
    } catch (error) {
      const handledError = handleError(error, '메시지 전송 오류');
      setError(handledError);
      throw handledError;
    }
  }, [chatId, uuid, addOperation]);

  // 메시지 읽음 상태 업데이트
  const markMessageAsRead = useCallback(async (messageId) => {
    try {
      await addOperation({
        type: 'UPDATE_MESSAGE_READ_STATUS',
        data: {
          messageId,
          isRead: true
        },
        execute: async () => {
          const result = await updateMessageReadStatus(messageId, true);
          if (!result.success) {
            throw new Error(result.error);
          }
          return result.data;
        }
      });
    } catch (error) {
      const handledError = handleError(error, '메시지 읽음 상태 업데이트 오류');
      setError(handledError);
      throw handledError;
    }
  }, [addOperation]);

  // 이미지 메시지 전송
  const sendImageMessage = useCallback(async (imageUrl, imageSize, imageWidth, imageHeight) => {
    try {
      return await sendMessage(imageUrl, 'image', {
        imageUrl,
        imageSize,
        imageWidth,
        imageHeight
      });
    } catch (error) {
      const handledError = handleError(error, '이미지 메시지 전송 오류');
      setError(handledError);
      throw handledError;
    }
  }, [sendMessage]);

  // 이전 메시지 로드
  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || loading) return;

    try {
      setLoading(true);
      const result = await getChatMessages(chatId, {
        lastMessageId,
        limit: MESSAGES_PER_PAGE
      });

      if (result.success) {
        const newMessages = result.data;
        setMessages(prev => [...prev, ...newMessages]);
        if (newMessages.length < MESSAGES_PER_PAGE) {
          setHasMore(false);
        }
        if (newMessages.length > 0) {
          setLastMessageId(newMessages[newMessages.length - 1].id);
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      const handledError = handleError(error, '이전 메시지 로드 오류');
      setError(handledError);
    } finally {
      setLoading(false);
    }
  }, [chatId, hasMore, lastMessageId, loading]);

  return {
    messages,
    loading,
    error,
    hasMore,
    sendMessage,
    sendImageMessage,
    markMessageAsRead,
    loadMoreMessages
  };
}; 