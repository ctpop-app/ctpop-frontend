// MessageScreen.js
import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// 더미 메시지 데이터
const dummyMessages = [
  {
    id: '1',
    sender: '김민준',
    profilePhotoURL: null,
    lastMessage: '안녕하세요! 반갑습니다.',
    timestamp: '10:30 AM',
    unread: true,
  },
  {
    id: '2',
    sender: '이서연',
    profilePhotoURL: null,
    lastMessage: '오늘 저녁에 시간 되세요?',
    timestamp: '어제',
    unread: false,
  },
  {
    id: '3',
    sender: '박지훈',
    profilePhotoURL: null,
    lastMessage: '추천해주신 카페 정말 좋았어요.',
    timestamp: '어제',
    unread: false,
  },
  {
    id: '4',
    sender: '최수진',
    profilePhotoURL: null,
    lastMessage: '행사 정보 공유해 주셔서 감사합니다!',
    timestamp: '월요일',
    unread: false,
  },
];

export default function MessageScreen() {
  const navigation = useNavigation();

  const renderMessageItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.messageItem}
      onPress={() => {
        // 채팅 상세 화면으로 이동 (구현 예정)
        console.log(`${item.sender}와의 대화 열기`);
      }}
    >
      <Image 
        style={styles.avatar}
        source={item.profilePhotoURL ? { uri: item.profilePhotoURL } : require('../assets/default-profile.png')}
      />
      
      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <Text style={styles.senderName}>{item.sender}</Text>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
        </View>
        
        <View style={styles.messagePreview}>
          <Text 
            style={[styles.lastMessage, item.unread && styles.unreadMessage]} 
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          
          {item.unread && <View style={styles.unreadBadge} />}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>메시지</Text>
      </View>
      
      {dummyMessages.length > 0 ? (
        <FlatList
          data={dummyMessages}
          renderItem={renderMessageItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>아직 메시지가 없습니다.</Text>
          <Text style={styles.emptySubtext}>홈 화면에서 새로운 대화를 시작해보세요!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  listContainer: {
    padding: 8,
  },
  messageItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  messageContent: {
    flex: 1,
    justifyContent: 'center',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  senderName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  unreadMessage: {
    fontWeight: '500',
    color: '#333',
  },
  unreadBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6B6B',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
}); 