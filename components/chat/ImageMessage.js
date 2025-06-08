import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Image as CachedImage } from 'expo-image';
import { formatTime } from '../../utils/dateUtils';

const ImageMessage = ({ message, isOwnMessage, onPress }) => {
  const { content, timestamp, status } = message;

  return (
    <View style={[
      styles.container,
      isOwnMessage ? styles.ownMessage : styles.otherMessage
    ]}>
      <TouchableOpacity onPress={onPress}>
        <CachedImage
          source={{ uri: content }}
          style={styles.image}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />
      </TouchableOpacity>
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
  image: {
    width: 200,
    height: 200,
    borderRadius: 12,
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

export default ImageMessage; 