import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { formatMessageTime } from '../../utils/dateUtils';

const MessageBubble = ({ message, isOwnMessage, otherUserPhotoURL }) => {
  const { text, timestamp, status } = message;

  const getStatusText = (status) => {
    switch (status) {
      case 'sending': return '전송 중';
      case 'sent': return '전송됨';
      case 'delivered': return '전달됨';
      case 'read': return '읽음';
      default: return '';
    }
  };

  return (
    <View style={[styles.messageRow, isOwnMessage ? styles.messageRowMe : styles.messageRowOther]}>
      {!isOwnMessage && (
        <Image
          source={otherUserPhotoURL ? { uri: otherUserPhotoURL } : require('../../assets/default-profile.png')}
          style={styles.avatar}
        />
      )}
      <View style={styles.messageContainer}>
        <View style={[styles.messageBubble, isOwnMessage ? styles.messageBubbleMe : styles.messageBubbleOther]}>
          <Text style={[styles.messageText, isOwnMessage ? styles.messageTextMe : styles.messageTextOther]}>
            {text}
          </Text>
        </View>
        <View style={styles.messageFooter}>
          <Text style={styles.messageTime}>
            {formatMessageTime(timestamp)}
            {isOwnMessage && status && (
              <Text style={styles.status}> · {getStatusText(status)}</Text>
            )}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  messageRowMe: {
    flexDirection: 'row-reverse',
  },
  messageRowOther: {
    flexDirection: 'row',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 6,
  },
  messageContainer: {
    maxWidth: '70%',
    alignItems: 'flex-end',
  },
  messageBubble: {
    padding: 10,
    borderRadius: 16,
  },
  messageBubbleMe: {
    backgroundColor: '#FF6B6B',
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextMe: {
    color: '#fff',
  },
  messageTextOther: {
    color: '#222',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
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