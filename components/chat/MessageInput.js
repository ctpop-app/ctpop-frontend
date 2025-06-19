import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform, AppState, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../../services/imageService';

const MessageInput = ({ onSend, onSendImage, uuid }) => {
  const [message, setMessage] = useState('');
  const [appState, setAppState] = useState(AppState.currentState);
  const keyboardTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // 키보드 상태 변경을 지연시켜 처리
        if (keyboardTimeoutRef.current) {
          clearTimeout(keyboardTimeoutRef.current);
        }
        keyboardTimeoutRef.current = setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.blur();
          }
        }, 100);
      }
      setAppState(nextAppState);
    });

    return () => {
      if (keyboardTimeoutRef.current) {
        clearTimeout(keyboardTimeoutRef.current);
      }
      subscription.remove();
    };
  }, [appState]);

  const handleSend = async () => {
    if (message.trim()) {
      await onSend(message.trim());
      setMessage('');
      // 메시지 전송 후 키보드 포커스 유지
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleImagePick = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('이미지 접근 권한이 필요합니다.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const imageUrl = await uploadImage(result.assets[0].uri, 'chat', uuid);
        await onSendImage(imageUrl);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('이미지 선택 중 오류가 발생했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleImagePick} style={styles.imageButton}>
        <Ionicons name="image-outline" size={24} color="#007AFF" />
      </TouchableOpacity>
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={message}
        onChangeText={setMessage}
        placeholder="메시지를 입력하세요..."
        multiline
        maxLength={1000}
        returnKeyType="send"
        onSubmitEditing={handleSend}
        blurOnSubmit={false}
        keyboardType="default"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity 
        onPress={handleSend}
        style={[
          styles.sendButton,
          !message.trim() && styles.sendButtonDisabled
        ]}
        disabled={!message.trim()}
      >
        <Ionicons 
          name="send" 
          size={24} 
          color={message.trim() ? '#007AFF' : '#C7C7CC'} 
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  input: {
    flex: 1,
    marginHorizontal: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 100,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    fontSize: 16,
  },
  imageButton: {
    padding: 8,
  },
  sendButton: {
    padding: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default MessageInput; 