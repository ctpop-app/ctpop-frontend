import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useChat } from '../../hooks/useChat';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import ImageMessage from './ImageMessage';

const ChatRoom = ({ chatId, userId, onSendImage }) => {
  const { messages, loading, error, sendChatMessage, sendImageMessage, markMessageAsRead } = useChat(chatId, userId);
  const flatListRef = useRef(null);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);

  // 새 메시지가 오면 스크롤
  useEffect(() => {
    if (isScrolledToBottom && messages.length > 0) {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  }, [messages, isScrolledToBottom]);

  // 메시지 렌더링
  const renderMessage = ({ item }) => {
    if (item.type === 'image') {
      return (
        <ImageMessage
          message={item}
          isOwnMessage={item.senderId === userId}
          onPress={() => {/* 이미지 확대 기능 */}}
        />
      );
    }
    return (
      <MessageBubble
        message={item}
        isOwnMessage={item.senderId === userId}
      />
    );
  };

  // 메시지 전송
  const handleSendMessage = async (content) => {
    try {
      await sendChatMessage(content);
    } catch (error) {
      console.error('Error sending message:', error);
      // 에러 처리
    }
  };

  // 이미지 전송
  const handleSendImage = async (imageUrl) => {
    try {
      await sendImageMessage(imageUrl);
    } catch (error) {
      console.error('Error sending image:', error);
      // 에러 처리
    }
  };

  // 스크롤 이벤트 처리
  const handleScroll = (event) => {
    const { contentOffset } = event.nativeEvent;
    setIsScrolledToBottom(contentOffset.y <= 0);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        inverted
        onScroll={handleScroll}
        contentContainerStyle={styles.messageList}
      />
      <MessageInput
        onSend={handleSendMessage}
        onSendImage={handleSendImage}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});

export default ChatRoom; 