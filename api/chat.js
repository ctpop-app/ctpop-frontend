import { db } from '../firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs, updateDoc, doc, deleteDoc, getDoc } from 'firebase/firestore';
import Chat from '../models/Chat';
import Message from '../models/Message';
import { handleError, withNetworkRetry } from '../utils/errorHandler';
import { auth } from '../firebase';
import { getCurrentKST } from '../utils/dateUtils';
import useUserStore from '../store/userStore';

/**
 * 사용자의 채팅방 목록을 가져옵니다.
 * @param {string} uuid - 사용자 UUID
 * @param {Object} params - 페이징 등의 파라미터
 * @returns {Promise<Object>} - 성공 여부와 채팅방 목록
 */
export const getChatRooms = async () => {
  try {
    const user = useUserStore.getState().user;
    if (!user?.uuid) {
      throw new Error('사용자가 로그인되어 있지 않습니다.');
    }

    console.log('채팅방 조회 시작 - 사용자:', user.uuid);
    
    // 채팅방 컬렉션에서 현재 사용자가 참여한 채팅방만 조회
    const chatRoomsRef = collection(db, 'chatRooms');
    const q = query(
      chatRoomsRef,
      where('participants', 'array-contains', user.uuid)
    );
    
    const querySnapshot = await getDocs(q);
    console.log('채팅방 조회 결과:', querySnapshot.size, '개의 채팅방 발견');
    
    const rooms = [];
    for (const doc of querySnapshot.docs) {
      const roomData = doc.data();
      console.log('채팅방 데이터:', doc.id, roomData);
      
      rooms.push({
        id: doc.id,
        ...roomData,
        createdAt: roomData.createdAt?.toDate?.() || new Date(),
        updatedAt: roomData.updatedAt?.toDate?.() || new Date()
      });
    }

    return rooms;
  } catch (error) {
    console.error('채팅방 조회 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 특정 채팅방의 메시지 목록을 가져옵니다.
 * @param {string} roomId - 채팅방 ID
 * @param {Object} params - 페이징 등의 파라미터
 * @returns {Promise<Object>} - 성공 여부와 메시지 목록
 */
export const getChatMessages = async (roomId, params = {}) => {
  return withNetworkRetry(async () => {
    try {
      let messagesQuery = query(
        collection(db, 'messages'),
        where('chatId', '==', roomId),
        orderBy('timestamp', 'desc'),
        limit(params.limit || 20)
      );

      if (params.lastMessageId) {
        const lastMessageDoc = await getDocs(query(
          collection(db, 'messages'),
          where('__name__', '==', params.lastMessageId)
        ));
        if (!lastMessageDoc.empty) {
          messagesQuery = query(
            collection(db, 'messages'),
            where('chatId', '==', roomId),
            orderBy('timestamp', 'desc'),
            limit(params.limit || 20),
            where('timestamp', '<', lastMessageDoc.docs[0].data().timestamp)
          );
        }
      }

      const snapshot = await getDocs(messagesQuery);
      return { 
        success: true, 
        data: snapshot.docs.map(doc => Message.fromFirestore(doc.id, doc.data()))
      };
    } catch (error) {
      return handleError(error, '채팅 메시지 가져오기 오류');
    }
  });
};

/**
 * 새로운 채팅 메시지를 전송합니다.
 * @param {string} roomId - 채팅방 ID
 * @param {Object} messageData - 메시지 데이터
 * @returns {Promise<Object>} - 성공 여부와 전송된 메시지 정보
 */
export const sendChatMessage = async (roomId, messageData) => {
  return withNetworkRetry(async () => {
    try {
      console.log('메시지 전송 시작:', { roomId, messageData });

      const message = messageData.type === 'text' 
        ? Message.createText(roomId, messageData.uuid, messageData.content)
        : Message.createImage(roomId, messageData.uuid, messageData.content, 
            messageData.metadata?.imageSize, 
            messageData.metadata?.imageWidth, 
            messageData.metadata?.imageHeight);

      message.validate();
      console.log('메시지 객체 생성 완료:', message);

      const messageRef = await addDoc(collection(db, 'messages'), message.toFirestore());
      console.log('Firestore에 메시지 저장 성공:', { 
        messageId: messageRef.id,
        path: messageRef.path 
      });

      // 채팅방 업데이트
      const chatRef = doc(db, 'chatRooms', roomId);
      const chatDoc = await getDoc(chatRef);
      if (chatDoc.exists()) {
        const chat = Chat.fromFirestore(chatDoc.id, chatDoc.data());
        chat.updateLastMessage(message);
        await updateDoc(chatRef, chat.toFirestore());
        console.log('채팅방 마지막 메시지 업데이트 완료:', {
          chatId: roomId,
          lastMessage: chat.lastMessage
        });
      } else {
        console.warn('채팅방을 찾을 수 없음:', roomId);
      }

      return { success: true, data: { id: messageRef.id } };
    } catch (error) {
      console.error('메시지 전송 중 오류 발생:', error);
      return handleError(error, '메시지 전송 오류');
    }
  });
};

/**
 * 새로운 채팅방을 생성합니다.
 * @param {Object} roomData - 채팅방 생성 데이터 (참가자 등)
 * @returns {Promise<Object>} - 성공 여부와 생성된 채팅방 정보
 */
export const createChatRoom = async (roomData) => {
  return withNetworkRetry(async () => {
    try {
      const chat = Chat.create(roomData.participants);
      chat.validate();
      const chatRef = await addDoc(collection(db, 'chatRooms'), chat.toFirestore());
      return { success: true, data: { id: chatRef.id } };
    } catch (error) {
      return handleError(error, '채팅방 생성 오류');
    }
  });
};

/**
 * 채팅방에서 나갑니다.
 * @param {string} roomId - 채팅방 ID
 * @returns {Promise<Object>} - 성공 여부
 */
export const leaveChatRoom = async (roomId) => {
  return withNetworkRetry(async () => {
    try {
      await deleteDoc(doc(db, 'chats', roomId));
      return { success: true, data: {} };
    } catch (error) {
      return handleError(error, '채팅방 나가기 오류');
    }
  });
};

/**
 * 채팅방에 사용자를 초대합니다.
 * @param {string} roomId - 채팅방 ID
 * @param {Array} uuids - 초대할 사용자 UUID 목록
 * @returns {Promise<Object>} - 성공 여부와 초대 결과
 */
export const inviteToChat = async (roomId, uuids) => {
  return withNetworkRetry(async () => {
    try {
      const chatRef = doc(db, 'chatRooms', roomId);
      const chatDoc = await getDoc(chatRef);
      if (chatDoc.exists()) {
        const chat = Chat.fromFirestore(chatDoc.id, chatDoc.data());
        uuids.forEach(uuid => chat.addParticipant(uuid));
        await updateDoc(chatRef, chat.toFirestore());
      }
      return { success: true, data: {} };
    } catch (error) {
      return handleError(error, '사용자 초대 오류');
    }
  });
};

/**
 * 채팅방 정보를 업데이트합니다.
 * @param {string} roomId - 채팅방 ID
 * @param {Object} roomData - 업데이트할 채팅방 데이터
 * @returns {Promise<Object>} - 성공 여부와 업데이트된 채팅방 정보
 */
export const updateChatRoom = async (roomId, roomData) => {
  return withNetworkRetry(async () => {
    try {
      const chatRef = doc(db, 'chatRooms', roomId);
      const chatDoc = await getDoc(chatRef);
      if (chatDoc.exists()) {
        const chat = Chat.fromFirestore(chatDoc.id, chatDoc.data());
        if (roomData.participants) {
          chat.participants = roomData.participants;
        }
        chat.validate();
        await updateDoc(chatRef, chat.toFirestore());
      }
      return { success: true, data: {} };
    } catch (error) {
      return handleError(error, '채팅방 정보 업데이트 오류');
    }
  });
};

/**
 * 메시지 읽음 상태를 업데이트합니다.
 * @param {string} messageId - 메시지 ID
 * @param {boolean} isRead - 읽음 상태
 * @returns {Promise<Object>} - 성공 여부
 */
export const updateMessageReadStatus = async (messageId, isRead) => {
  return withNetworkRetry(async () => {
    try {
      const messageRef = doc(db, 'messages', messageId);
      const messageDoc = await getDocs(messageRef);
      if (!messageDoc.empty) {
        const message = Message.fromFirestore(messageDoc.id, messageDoc.data());
        if (isRead) {
          message.markAsRead();
        } else {
          message.updateStatus('delivered');
        }
        await updateDoc(messageRef, message.toFirestore());
      }
      return { success: true, data: {} };
    } catch (error) {
      return handleError(error, '메시지 읽음 상태 업데이트 오류');
    }
  });
};

/**
 * 채팅방을 삭제합니다.
 * @param {string} chatId - 채팅방 ID
 * @returns {Promise<Object>} - 성공 여부
 */
export const deleteChat = async (chatId) => {
  return withNetworkRetry(async () => {
    try {
      await deleteDoc(doc(db, 'chatRooms', chatId));
      return { success: true, data: {} };
    } catch (error) {
      return handleError(error, '채팅방 삭제 오류');
    }
  });
};

/**
 * 특정 채팅방의 상세 정보를 가져옵니다.
 * @param {string} roomId - 채팅방 ID
 * @returns {Promise<Object>} - 성공 여부와 채팅방 상세 정보
 */
export const getChatRoomDetails = async (roomId) => {
  return withNetworkRetry(async () => {
    try {
      const chatRef = doc(db, 'chatRooms', roomId);
      const chatDoc = await getDoc(chatRef);
      
      if (!chatDoc.exists()) {
        throw new Error('채팅방을 찾을 수 없습니다.');
      }

      const chatData = chatDoc.data();
      
      // 마지막 메시지 정보 가져오기
      const messagesQuery = query(
        collection(db, 'messages'),
        where('chatId', '==', roomId),
        orderBy('timestamp', 'desc'),
        limit(1)
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      const lastMessage = messagesSnapshot.empty ? null : messagesSnapshot.docs[0].data();

      // 상대방 정보 가져오기
      const currentUser = useUserStore.getState().user;
      const otherParticipantId = chatData.participants.find(p => p !== currentUser.uuid);
      
      const otherUserRef = doc(db, 'users', otherParticipantId);
      const otherUserDoc = await getDoc(otherUserRef);
      const otherUser = otherUserDoc.exists() ? otherUserDoc.data() : null;

      return {
        ...chatData,
        lastMessage,
        otherUser: otherUser ? {
          uuid: otherUserDoc.id,
          nickname: otherUser.nickname,
          profileImage: otherUser.profileImage
        } : null
      };
    } catch (error) {
      return handleError(error, '채팅방 상세 정보 가져오기 오류');
    }
  });
}; 