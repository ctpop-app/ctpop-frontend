// BoardScreen.js
import React, { useState } from 'react';
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

const { width } = Dimensions.get('window');

const DISTANCE_TABS = [
  { id: 'all', label: '전체' },
  { id: '50km', label: '동네' },
  { id: '30km', label: '주변' },
  { id: '10km', label: '근처' }
];

// 더미 데이터
const DUMMY_POSTS = [
  {
    id: 1,
    content: '오늘 날씨가 너무 좋네요! 산책하기 딱 좋은 날씨예요.',
    images: ['https://picsum.photos/400/300?random=1'],
    distance: 2.5,
    author: {
      nickname: '서울맛집탐험가',
      profileImage: 'https://picsum.photos/100/100?random=1'
    },
    timestamp: '5분 전'
  },
  {
    id: 2,
    content: '강남역 근처 맛집 추천해주세요!',
    images: ['https://picsum.photos/400/300?random=2'],
    distance: 5.8,
    author: {
      nickname: '맛있는하루',
      profileImage: 'https://picsum.photos/100/100?random=2'
    },
    timestamp: '15분 전'
  },
  {
    id: 3,
    content: '오늘도 좋은 하루 보내세요~',
    images: ['https://picsum.photos/400/300?random=3'],
    distance: 1.2,
    author: {
      nickname: '행복한하루',
      profileImage: 'https://picsum.photos/100/100?random=3'
    },
    timestamp: '30분 전'
  },
  {
    id: 4,
    content: '주말에 뭐하실 계획이신가요?',
    images: ['https://picsum.photos/400/300?random=4'],
    distance: 3.7,
    author: {
      nickname: '주말여행러',
      profileImage: 'https://picsum.photos/100/100?random=4'
    },
    timestamp: '1시간 전'
  }
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
              <Image source={{ uri: post.author?.profileImage }} style={styles.profileImage} />
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
  const [selectedTab, setSelectedTab] = useState('all');
  const [posts] = useState(DUMMY_POSTS);

  const handleMessage = (post) => {
    Alert.alert('알림', `${post.author.nickname}님에게 메시지를 보내시겠습니까?`);
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
        <FlatList
          data={posts}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
        />

        {/* 글쓰기 버튼 */}
        <TouchableOpacity
          style={styles.writeButton}
          onPress={() => navigation.navigate('BoardWrite')}
        >
          <Ionicons name="create-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
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
}); 