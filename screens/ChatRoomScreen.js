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
import { useNotifications } from '../hooks/useNotifications';
import { useGlobalChat } from '../hooks/useGlobalChat';
import { useUnreadMessages } from '../hooks/useUnreadMessages';
import MessageBubble from '../components/chat/MessageBubble';
import MessageInput from '../components/chat/MessageInput';
import ImageModal from '../components/chat/ImageModal';
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
  const { setCurrentChatRoom, clearCurrentChatRoom } = useNotifications();
  const { setCurrentChatRoomId, clearCurrentChatRoomId } = useGlobalChat();
  const { markChatAsRead } = useUnreadMessages();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
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

  // 현재 채팅방 상태 추적 및 읽음 처리
  useEffect(() => {
    if (chatRoomId) {
      // 채팅방 진입 시 현재 채팅방 설정
      setCurrentChatRoom(chatRoomId);
      setCurrentChatRoomId(chatRoomId);
      // console.log('📍 채팅방 진입:', chatRoomId);
      
      // 채팅방 진입 시 한 번만 읽음 처리
      markChatAsRead(chatRoomId);
    }

    return () => {
      // 채팅방 이탈 시 현재 채팅방 제거
      clearCurrentChatRoom();
      clearCurrentChatRoomId();
      // console.log('📍 채팅방 이탈:', chatRoomId);
    };
  }, [chatRoomId, setCurrentChatRoom, clearCurrentChatRoom, setCurrentChatRoomId, clearCurrentChatRoomId]);

  // 실시간 메시지 구독
  useEffect(() => {
    if (!chatRoomId) return;

    const messagesQuery = query(
      collection(db, 'messages'),
      where('chatId', '==', chatRoomId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate() : new Date(doc.data().timestamp)
      })).sort((a, b) => a.timestamp - b.timestamp);

      setMessages(newMessages);
      setLoading(false);
    }, (error) => {
      console.error('메시지 구독 오류:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chatRoomId]);

  // 새로고침 핸들러
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
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
      timestamp: new Date(), // Date 객체로 저장하여 밀리초 단위 정확도 보장
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

  const handleSendImage = async (imageUrl, tempId = null, localUri = null) => {
    const messageId = tempId || Date.now().toString();
    
    if (!imageUrl && tempId && localUri) {
      // 스켈레톤 메시지 생성
      const skeletonMessage = {
        id: messageId,
        content: localUri,
        uuid: user.uuid,
        timestamp: new Date(),
        type: 'image',
        status: MESSAGE_STATUS.SENDING,
        isSkeleton: true,
        uploadProgress: 0
      };
      
      setMessages(prev => [...prev, skeletonMessage]);
      return;
    }

    if (imageUrl && tempId) {
      // 업로드 완료 - 스켈레톤을 실제 이미지로 교체
      const newMessage = {
        id: messageId,
        content: imageUrl,
        uuid: user.uuid,
        timestamp: new Date(),
        type: 'image',
        status: MESSAGE_STATUS.SENDING,
        isSkeleton: false,
        uploadProgress: 100
      };
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? newMessage : msg
        )
      );

      try {
        const result = await sendChatMessage(chatRoomId, {
          type: 'image',
          uuid: user.uuid,
          content: imageUrl
        });

        if (!result) {
          throw new Error('서버 응답이 없습니다.');
        }

        if (result.success) {
          // 성공 시 로컬 메시지 업데이트
          setMessages(prev => 
            prev.map(msg => 
              msg.id === messageId 
                ? { ...msg, id: result.data.id, status: MESSAGE_STATUS.SENT }
                : msg
            )
          );
        } else {
          throw new Error(result.error || '이미지 전송에 실패했습니다.');
        }
      } catch (error) {
        console.error('이미지 전송 오류:', error);
        
        // 에러 메시지 설정
        const errorMessage = error.message || '알 수 없는 오류가 발생했습니다.';
        
        // 메시지 상태 업데이트
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId 
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
          '이미지 전송 실패',
          errorMessage,
          [
            {
              text: '다시 시도',
              onPress: () => handleSendImage(imageUrl, tempId)
            },
            {
              text: '취소',
              style: 'cancel'
            }
          ]
        );
      }
    }
  };

  // 업로드 진행률 업데이트 함수
  const updateImageProgress = (tempId, progress) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === tempId 
          ? { ...msg, uploadProgress: progress }
          : msg
      )
    );
  };

  // 업로드 에러 처리 함수
  const handleImageUploadError = (tempId, errorMessage) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === tempId 
          ? { 
              ...msg, 
              status: MESSAGE_STATUS.ERROR,
              error: errorMessage
            }
          : msg
      )
    );
  };

  // handleSendImage에 추가 함수들을 바인딩
  handleSendImage.updateProgress = updateImageProgress;
  handleSendImage.onError = handleImageUploadError;

  // 이미지 모달 핸들러
  const handleImagePress = (imageUri) => {
    console.log('📱 [DEBUG] 이미지 모달 열기 시도:', imageUri);
    setSelectedImageUri(imageUri);
    setIsImageModalVisible(true);
    console.log('📱 [DEBUG] 모달 상태 변경 완료');
  };

  const handleCloseImageModal = () => {
    console.log('❌ [DEBUG] 이미지 모달 닫기 버튼 클릭');
    setIsImageModalVisible(false);
    setSelectedImageUri(null);
  };

  const renderMessage = ({ item }) => {
    const isMe = item.uuid === user.uuid;
    
    return (
      <MessageBubble
        message={item}
        isOwnMessage={isMe}
        otherUserPhotoURL={isMe ? null : otherUser?.mainPhotoURL}
        onImagePress={handleImagePress}
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
        keyboardVerticalOffset={0}
        enabled={true}
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
          onContentSizeChange={(width, height) => {
            // console.log('📏 FlatList 콘텐츠 크기 변경:', { width, height });
            // 새 메시지가 추가될 때 자동 스크롤
            if (messages.length > 0) {
              setTimeout(() => {
                // console.log('  - 자동 스크롤 실행');
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 50);
            }
          }}
          onLayout={(event) => {
            const { width, height, x, y } = event.nativeEvent.layout;
            // console.log('📐 FlatList 레이아웃 변경:', { width, height, x, y });
            // console.log('  - 키보드 상태:', isKeyboardVisible);
            
            // 레이아웃이 변경될 때 스크롤 조정
            if (messages.length > 0) {
              setTimeout(() => {
                // console.log('  - 레이아웃 변경 후 스크롤 조정');
                flatListRef.current?.scrollToEnd({ animated: false });
              }, 50);
            }
          }}
          ref={flatListRef}
        />

        {/* 입력 영역 */}
        <MessageInput
          onSend={handleSend}
          onSendImage={handleSendImage}
          uuid={user.uuid}
          bottomInset={insets.bottom}
        />
      </KeyboardAvoidingView>
      
      {/* 이미지 모달 */}
      <ImageModal
        visible={isImageModalVisible}
        imageUri={selectedImageUri}
        onClose={handleCloseImageModal}
      />
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