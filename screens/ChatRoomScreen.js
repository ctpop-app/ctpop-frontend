import React, { useState, useEffect, useRef } from 'react';
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
  StatusBar,
  RefreshControl,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const [refreshing, setRefreshing] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);

  // 키보드 상태 감지
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

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

  // 새로고침 핸들러
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Firebase 실시간 구독이 이미 있으므로, 단순히 로딩 상태만 리셋
      console.log('메시지 새로고침 중...');
      // 실제로는 Firebase가 자동으로 최신 데이터를 제공하므로
      // 추가적인 API 호출 없이 상태만 리셋
      await new Promise(resolve => setTimeout(resolve, 1000)); // 최소 1초 로딩
    } catch (error) {
      console.error('새로고침 오류:', error);
    } finally {
      setRefreshing(false);
    }
  };

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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#fff"
        translucent={true}
      />
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#FF6B6B']}
              tintColor="#FF6B6B"
              title="새로고침 중..."
              titleColor="#FF6B6B"
            />
          }
          onContentSizeChange={() => {
            // 키보드가 보이지 않을 때만 자동 스크롤
            if (messages.length > 0 && !isKeyboardVisible) {
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }
          }}
          ref={flatListRef}
        />

        {/* 입력 영역 */}
        <MessageInput
          onSend={handleSend}
          uuid={user.uuid}
          bottomInset={insets.bottom}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
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