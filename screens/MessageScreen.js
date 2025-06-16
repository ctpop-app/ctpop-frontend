// MessageScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getChatRooms } from '../api/chat';
import useUserStore from '../store/userStore';
import { getCurrentKST } from '../utils/dateUtils';

export default function MessageScreen() {
  const navigation = useNavigation();
  const { user } = useUserStore();
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadChatRooms();
  }, [user?.uuid]);

  const loadChatRooms = async () => {
    if (!user?.uuid) {
      console.log('사용자 UUID가 없습니다:', user);
      setError('사용자 정보를 불러올 수 없습니다.');
      return;
    }

    try {
      setLoading(true);
      console.log('채팅방 목록 로딩 시작:', user.uuid);
      const result = await getChatRooms(user.uuid);
      console.log('채팅방 목록 로딩 결과:', result);
      
      if (result?.success) {
        setChatRooms(result.data);
      } else {
        console.error('채팅방 목록 로딩 실패:', result);
        setError('Firebase 인덱스가 필요합니다. 관리자에게 문의해주세요.');
      }
    } catch (err) {
      console.error('채팅방 목록 로딩 오류:', err);
      if (err.message?.includes('index')) {
        setError('Firebase 인덱스가 필요합니다. 관리자에게 문의해주세요.');
      } else {
        setError('채팅방 목록을 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    // 24시간 이내
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    }
    
    // 7일 이내
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = ['일', '월', '화', '수', '목', '금', '토'];
      return days[date.getDay()];
    }
    
    // 그 외
    return date.toLocaleDateString('ko-KR', {
      month: '2-digit',
      day: '2-digit'
    });
  };

  const renderChatRoom = ({ item }) => {
    const otherParticipant = item.participants.find(p => p !== user.uuid);
    const unreadCount = item.unreadCount?.[user.uuid] || 0;
    
    return (
      <TouchableOpacity 
        style={styles.chatRoomItem}
        onPress={() => navigation.navigate('ChatRoom', { 
          roomId: item.id,
          otherParticipant
        })}
      >
        <View style={styles.chatRoomContent}>
          <View style={styles.chatRoomInfo}>
            <Text style={styles.chatRoomName}>
              {otherParticipant || '알 수 없는 사용자'}
            </Text>
            <Text style={styles.chatRoomLastMessage} numberOfLines={1}>
              {item.lastMessage || '새로운 대화를 시작해보세요'}
            </Text>
          </View>
          <View style={styles.chatRoomMeta}>
            <Text style={styles.chatRoomTime}>
              {formatDate(item.updatedAt)}
            </Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>메시지</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>메시지</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadChatRooms}
          >
            <Text style={styles.retryButtonText}>새로고침</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>메시지</Text>
      </View>
      
      {chatRooms.length > 0 ? (
        <FlatList
          data={chatRooms}
          renderItem={renderChatRoom}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={loadChatRooms}
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
  chatRoomItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  chatRoomContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatRoomInfo: {
    flex: 1,
    marginRight: 12,
  },
  chatRoomName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  chatRoomLastMessage: {
    fontSize: 14,
    color: '#666',
  },
  chatRoomMeta: {
    alignItems: 'flex-end',
  },
  chatRoomTime: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  unreadBadge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 