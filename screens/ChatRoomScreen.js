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
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import MessageBubble from '../components/chat/MessageBubble';
import MessageInput from '../components/chat/MessageInput';

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
  ],
  '2': [
    {
      id: '2-1',
      text: '오늘 저녁에 시간 되세요?',
      senderId: '2',
      timestamp: new Date(Date.now() - 7200000).toISOString(), // 2시간 전
    }
  ],
  '3': [
    {
      id: '3-1',
      text: '추천해주신 카페 정말 좋았어요.',
      senderId: '3',
      timestamp: new Date(Date.now() - 86400000).toISOString(), // 1일 전
    }
  ],
  '4': [
    {
      id: '4-1',
      text: '행사 정보 공유해 주셔서 감사합니다!',
      senderId: '4',
      timestamp: new Date(Date.now() - 172800000).toISOString(), // 2일 전
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

  const handleSend = (text) => {
    const newMessage = {
      id: Date.now().toString(),
      text: text,
      senderId: 'current-user',
      timestamp: new Date().toISOString(),
      status: 'sending' // 초기 상태는 'sending'
    };
    
    setMessages(prev => [...prev, newMessage]);

    // 메시지 전송 시뮬레이션 (실제 구현 시에는 소켓 이벤트로 대체)
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, status: 'sent' }
            : msg
        )
      );
    }, 1000);

    // 전달 상태 시뮬레이션
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, status: 'delivered' }
            : msg
        )
      );
    }, 2000);
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
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