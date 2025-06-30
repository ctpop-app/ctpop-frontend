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
import { getOrientationColor } from '../../utils/colors';

const TalkItem = ({ talk, onMessage, onMore, isMyTalk = false, onProfilePress }) => {
  const authorProfile = talk?.authorProfile || {};
  
  return (
    <View style={[styles.talkItem, isMyTalk && styles.myTalkItem]}>
      <View style={styles.talkContent}>
        {talk.imageUrl ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: talk.imageUrl }} style={styles.talkImage} />
            <Text style={styles.timestamp}>{formatTimeAgo(talk.createdAt)}</Text>
          </View>
        ) : (
          <View style={styles.imageContainer}>
            <View style={styles.noImagePlaceholder}>
              <Ionicons name="image-outline" size={24} color="#ccc" />
            </View>
            <Text style={styles.timestamp}>{formatTimeAgo(talk.createdAt)}</Text>
          </View>
        )}
        <View style={styles.talkTextContainer}>
          <View style={styles.talkRow}>
            <Text style={styles.talkText}>
              {talk.content}
            </Text>
            <View style={styles.profileSection}>
              <TouchableOpacity onPress={() => onProfilePress && onProfilePress(authorProfile)}>
                <Image 
                  source={authorProfile?.mainPhotoURL ? { uri: authorProfile.mainPhotoURL } : require('../../assets/default-profile.png')}
                  style={styles.profilePhoto}
                />
              </TouchableOpacity>
              {!isMyTalk && (
                <TouchableOpacity onPress={() => onMessage(talk)} style={styles.messageButton}>
                  <Ionicons name="chatbubble-outline" size={28} color="#007AFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {/* 컴팩트한 프로필 박스 */}
          <View style={styles.profileBox}>
            <View style={styles.profileBoxContent}>
              <View style={styles.profileDetails}>
                {authorProfile?.age && <Text style={styles.detailText}>{authorProfile.age}세</Text>}
                {authorProfile?.height && <Text style={styles.detailText}>• {authorProfile.height}cm</Text>}
                {authorProfile?.weight && <Text style={styles.detailText}>• {authorProfile.weight}kg</Text>}
                {authorProfile?.orientation && (
                  <View style={[styles.orientationBadge, { backgroundColor: getOrientationColor(authorProfile.orientation) }]}>
                    <Text style={styles.orientationText}>{authorProfile.orientation}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.authorName}>
                {isMyTalk ? '내 토크' : (authorProfile?.nickname || '익명')}
              </Text>
            </View>
            <Text style={styles.distance}>1.2km</Text>
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
    paddingVertical: 6,
    paddingRight: 6,
    paddingLeft: 4,
  },
  talkImage: {
    width: 48,
    height: 48,
    borderRadius: 4,
  },
  noImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginRight: 8,
    lineHeight: 20,
  },
  talkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePhoto: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 6,
  },
  messageButton: {
    padding: 8,
    backgroundColor: '#F0F8FF',
    borderRadius: 16,
  },
  actionButton: {
    padding: 4,
  },
  profileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  profileBoxContent: {
    flex: 1,
  },
  profileDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  detailText: {
    fontSize: 10,
    color: '#666',
    marginRight: 4,
  },
  orientationBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    marginRight: 4,
  },
  orientationText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '600',
  },
  locationText: {
    fontSize: 10,
    color: '#666',
  },
  imageContainer: {
    alignItems: 'center',
    marginRight: 8,
  },
  distance: {
    fontSize: 10,
    color: '#666',
  },
});

export default TalkItem; 