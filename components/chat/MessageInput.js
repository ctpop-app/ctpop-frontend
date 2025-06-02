import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../../services/imageService';

const MessageInput = ({ onSend, onSendImage }) => {
  const [message, setMessage] = useState('');

  const handleSend = async () => {
    if (message.trim()) {
      await onSend(message.trim());
      setMessage('');
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
        const imageUrl = await uploadImage(result.assets[0].uri);
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
        style={styles.input}
        value={message}
        onChangeText={setMessage}
        placeholder="메시지를 입력하세요..."
        multiline
        maxLength={1000}
        returnKeyType="send"
        onSubmitEditing={handleSend}
        blurOnSubmit={false}
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