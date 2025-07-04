// BoardScreen.js
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  SafeAreaView,
  Platform,
  StatusBar,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ChatModal } from '../components/chat/ChatModal';
import { ProfileMenuModal } from '../components/ProfileMenuModal';
import { useTalkFeed, useMyTalk } from '../hooks/useTalk';
import { useBlock } from '../hooks/useBlock';
import { useAuth } from '../hooks/useAuth';
import DistanceTabs from '../components/board/DistanceTabs';
import TalkList from '../components/board/TalkList';
import WriteButton from '../components/board/WriteButton';
import TabHeader from '../components/common/TabHeader';

export default function BoardScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
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
    hasMore, 
    refreshFeed, 
    loadMore 
  } = useTalkFeed();

  // 내 토크 hook
  const { myTalk, fetchMyTalk } = useMyTalk(user?.uuid);

  // 차단 hook
  const { blockUser } = useBlock();

  // 화면이 포커스될 때마다 내 토크 새로고침
  useFocusEffect(
    React.useCallback(() => {
      if (user?.uuid) {
        fetchMyTalk();
        refreshFeed();
      }
    }, [user?.uuid, fetchMyTalk, refreshFeed])
  );

  // 통합된 이벤트 핸들러
  const handleEvent = {
    // 채팅 관련
    message: (talk) => {
      console.log('=== BoardScreen message 이벤트 시작 ===');
      console.log('선택된 토크 전체 데이터:', JSON.stringify(talk, null, 2));
      
      // 토크 작성자의 프로필 정보 사용
      const authorInfo = talk.authorProfile || {
        nickname: talk.nickname || '익명',
        mainPhotoURL: null,
        uuid: talk.uuid // 작성자의 UUID 추가
      };
      
      // authorProfile이 있지만 uuid가 없는 경우 talk.uuid 사용
      if (authorInfo && !authorInfo.uuid && talk.uuid) {
        authorInfo.uuid = talk.uuid;
      }
      
      console.log('작성자 정보:', authorInfo);
      console.log('작성자 UUID 확인:', authorInfo.uuid);
      
      setSelectedUser(authorInfo);
      setChatModalVisible(true);
      console.log('ChatModal 열림');
    },
    
    chatConfirm: (chatRoomId, otherUser) => {
      console.log('=== BoardScreen chatConfirm 시작 ===');
      console.log('채팅방 생성 완료:', { chatRoomId, otherUser });
      setChatModalVisible(false);
      
      // 채팅방으로 이동
      if (chatRoomId) {
        console.log('ChatRoom으로 이동:', { chatRoomId, otherUser });
        navigation.navigate('ChatRoom', {
          chatRoomId: chatRoomId,
          otherUser: otherUser
        });
      } else {
        console.error('chatRoomId가 없습니다.');
      }
    },
    
    // 프로필 메뉴 관련
    profileMenu: (talk = null) => {
      setSelectedTalk(talk);
      setProfileMenuVisible(!!talk);
    },
    
    // 프로필 상세 보기
    profilePress: (authorProfile) => {
      console.log('프로필 상세 보기:', authorProfile);
      navigation.navigate('ProfileDetail', { profile: authorProfile });
    },
    
    // 사용자 관리
    block: async () => {
      if (selectedTalk) {
        try {
          await blockUser(selectedTalk.uuid);
          handleEvent.profileMenu(); // 모달 닫기
          refreshFeed();
        } catch (error) {
          console.error('차단 실패:', error);
        }
      }
    },
    
    report: () => {
      if (selectedTalk) {
        Alert.alert('알림', '신고가 접수되었습니다.');
        handleEvent.profileMenu(); // 모달 닫기
      }
    },
    
    // UI 상태 관리
    filter: () => console.log('필터 버튼이 눌렸습니다!'),
    myTalkToggle: () => setShowMyTalk(!showMyTalk),
  };

  const listData = showMyTalk 
    ? talks.filter(talk => talk.uuid === user?.uuid)
    : talks;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TabHeader 
          title="토크" 
          rightComponent={
            <TouchableOpacity style={styles.filterButton} onPress={handleEvent.filter}>
              <Text style={styles.filterButtonText}>필터</Text>
            </TouchableOpacity>
          } 
        />
        <DistanceTabs 
          showMyTalk={showMyTalk} 
          onMyTalkToggle={handleEvent.myTalkToggle} 
        />
        <TalkList
          data={listData}
          loading={loading}
          refreshing={refreshing}
          loadingMore={loadingMore}
          hasMore={hasMore}
          showMyTalk={showMyTalk}
          onRefresh={refreshFeed}
          onLoadMore={loadMore}
          onMessage={handleEvent.message}
          onMore={handleEvent.profileMenu}
          onProfilePress={handleEvent.profilePress}
        />
        <WriteButton onPress={() => navigation.navigate('BoardWrite')} />
      </View>
      <ChatModal
        visible={chatModalVisible}
        onClose={() => setChatModalVisible(false)}
        onConfirm={handleEvent.chatConfirm}
        otherUser={selectedUser}
        talkData={selectedTalk}
      />
      <ProfileMenuModal
        visible={profileMenuVisible}
        onClose={() => setProfileMenuVisible(false)}
        onBlock={handleEvent.block}
        onReport={handleEvent.report}
        isBlocked={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
}); 