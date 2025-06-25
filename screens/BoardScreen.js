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
  ScrollView,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ChatModal } from '../components/chat/ChatModal';
import { ProfileMenuModal } from '../components/ProfileMenuModal';
import { useTalkFeed, useMyTalk } from '../hooks/useTalk';
import { useBlock } from '../hooks/useBlock';
import { useAuth } from '../hooks/useAuth';
import { formatTimeAgo } from '../utils/dateUtils';

const { width } = Dimensions.get('window');

const DISTANCE_TABS = [
  { id: 'all', label: '전체' },
  { id: '50km', label: '동네' },
  { id: '30km', label: '주변' },
  { id: '10km', label: '근처' }
];

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

export default function BoardScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState('all');
  const [showMyTalk, setShowMyTalk] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const [selectedTalk, setSelectedTalk] = useState(null);

  // 토크 피드 hook
  const { 
    talks, 
    loading, 
    refreshing, 
    loadingMore, 
    error, 
    hasMore, 
    refreshFeed, 
    loadMore 
  } = useTalkFeed();

  // 내 토크 hook
  const { myTalk, loading: myTalkLoading, fetchMyTalk } = useMyTalk(user?.uuid);

  // 차단 hook
  const { blockUser, unblockUser, isUserBlocked, loading: blockLoading, getBlockedUsers } = useBlock();

  // 화면이 포커스될 때마다 내 토크 새로고침
  useFocusEffect(
    React.useCallback(() => {
      if (user?.uuid) {
        fetchMyTalk();
        refreshFeed(); // 전체 토크 피드도 새로고침
      }
    }, [user?.uuid, fetchMyTalk, refreshFeed])
  );

  const handleMessage = (talk) => {
    console.log('채팅 버튼이 눌렸습니다!');
    setSelectedUser({ nickname: '익명' }); // 실제로는 사용자 정보 필요
    setChatModalVisible(true);
  };

  const handleChatConfirm = () => {
    setChatModalVisible(false);
    // TODO: 채팅방 생성 및 이동 로직 구현
    console.log('채팅 시작하기 버튼이 눌렸습니다!');
  };

  const handleMore = (talk) => {
    setSelectedTalk(talk);
    setProfileMenuVisible(true);
  };

  const handleBlock = async () => {
    if (selectedTalk) {
      try {
        await blockUser(selectedTalk.uuid);
        setProfileMenuVisible(false);
        setSelectedTalk(null);
        // 차단 후 피드 새로고침
        refreshFeed();
      } catch (error) {
        console.error('차단 실패:', error);
      }
    }
  };

  const handleReport = () => {
    if (selectedTalk) {
      Alert.alert('알림', '신고가 접수되었습니다.');
      setProfileMenuVisible(false);
      setSelectedTalk(null);
    }
  };

  const handleProfileMenuClose = () => {
    setProfileMenuVisible(false);
    setSelectedTalk(null);
  };

  const handleMyTalkPress = () => {
    setShowMyTalk(!showMyTalk);
  };

  const handleRefresh = () => {
    refreshFeed();
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      loadMore();
    }
  };

  const renderItem = ({ item }) => (
    <TalkItem
      talk={item}
      onMessage={handleMessage}
      onMore={handleMore}
    />
  );

  const renderEmptyState = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
        <Text style={styles.emptyText}>
          {showMyTalk ? '내 토크가 없습니다.' : '아직 토크가 없습니다.'}
        </Text>
        <Text style={styles.emptySubText}>
          {showMyTalk ? '첫 번째 토크를 작성해보세요!' : '첫 번째 토크를 작성해보세요!'}
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator color="#FF6B6B" />
        <Text style={styles.loadingText}>더 많은 토크를 불러오는 중...</Text>
      </View>
    );
  };

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
          <View style={styles.tabRow}>
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
            
            <TouchableOpacity
              style={[styles.myTalkButton, showMyTalk && styles.myTalkButtonActive]}
              onPress={handleMyTalkPress}
            >
              <Ionicons 
                name="person-outline" 
                size={16} 
                color={showMyTalk ? '#fff' : '#FF6B6B'} 
              />
              <Text style={[styles.myTalkButtonText, showMyTalk && styles.myTalkButtonTextActive]}>
                내 토크
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 게시물 목록 */}
        <FlatList
          data={showMyTalk ? (myTalk ? [myTalk] : []) : talks}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#FF6B6B']}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
        />

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
      <ProfileMenuModal
        visible={profileMenuVisible}
        onClose={handleProfileMenuClose}
        onBlock={handleBlock}
        onReport={handleReport}
        isBlocked={false}
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
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 16,
  },
  tabScrollContent: {
    paddingHorizontal: 16,
    flex: 1,
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
  myTalkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  myTalkButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  myTalkButtonText: {
    fontSize: 12,
    color: '#FF6B6B',
    marginLeft: 4,
    fontWeight: '600',
  },
  myTalkButtonTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 12,
    flexGrow: 1,
  },
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  loadingFooter: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
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
}); 