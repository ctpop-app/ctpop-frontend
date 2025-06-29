import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatTimeAgo } from '../../utils/dateUtils';

const TalkItem = ({ talk, onMessage, onMore, isMyTalk = false }) => {
  return (
    <View style={[styles.talkItem, isMyTalk && styles.myTalkItem]}>
      <View style={styles.talkContent}>
        {talk.imageUrl ? (
          <Image source={{ uri: talk.imageUrl }} style={styles.talkImage} />
        ) : (
          <View style={styles.noImagePlaceholder}>
            <Ionicons name="image-outline" size={24} color="#ccc" />
          </View>
        )}
        <View style={styles.talkTextContainer}>
          <View style={styles.talkRow}>
            <Text style={styles.talkText}>
              {talk.content}
            </Text>
            <View style={styles.profileSection}>
              {!isMyTalk && (
                <TouchableOpacity onPress={() => onMessage(talk)} style={styles.messageButton}>
                  <Ionicons name="chatbubble-outline" size={28} color="#007AFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View style={styles.talkInfo}>
            <Text style={styles.authorName}>
              {isMyTalk ? '내 토크' : (talk.nickname || '익명')}
            </Text>
            <Text style={styles.timestamp}>• {formatTimeAgo(talk.createdAt)}</Text>
          </View>
        </View>
        {!isMyTalk && (
          <TouchableOpacity onPress={() => onMore(talk)} style={styles.actionButton}>
            <Ionicons name="ellipsis-vertical" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  talkItem: {
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  myTalkItem: {
    borderColor: '#FF6B6B',
    borderWidth: 2,
  },
  talkContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingRight: 12,
    paddingLeft: 4,
  },
  talkImage: {
    width: 48,
    height: 48,
    borderRadius: 4,
    marginRight: 12,
  },
  noImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  talkTextContainer: {
    flex: 1,
  },
  talkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  talkText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
    marginRight: 12,
    lineHeight: 20,
  },
  talkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageButton: {
    padding: 8,
    backgroundColor: '#F0F8FF',
    borderRadius: 16,
  },
  actionButton: {
    padding: 4,
  },
});

export default TalkItem; 