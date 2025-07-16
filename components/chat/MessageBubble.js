import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { formatMessageTime } from '../../utils/dateUtils';
import { getMessageStatusText } from '../../constants/messageStatus';
import ImageUploadSkeleton from './ImageUploadSkeleton';

const MessageBubble = ({ message, isOwnMessage, otherUserPhotoURL }) => {
  const { content, timestamp, status, error, type, isSkeleton, uploadProgress } = message;

  const renderMessageContent = () => {
    if (type === 'image') {
      if (isSkeleton) {
        // 스켈레톤 상태 - 로컬 이미지와 진행률 표시
        return (
          <View style={styles.imageContainer}>
            <ImageUploadSkeleton 
              progress={uploadProgress || 0} 
              width={200} 
              height={150} 
            />
          </View>
        );
      } else {
        // 실제 이미지 표시
        return (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: content }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          </View>
        );
      }
    } else {
      // 텍스트 메시지
      return (
        <Text style={[styles.messageText, isOwnMessage ? styles.messageTextMe : styles.messageTextOther]}>
          {content}
        </Text>
      );
    }
  };

  return (
    <View style={[
      styles.container,
      isOwnMessage ? styles.ownMessage : styles.otherMessage
    ]}>
      {!isOwnMessage && (
        <View style={styles.avatarContainer}>
          {otherUserPhotoURL ? (
            <Image
              source={{ uri: otherUserPhotoURL }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.defaultAvatar} />
          )}
        </View>
      )}
      <View style={styles.messageContainer}>
        <View style={[
          styles.messageBubble, 
          isOwnMessage ? styles.messageBubbleMe : styles.messageBubbleOther,
          type === 'image' && styles.imageBubble
        ]}>
          {renderMessageContent()}
        </View>
        <View style={styles.messageFooter}>
          <Text style={styles.messageTime}>
            {formatMessageTime(timestamp)}
            {isOwnMessage && status && (
              <Text style={styles.status}> · {getMessageStatusText(status, error)}</Text>
            )}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
    marginBottom: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  defaultAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
  },
  messageContainer: {
    maxWidth: '70%',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
  },
  imageBubble: {
    padding: 4,
  },
  messageBubbleMe: {
    backgroundColor: '#FF6B6B',
    borderBottomRightRadius: 6,
  },
  messageBubbleOther: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageTextMe: {
    color: '#fff',
  },
  messageTextOther: {
    color: '#222',
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginHorizontal: 4,
  },
  messageTime: {
    fontSize: 11,
    color: '#aaa',
  },
  status: {
    fontSize: 11,
    color: '#aaa',
  },
});

export default MessageBubble; 