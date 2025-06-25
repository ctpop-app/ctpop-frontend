// BoardScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  SafeAreaView,
  Platform,
  StatusBar,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ChatModal } from '../components/chat/ChatModal';
import { createChatRoom } from '../api/chat';
import { profileApi } from '../api/profile';
import useUserStore from '../store/userStore';

const { width } = Dimensions.get('window');

const DISTANCE_TABS = [
  { id: 'all', label: '전체' },
  { id: '50km', label: '동네' },
  { id: '30km', label: '주변' },
  { id: '10km', label: '근처' }
];

const TalkItem = ({ post, onMessage, onMore }) => {
  return (
    <View style={styles.talkItem}>
      <View style={styles.talkContent}>
        <Image source={{ uri: post.images[0] }} style={styles.talkImage} />
        <View style={styles.talkTextContainer}>
          <View style={styles.talkRow}>
            <Text style={styles.talkText}>
              {post.content}
            </Text>
            <View style={styles.profileSection}>
              <Image source={{ uri: post.author?.mainPhotoURL }} style={styles.profileImage} />
              <TouchableOpacity onPress={() => onMessage(post)} style={styles.messageButton}>
                <Ionicons name="chatbubble-outline" size={28} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.talkInfo}>
            <Text style={styles.authorName}>{post.author?.nickname || '익명'}</Text>
            <Text style={styles.distance}>• {post.distance}km</Text>
            <Text style={styles.timestamp}>• {post.timestamp}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => onMore(post)} style={styles.actionButton}>
          <Ionicons name="ellipsis-vertical" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function BoardScreen() {
  const navigation = useNavigation();
  const { user } = useUserStore();
  const [selectedTab, setSelectedTab] = useState('all');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // 프로필 데이터 로드
  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      console.log('프로필 데이터 로딩 시작...');
      
      const profiles = await profileApi.getAll();
      console.log('받아온 프로필 데이터:', profiles);
      
      // 현재 사용자의 프로필은 제외하고 포스트 형태로 변환
      const postsData = profiles
        .filter(profile => profile.uuid !== user?.uuid) // 현재 사용자 제외
        .map((profile, index) => ({
          id: profile.uuid || `profile-${index}`,
          content: profile.bio || '안녕하세요! 새로운 친구를 만나고 싶어요.',
          images: profile.mainPhotoURL ? [profile.mainPhotoURL] : [],
          distance: Math.random() * 10 + 1, // 임시 거리 데이터
          author: {
            uuid: profile.uuid,
            nickname: profile.nickname || '익명',
            mainPhotoURL: profile.mainPhotoURL
          },
          timestamp: '방금 전' // 임시 시간 데이터
        }));
      
      setPosts(postsData);
    } catch (error) {
      console.error('프로필 데이터 로딩 실패:', error);
      Alert.alert('오류', '프로필 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = (post) => {
    setSelectedUser(post.author);
    setChatModalVisible(true);
  };

  const handleChatConfirm = async () => {
    try {
      const currentUserUuid = user?.uuid;
      console.log('현재 사용자 UUID:', currentUserUuid);
      console.log('선택된 사용자:', selectedUser);
      
      // 필수 데이터 확인
      if (!currentUserUuid || !selectedUser?.uuid) {
        Alert.alert('오류', '사용자 정보가 올바르지 않습니다.');
        return;
      }

      // 선택된 사용자의 완전한 프로필 정보 가져오기
      const otherUserProfile = await profileApi.get(selectedUser.uuid);
      const completeUserInfo = otherUserProfile ? {
        uuid: otherUserProfile.id,
        nickname: otherUserProfile.data().nickname || selectedUser.nickname,
        mainPhotoURL: otherUserProfile.data().mainPhotoURL || selectedUser.mainPhotoURL
      } : selectedUser;

      console.log('완전한 사용자 정보:', completeUserInfo);

      const chatRoomData = {
        participants: [currentUserUuid, completeUserInfo.uuid],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastMessage: null,
        lastMessageTimestamp: null
      };

      console.log('채팅방 생성 요청 데이터:', chatRoomData);

      const result = await createChatRoom(chatRoomData);

      console.log('채팅방 생성 결과:', result);

      if (result?.success) {
        setChatModalVisible(false);
        // 채팅방으로 이동 (완전한 사용자 정보 전달)
        navigation.navigate('ChatRoom', { 
          chatRoomId: result.data.id,
          otherUser: completeUserInfo 
        });
      } else {
        Alert.alert('오류', '채팅방 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('채팅방 생성 오류:', error);
      Alert.alert('오류', '채팅방 생성 중 문제가 발생했습니다.');
    }
  };

  const handleMore = (post) => {
    Alert.alert(
      '토크 옵션',
      '선택해주세요',
      [
        { text: '차단하기', onPress: () => Alert.alert('알림', '차단되었습니다.') },
        { text: '신고하기', onPress: () => Alert.alert('알림', '신고가 접수되었습니다.') },
        { text: '취소', style: 'cancel' }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <TalkItem
      post={item}
      onMessage={handleMessage}
      onMore={handleMore}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>토크</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterButtonText}>필터</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.tabContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScrollContent}
          >
            {DISTANCE_TABS.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tabButton,
                  selectedTab === tab.id && styles.selectedTab
                ]}
                onPress={() => setSelectedTab(tab.id)}
              >
                <Text
                  style={[
                    styles.tabText,
                    selectedTab === tab.id && styles.selectedTabText
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 게시물 목록 */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>프로필을 불러오는 중...</Text>
          </View>
        ) : posts.length > 0 ? (
          <FlatList
            data={posts}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            refreshing={loading}
            onRefresh={loadProfiles}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>표시할 프로필이 없습니다</Text>
            <Text style={styles.emptySubtext}>새로운 친구를 기다려보세요</Text>
          </View>
        )}

        {/* 글쓰기 버튼 */}
        <TouchableOpacity
          style={styles.writeButton}
          onPress={() => navigation.navigate('BoardWrite')}
        >
          <Ionicons name="create-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <ChatModal
        visible={chatModalVisible}
        onClose={() => setChatModalVisible(false)}
        onConfirm={handleChatConfirm}
        otherUser={selectedUser}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  tabContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabScrollContent: {
    paddingHorizontal: 16,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
  },
  selectedTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF6B6B',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  selectedTabText: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  listContainer: {
    padding: 12,
  },
  talkItem: {
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 8,
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
    marginBottom: 8,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginRight: 8,
  },
  distance: {
    fontSize: 12,
    color: '#999',
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
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  messageButton: {
    padding: 10,
    backgroundColor: '#F0F8FF',
    borderRadius: 20,
  },
  actionButton: {
    padding: 4,
  },
  writeButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
}); 