// MessageScreen.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getChatRooms, getChatRoomDetails, leaveChatRoom } from '../api/chat';
import { getCurrentKST } from '../utils/dateUtils';
import ChatRoomSkeleton from '../components/chat/ChatRoomSkeleton';
import TabHeader from '../components/common/TabHeader';
import { ChatRoomActionModal } from '../components/chat/ChatRoomActionModal';
import useUserStore from '../store/userStore';
import { useBlock } from '../hooks/useBlock';
import { useUnreadMessages } from '../hooks/useUnreadMessages';
import { useGlobalChat } from '../hooks/useGlobalChat';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';

export default function MessageScreen() {
  const navigation = useNavigation();
  const { user } = useUserStore();
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedChatRoom, setSelectedChatRoom] = useState(null);
  const [longPressedItem, setLongPressedItem] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { blockUser: blockUserHook, unblockUser: unblockUserHook } = useBlock();
  
  // 실시간 메시지 관련 훅들
  const { unreadCounts, getUnreadCount, markChatAsRead } = useUnreadMessages();
  const { setCurrentChatRoomId, clearCurrentChatRoomId } = useGlobalChat();

  // 메모이제이션된 채팅방 렌더링 함수
  const renderChatRoom = useCallback(({ item }) => {
    // participants가 없거나 undefined인 경우 안전하게 처리
    const participants = item.participants || [];
    const otherParticipant = participants.find(p => p !== user.uuid);
    // 실시간 읽지 않은 메시지 수 가져오기
    const realtimeUnreadCount = getUnreadCount(item.id);
    const unreadCount = realtimeUnreadCount > 0 ? realtimeUnreadCount : (item.unreadCount?.[user.uuid] || 0);
    const isLongPressed = longPressedItem === item.id;
    const hasUnreadMessages = unreadCount > 0;
    
    // 상대방 정보가 없으면 렌더링하지 않음
    if (!item.otherUser || !item.otherUser.uuid) {
      console.warn(`채팅방 ${item.id}: 상대방 정보가 없어 렌더링하지 않음`);
      return null;
    }
    
    return (
      <TouchableOpacity 
        style={[
          styles.chatRoomItem,
          hasUnreadMessages && styles.chatRoomItemUnread,
          isLongPressed && styles.chatRoomItemPressed
        ]}
        onPress={() => {
          // 채팅방으로 이동할 때 현재 채팅방 ID 설정
          setCurrentChatRoomId(item.id);
          
          // 읽지 않은 메시지가 있으면 읽음으로 표시 (한 번만)
          if (unreadCount > 0) {
            markChatAsRead(item.id);
          }
          
          navigation.navigate('ChatRoom', { 
            chatRoomId: item.id,
            otherUser: {
              uuid: otherParticipant,
              nickname: item.otherUser?.nickname || '알 수 없는 사용자',
              mainPhotoURL: item.otherUser?.mainPhotoURL
            }
          });
        }}
        onLongPress={() => handleChatRoomLongPress(item)}
        onPressIn={() => handleChatRoomPressIn(item)}
        onPressOut={handleChatRoomPressOut}
        delayLongPress={500}
      >
        <View style={styles.chatRoomContent}>
          <View style={styles.profileImageContainer}>
            {item.otherUser?.mainPhotoURL ? (
              <Image
                source={{ uri: item.otherUser.mainPhotoURL }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.defaultProfileImage} />
            )}
          </View>
          
          <View style={styles.chatRoomInfo}>
            <Text style={[
              styles.chatRoomName,
              hasUnreadMessages && styles.chatRoomNameUnread
            ]}>
              {item.otherUser?.nickname || '알 수 없는 사용자'}
            </Text>
            <Text style={[
              styles.chatRoomLastMessage,
              hasUnreadMessages && styles.chatRoomLastMessageUnread
            ]} numberOfLines={1}>
              {item.lastMessage?.content || '새로운 대화를 시작해보세요'}
            </Text>
          </View>
          <View style={styles.chatRoomMeta}>
            <Text style={[
              styles.chatRoomTime,
              hasUnreadMessages && styles.chatRoomTimeUnread
            ]}>
              {formatDate(item.updatedAt)}
            </Text>
            {unreadCount > 0 && (
              <View style={[
                styles.unreadBadge,
                hasUnreadMessages && styles.unreadBadgeUnread
              ]}>
                <Text style={styles.unreadCount}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [user?.uuid, getUnreadCount, longPressedItem, navigation, setCurrentChatRoomId]);

  // 메모이제이션된 키 추출 함수
  const keyExtractor = useCallback((item) => item.id, []);

  // 채팅방 정렬 함수
  const sortChatRoomsByLatestMessage = useCallback((rooms) => {
    return rooms.sort((a, b) => {
      const aTime = a.updatedAt || a.lastMessage?.timestamp || new Date(0);
      const bTime = b.updatedAt || b.lastMessage?.timestamp || new Date(0);
      
      // Date 객체로 변환
      const aDate = aTime instanceof Date ? aTime : new Date(aTime);
      const bDate = bTime instanceof Date ? bTime : new Date(bTime);
      
      // 최신 메시지가 위로 오도록 내림차순 정렬
      return bDate.getTime() - aDate.getTime();
    });
  }, []);

  // 초기 로딩만 실행
  useEffect(() => {
    if (user?.uuid && isInitialLoad) {
      loadChatRooms();
      setIsInitialLoad(false);
    }
  }, [user?.uuid, isInitialLoad]);

  // 채팅방 목록 변경 감지 (디버깅용)
  useEffect(() => {
    console.log('채팅방 목록 변경됨:', chatRooms.length, '개 채팅방');
    if (chatRooms.length > 0) {
      console.log('채팅방 목록:', chatRooms.map(room => ({
        id: room.id,
        nickname: room.otherUser?.nickname,
        lastMessage: room.lastMessage?.content,
        updatedAt: room.updatedAt
      })));
    }
  }, [chatRooms]);

  // 화면이 포커스될 때는 현재 채팅방 ID만 초기화 (전체 로딩 제거)
  useFocusEffect(
    React.useCallback(() => {
      if (user?.uuid) {
        // 현재 채팅방 ID 초기화 (메시지 화면에서는 채팅방에 있지 않음)
        clearCurrentChatRoomId();
      }
    }, [user?.uuid])
  );

  // 실시간 새 메시지 감지 및 채팅방 목록 업데이트 (최적화된 버전)
  useEffect(() => {
    if (!user?.uuid) return;

    // 최근 1시간 내의 메시지들을 모니터링
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const messagesQuery = query(
      collection(db, 'messages'),
      where('timestamp', '>=', oneHourAgo),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const newMessages = [];
      const updatedChatIds = new Set();
      
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const message = change.doc.data();
          
          // 자신이 보낸 메시지가 아니고, chatId가 있는 경우
          if (message.uuid !== user.uuid && message.chatId) {
            newMessages.push({
              id: change.doc.id,
              ...message,
              timestamp: message.timestamp?.toDate ? message.timestamp.toDate() : new Date(message.timestamp)
            });
            updatedChatIds.add(message.chatId);
          }
        }
      });

      if (newMessages.length > 0) {
        console.log('새 메시지 감지:', newMessages.length, '채팅방:', Array.from(updatedChatIds));
        console.log('새 메시지 상세:', newMessages.map(msg => ({
          id: msg.id,
          chatId: msg.chatId,
          content: msg.content,
          senderId: msg.uuid,
          timestamp: msg.timestamp
        })));
        
        // 즉시 채팅방 목록 업데이트
        setChatRooms(prevRooms => {
          console.log('현재 채팅방 목록:', prevRooms.map(room => room.id));
          const updatedRooms = [...prevRooms];
          let hasUpdates = false;
          
          newMessages.forEach(message => {
            const roomIndex = updatedRooms.findIndex(room => room.id === message.chatId);
            console.log(`채팅방 ${message.chatId} 찾기 결과:`, roomIndex !== -1 ? '기존 채팅방' : '새 채팅방');
            
            if (roomIndex !== -1) {
              // 기존 채팅방 업데이트
              const oldMessage = updatedRooms[roomIndex].lastMessage?.content;
              updatedRooms[roomIndex] = {
                ...updatedRooms[roomIndex],
                lastMessage: {
                  content: message.content || '새 메시지',
                  senderId: message.uuid,
                  timestamp: message.timestamp,
                  type: message.type || 'text'
                },
                updatedAt: message.timestamp
              };
              console.log(`채팅방 ${message.chatId} 업데이트: "${oldMessage}" → "${message.content}"`);
              hasUpdates = true;
            } else {
              // 새로운 채팅방인 경우 - 즉시 기본 정보로 추가
              console.log('새로운 채팅방 감지:', message.chatId);
              const tempRoom = {
                id: message.chatId,
                participants: [user.uuid, message.uuid],
                lastMessage: {
                  content: message.content || '새 메시지',
                  senderId: message.uuid,
                  timestamp: message.timestamp,
                  type: message.type || 'text'
                },
                updatedAt: message.timestamp,
                otherUser: {
                  uuid: message.uuid,
                  nickname: '새로운 대화',
                  mainPhotoURL: null
                }
              };
              updatedRooms.unshift(tempRoom);
              console.log(`새 채팅방 ${message.chatId} 추가됨`);
              hasUpdates = true;
              
              // 백그라운드에서 상세 정보 로드
              loadNewChatRoom(message.chatId);
            }
          });
          
          if (hasUpdates) {
            // 시간순으로 정렬 (최신 메시지가 위로)
            const sortedRooms = sortChatRoomsByLatestMessage(updatedRooms);
            console.log('채팅방 목록 업데이트 완료, 정렬됨');
            
            // 실시간 업데이트 시간 설정 (3초 후 자동으로 숨김)
            setLastUpdateTime(new Date());
            setTimeout(() => {
              setLastUpdateTime(null);
            }, 3000);
            
            return sortedRooms;
          }
          
          return prevRooms;
        });
      }
    }, (error) => {
      console.error('실시간 메시지 모니터링 오류:', error);
    });

    return () => {
      unsubscribe();
    };
  }, [user?.uuid, sortChatRoomsByLatestMessage]); // chatRooms.length 의존성 제거

  // 새로운 채팅방 정보를 로드하는 함수 (백그라운드에서 상세 정보 업데이트)
  const loadNewChatRoom = useCallback(async (chatRoomId) => {
    try {
      console.log(`새 채팅방 ${chatRoomId} 상세 정보 로딩 중...`);
      const details = await getChatRoomDetails(chatRoomId, user.uuid);
      
      if (details && details.otherUser && details.otherUser.uuid) {
        setChatRooms(prevRooms => {
          const roomIndex = prevRooms.findIndex(room => room.id === chatRoomId);
          if (roomIndex === -1) return prevRooms;
          
          // 기존 임시 채팅방을 상세 정보로 업데이트
          const updatedRooms = [...prevRooms];
          updatedRooms[roomIndex] = {
            ...updatedRooms[roomIndex],
            ...details,
            // 기존 메시지 정보는 유지
            lastMessage: updatedRooms[roomIndex].lastMessage,
            updatedAt: updatedRooms[roomIndex].updatedAt
          };
          
          return updatedRooms;
        });
      }
    } catch (error) {
      console.error(`새 채팅방 ${chatRoomId} 상세 정보 로딩 실패:`, error);
    }
  }, [user?.uuid]);

  const loadChatRooms = async (showLoading = true) => {
    try {
      console.log('채팅방 로딩 시작...');
      if (showLoading) {
        setLoading(true);
      }
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
      
      const rooms = await getChatRooms(user.uuid);
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
            const details = await getChatRoomDetails(room.id, user.uuid);
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

      // 최신 메시지 기준으로 정렬
      const sortedRooms = sortChatRoomsByLatestMessage([...roomsWithDetails]);

      // console.log('정렬된 채팅방 목록:', sortedRooms.map(room => ({
      //   id: room.id,
      //   nickname: room.otherUser?.nickname,
      //   updatedAt: room.updatedAt,
      //   lastMessageTime: room.lastMessage?.timestamp
      // })));

      // 잘못된 채팅방 필터링
      const validRooms = sortedRooms.filter(room => {
        if (!room.participants || !Array.isArray(room.participants)) {
          console.warn(`채팅방 ${room.id}: participants가 없거나 배열이 아님`);
          return false;
        }
        
        // 중복 제거 후 참가자 수 확인
        const uniqueParticipants = [...new Set(room.participants)];
        if (uniqueParticipants.length < 2) {
          console.warn(`채팅방 ${room.id}: 유효한 참가자가 2명 미만 (${uniqueParticipants.length}명)`);
          return false;
        }
        
        // 현재 사용자가 포함되어 있는지 확인
        if (!uniqueParticipants.includes(user.uuid)) {
          console.warn(`채팅방 ${room.id}: 현재 사용자가 참가자 목록에 없음`);
          return false;
        }
        
        // 상대방 정보가 없거나 유효하지 않은 경우 필터링
        if (!room.otherUser || !room.otherUser.uuid || room.otherUser.uuid === 'unknown') {
          console.warn(`채팅방 ${room.id}: 상대방 정보가 없거나 유효하지 않음`, room.otherUser);
          return false;
        }
        
        // 상대방이 현재 사용자인 경우 필터링 (자기 자신과의 채팅방)
        if (room.otherUser.uuid === user.uuid) {
          console.warn(`채팅방 ${room.id}: 자기 자신과의 채팅방`);
          return false;
        }
        
        return true;
      });

      console.log('최종 채팅방 목록:', JSON.stringify(validRooms, null, 2));
      setChatRooms(validRooms);
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
      if (showLoading) {
        setLoading(false);
      }
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

  const handleChatRoomLongPress = (chatRoom) => {
    setSelectedChatRoom(chatRoom);
    setActionModalVisible(true);
  };

  const handleChatRoomPressIn = (chatRoom) => {
    setLongPressedItem(chatRoom.id);
  };

  const handleChatRoomPressOut = () => {
    setLongPressedItem(null);
  };

  const handleViewProfile = () => {
    if (!selectedChatRoom?.otherUser?.uuid) {
      console.log('상대방 정보가 없습니다:', selectedChatRoom);
      return;
    }
    
    console.log('프로필 보기 클릭됨:', selectedChatRoom.otherUser);
    
    // 프로필 상세 화면으로 이동
    navigation.navigate('ProfileDetail', {
      profile: {
        uuid: selectedChatRoom.otherUser.uuid,
        nickname: selectedChatRoom.otherUser.nickname || '알 수 없는 사용자',
        mainPhotoURL: selectedChatRoom.otherUser.mainPhotoURL,
        age: selectedChatRoom.otherUser.age,
        orientation: selectedChatRoom.otherUser.orientation,
        height: selectedChatRoom.otherUser.height,
        weight: selectedChatRoom.otherUser.weight,
        city: selectedChatRoom.otherUser.city,
        district: selectedChatRoom.otherUser.district,
        bio: selectedChatRoom.otherUser.bio,
        interests: selectedChatRoom.otherUser.interests,
        photoURLs: selectedChatRoom.otherUser.photoURLs,
        lastActive: selectedChatRoom.otherUser.lastActive
      }
    });
  };

  const handleLeaveChatRoom = async () => {
    if (!selectedChatRoom || !user?.uuid) return;
    
    try {
      const result = await leaveChatRoom(selectedChatRoom.id, user.uuid);
      if (result.success) {
        Alert.alert('알림', '대화방에서 나갔습니다.');
        loadChatRooms(false); // 채팅방 목록 새로고침
      } else {
        Alert.alert('오류', '대화방 나가기에 실패했습니다.');
      }
    } catch (error) {
      console.error('대화방 나가기 오류:', error);
      Alert.alert('오류', '대화방 나가기에 실패했습니다.');
    }
  };

  const handleBlockUser = async () => {
    if (!selectedChatRoom?.otherUser?.uuid) return;
    
    try {
      await blockUserHook(selectedChatRoom.otherUser.uuid);
      Alert.alert('알림', '사용자를 차단했습니다.');
      loadChatRooms(false); // 채팅방 목록 새로고침
    } catch (error) {
      console.error('사용자 차단 오류:', error);
      Alert.alert('오류', '사용자 차단에 실패했습니다.');
    }
  };

  const handleReportUser = () => {
    Alert.alert('알림', '신고가 접수되었습니다.');
  };

  const renderSkeleton = () => {
    return Array(5).fill(0).map((_, index) => (
      <ChatRoomSkeleton key={`skeleton-${index}`} />
    ));
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <TabHeader title="메시지" />
        {renderSkeleton()}
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <TabHeader title="메시지" />
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

  return (
    <View style={styles.container}>
      <TabHeader title="메시지" />
      
      {/* 실시간 업데이트 상태 표시 */}
      {lastUpdateTime && (
        <View style={styles.realtimeIndicator}>
          <Text style={styles.realtimeText}>
            실시간 업데이트 중... {lastUpdateTime.toLocaleTimeString()}
          </Text>
        </View>
      )}
      
      {/* 게시물 목록 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>채팅방을 불러오는 중...</Text>
        </View>
      ) : chatRooms.length > 0 ? (
        <FlatList
          data={chatRooms}
          renderItem={renderChatRoom}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={() => {
            // 수동 새로고침 시에만 전체 로딩 실행
            setIsInitialLoad(true);
            loadChatRooms(false);
          }}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>아직 대화가 없습니다</Text>
          <Text style={styles.emptySubtext}>새로운 대화를 시작해보세요</Text>
        </View>
      )}

      {/* 채팅방 액션 모달 */}
      <ChatRoomActionModal
        visible={actionModalVisible}
        onClose={() => setActionModalVisible(false)}
        onViewProfile={handleViewProfile}
        onLeave={handleLeaveChatRoom}
        onBlock={handleBlockUser}
        onReport={handleReportUser}
        isBlocked={false} // TODO: 차단 상태 확인 로직 추가
        chatRoomName={selectedChatRoom?.otherUser?.nickname || '채팅방'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  listContainer: {
    padding: 8,
  },
  chatRoomItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  chatRoomItemUnread: {
    backgroundColor: '#F8F9FF',
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  chatRoomItemPressed: {
    backgroundColor: '#f0f0f0',
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
  chatRoomNameUnread: {
    fontWeight: '700',
    color: '#2C3E50',
  },
  chatRoomLastMessage: {
    fontSize: 14,
    color: '#666',
  },
  chatRoomLastMessageUnread: {
    color: '#4A90E2',
    fontWeight: '500',
  },
  chatRoomMeta: {
    alignItems: 'flex-end',
  },
  chatRoomTime: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  chatRoomTimeUnread: {
    color: '#4A90E2',
    fontWeight: '600',
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
  unreadBadgeUnread: {
    backgroundColor: '#4A90E2',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
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
  profileImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    marginRight: 12,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  defaultProfileImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E0E0E0',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  realtimeIndicator: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#D0E8D0',
  },
  realtimeText: {
    fontSize: 12,
    color: '#2E7D32',
    textAlign: 'center',
    fontWeight: '500',
  },
}); 