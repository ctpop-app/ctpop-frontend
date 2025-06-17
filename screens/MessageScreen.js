// MessageScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getChatRooms, getChatRoomDetails } from '../api/chat';
import useUserStore from '../store/userStore';
import { getCurrentKST } from '../utils/dateUtils';
import ChatRoomSkeleton from '../components/chat/ChatRoomSkeleton';

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
    try {
      console.log('채팅방 로딩 시작...');
      setLoading(true);
      setError(null);

      // 로그인 상태 확인
      if (!user?.uuid) {
        console.log('사용자 정보가 없습니다. 로그인이 필요합니다.');
        // 로그인 상태가 아닌 경우에만 에러 메시지를 표시
        if (!chatRooms.length) {
          setError('로그인이 필요합니다.');
        }
        setLoading(false);
        return;
      }
      
      const rooms = await getChatRooms();
      console.log('받아온 채팅방 데이터:', JSON.stringify(rooms, null, 2));
      
      if (!rooms || rooms.length === 0) {
        console.log('채팅방이 없습니다.');
        setChatRooms([]);
        return;
      }

      const roomsWithDetails = await Promise.all(
        rooms.map(async (room) => {
          try {
            console.log(`채팅방 ${room.id} 상세 정보 로딩 중...`);
            const details = await getChatRoomDetails(room.id);
            console.log(`채팅방 ${room.id} 상세 정보:`, JSON.stringify(details, null, 2));
            return {
              ...room,
              ...details,
            };
          } catch (error) {
            console.error(`채팅방 ${room.id} 상세 정보 로딩 실패:`, error);
            return {
              ...room,
              otherUser: { name: '알 수 없음' },
              lastMessage: { text: '메시지를 불러올 수 없습니다.' },
            };
          }
        })
      );

      console.log('최종 채팅방 목록:', JSON.stringify(roomsWithDetails, null, 2));
      setChatRooms(roomsWithDetails);
    } catch (error) {
      console.error('채팅방 로딩 중 오류 발생:', error);
      
      // 네트워크 오류인 경우
      if (error.message?.includes('network') || error.message?.includes('offline')) {
        if (!chatRooms.length) {
          setError('네트워크 연결을 확인해주세요.');
        }
      }
      // 로그인 오류인 경우
      else if (error.message === '사용자가 로그인되어 있지 않습니다.') {
        if (!chatRooms.length) {
          setError('로그인이 필요합니다. 로그인 후 다시 시도해주세요.');
        }
      }
      // Firebase 인덱스 오류인 경우
      else if (error.message?.includes('index')) {
        setError('Firebase 인덱스가 필요합니다. 개발자에게 문의하세요.');
      }
      // 기타 오류인 경우
      else {
        if (!chatRooms.length) {
          setError('채팅방을 불러오는데 실패했습니다.');
        }
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
          chatRoomId: item.id,
          otherUser: {
            uuid: otherParticipant,
            nickname: item.otherUser?.nickname || '알 수 없는 사용자',
            profileImage: item.otherUser?.profileImage
          }
        })}
      >
        <View style={styles.chatRoomContent}>
          <View style={styles.chatRoomInfo}>
            <Text style={styles.chatRoomName}>
              {item.otherUser?.nickname || '알 수 없는 사용자'}
            </Text>
            <Text style={styles.chatRoomLastMessage} numberOfLines={1}>
              {item.lastMessage?.content || '새로운 대화를 시작해보세요'}
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

  const renderSkeleton = () => {
    return Array(5).fill(0).map((_, index) => (
      <ChatRoomSkeleton key={`skeleton-${index}`} />
    ));
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>메시지</Text>
        </View>
        {renderSkeleton()}
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
          <Text style={styles.emptyText}>오류가 발생했습니다</Text>
          <Text style={styles.emptySubtext}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadChatRooms}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!chatRooms.length) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>메시지</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>아직 대화가 없습니다</Text>
          <Text style={styles.emptySubtext}>새로운 대화를 시작해보세요</Text>
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