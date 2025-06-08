import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatTime } from '../../utils/dateUtils';

const MessageBubble = ({ message, isOwnMessage }) => {
  const { content, timestamp, status } = message;

  return (
    <View style={[
      styles.container,
      isOwnMessage ? styles.ownMessage : styles.otherMessage
    ]}>
      <View style={[
        styles.bubble,
        isOwnMessage ? styles.ownBubble : styles.otherBubble
      ]}>
        <Text style={[
          styles.text,
          isOwnMessage ? styles.ownText : styles.otherText
        ]}>
          {content}
        </Text>
      </View>
      <Text style={styles.timestamp}>
        {formatTime(timestamp.toDate())}
      </Text>
      {isOwnMessage && (
        <Text style={styles.status}>
          {status === 'sending' ? '전송 중' : 
           status === 'sent' ? '전송됨' :
           status === 'delivered' ? '전달됨' :
           status === 'read' ? '읽음' : ''}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  bubble: {
    padding: 12,
    borderRadius: 20,
    maxWidth: '100%',
  },
  ownBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#E5E5EA',
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownText: {
    color: '#FFFFFF',
  },
  otherText: {
    color: '#000000',
  },
  timestamp: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  status: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
    alignSelf: 'flex-end',
  },
});

export default MessageBubble; 