import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { formatMessageTime } from '../../utils/dateUtils';
import { getMessageStatusText } from '../../constants/messageStatus';

const MessageBubble = ({ message, isOwnMessage, otherUserPhotoURL }) => {
  const { content, timestamp, status, error } = message;

  return (
    <View style={[
      styles.container,
      isOwnMessage ? styles.ownMessage : styles.otherMessage
    ]}>
      {!isOwnMessage && (
        <Image
          source={otherUserPhotoURL ? { uri: otherUserPhotoURL } : require('../../assets/default-profile.png')}
          style={styles.avatar}
        />
      )}
      <View style={styles.messageContainer}>
        <View style={[styles.messageBubble, isOwnMessage ? styles.messageBubbleMe : styles.messageBubbleOther]}>
          <Text style={[styles.messageText, isOwnMessage ? styles.messageTextMe : styles.messageTextOther]}>
            {content}
          </Text>
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
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 6,
  },
  messageContainer: {
    maxWidth: '100%',
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
    fontSize: 16,
    color: '#000',
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