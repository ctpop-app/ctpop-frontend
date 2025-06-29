import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import MessageBubble from '../components/chat/MessageBubble';
import MessageInput from '../components/chat/MessageInput';
import { sendChatMessage, getChatMessages } from '../api/chat';
import { MESSAGE_STATUS } from '../constants/messageStatus';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';

export default function ChatRoomScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { chatRoomId, otherUser } = route.params;
  const { user } = useAuth();
  const { isUserOnline } = useSocket();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // 실시간 메시지 구독
  useEffect(() => {
    if (!chatRoomId) return;

    console.log('채팅방 메시지 구독 시작:', chatRoomId);
    
    const messagesQuery = query(
      collection(db, 'messages'),
      where('chatId', '==', chatRoomId),
      orderBy('timestamp', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const newMessages = [];
      snapshot.forEach((doc) => {
        const messageData = doc.data();
        newMessages.push({
          id: doc.id,
          content: messageData.content,
          uuid: messageData.uuid,
          timestamp: messageData.timestamp,
          type: messageData.type,
          status: messageData.status || 'sent',
          isRead: messageData.isRead || false
        });
      });
      
      console.log('실시간 메시지 업데이트:', newMessages.length, '개');
      setMessages(newMessages);
      setLoading(false);
    }, (error) => {
      console.error('메시지 구독 오류:', error);
      setLoading(false);
    });

    return () => {
      console.log('메시지 구독 해제');
      unsubscribe();
    };
  }, [chatRoomId]);

  const handleSend = async (text) => {
    const newMessage = {
      id: Date.now().toString(),
      content: text,
      uuid: user.uuid,
      timestamp: new Date().toISOString(),
      type: 'text',
      status: MESSAGE_STATUS.SENDING
    };
    
    // 로컬에 즉시 추가 (낙관적 업데이트)
    setMessages(prev => [...prev, newMessage]);

    try {
      const result = await sendChatMessage(chatRoomId, {
        type: 'text',
        uuid: user.uuid,
        content: text
      });

      if (!result) {
        throw new Error('서버 응답이 없습니다.');
      }

      if (result.success) {
        // 성공 시 로컬 메시지 업데이트
        setMessages(prev => 
          prev.map(msg => 
            msg.id === newMessage.id 
              ? { ...msg, id: result.data.id, status: MESSAGE_STATUS.SENT }
              : msg
          )
        );
      } else {
        throw new Error(result.error || '메시지 전송에 실패했습니다.');
      }
    } catch (error) {
      console.error('메시지 전송 오류:', error);
      
      // 에러 메시지 설정
      const errorMessage = error.message || '알 수 없는 오류가 발생했습니다.';
      
      // 메시지 상태 업데이트
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id 
            ? { 
                ...msg, 
                status: MESSAGE_STATUS.ERROR,
                error: errorMessage
              }
            : msg
        )
      );

      // 사용자에게 알림
      Alert.alert(
        '메시지 전송 실패',
        errorMessage,
        [
          {
            text: '다시 시도',
            onPress: () => handleSend(text)
          },
          {
            text: '취소',
            style: 'cancel'
          }
        ]
      );
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.uuid === user.uuid;
    
    return (
      <MessageBubble
        message={item}
        isOwnMessage={isMe}
        otherUserPhotoURL={isMe ? null : otherUser?.mainPhotoURL}
      />
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      enabled
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#FF6B6B" />
        </TouchableOpacity>
        <Image
          source={otherUser.mainPhotoURL ? { uri: otherUser.mainPhotoURL } : require('../assets/default-profile.png')}
          style={styles.headerAvatar}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{otherUser.nickname}</Text>
          <Text style={styles.headerStatus}>
            {isUserOnline(otherUser.uuid) ? '접속중' : '오프라인'}
          </Text>
        </View>
      </View>

      {/* 메시지 목록 */}
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          if (messages.length > 0) {
            this.flatListRef?.scrollToEnd({ animated: true });
          }
        }}
        ref={(ref) => { this.flatListRef = ref; }}
      />

      {/* 입력 영역 */}
      <MessageInput
        onSend={handleSend}
        uuid={user.uuid}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 12,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  headerStatus: {
    fontSize: 12,
    color: '#aaa',
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 12,
  },
}); 