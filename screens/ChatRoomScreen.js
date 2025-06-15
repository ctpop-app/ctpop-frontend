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
import { sendChatMessage } from '../api/chat';
import { MESSAGE_STATUS } from '../constants/messageStatus';

// 더미 메시지 데이터
const dummyMessages = {
  '1': [
    {
      id: '1-1',
      text: '안녕하세요! 반갑습니다.',
      senderId: '1',
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1시간 전
      status: 'read'
    },
    {
      id: '1-2',
      text: '네, 반갑습니다!',
      senderId: 'current-user',
      timestamp: new Date(Date.now() - 3500000).toISOString(),
      status: 'delivered'
    },
    {
      id: '1-3',
      text: '오늘 날씨가 정말 좋네요.',
      senderId: '1',
      timestamp: new Date(Date.now() - 3400000).toISOString(),
      status: 'read'
    }
  ]
};

export default function ChatRoomScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { chatRoomId, otherUser } = route.params;
  const { user } = useAuth();
  const { isUserOnline } = useSocket();
  const [messages, setMessages] = useState([]);

  // 채팅방 ID에 해당하는 더미 메시지 로드
  useEffect(() => {
    const chatMessages = dummyMessages[chatRoomId] || [];
    setMessages(chatMessages);
  }, [chatRoomId]);

  const handleSend = async (text) => {
    const newMessage = {
      id: Date.now().toString(),
      text: text,
      senderId: user.uuid,
      timestamp: new Date().toISOString(),
      status: MESSAGE_STATUS.SENDING
    };
    
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
    const isMe = item.senderId === 'current-user';
    
    return (
      <MessageBubble
        message={item}
        isOwnMessage={isMe}
        otherUserPhotoURL={otherUser.mainPhotoURL}
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