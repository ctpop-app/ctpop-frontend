// BoardScreen.js
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ChatModal } from '../components/chat/ChatModal';
import { ProfileMenuModal } from '../components/ProfileMenuModal';
import { useTalkFeed, useMyTalk } from '../hooks/useTalk';
import { useBlock } from '../hooks/useBlock';
import { useAuth } from '../hooks/useAuth';
import BoardHeader from '../components/board/BoardHeader';
import DistanceTabs from '../components/board/DistanceTabs';
import TalkList from '../components/board/TalkList';
import WriteButton from '../components/board/WriteButton';

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
      setSelectedUser({ nickname: '익명' });
      setChatModalVisible(true);
    },
    
    chatConfirm: () => {
      setChatModalVisible(false);
      // TODO: 채팅방 생성 및 이동 로직 구현
    },
    
    // 프로필 메뉴 관련
    profileMenu: (talk = null) => {
      setSelectedTalk(talk);
      setProfileMenuVisible(!!talk);
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

  const listData = showMyTalk ? (myTalk ? [myTalk] : []) : talks;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <BoardHeader onFilterPress={handleEvent.filter} />
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
        />
        <WriteButton onPress={() => navigation.navigate('BoardWrite')} />
      </View>
      <ChatModal
        visible={chatModalVisible}
        onClose={() => setChatModalVisible(false)}
        onConfirm={handleEvent.chatConfirm}
        otherUser={selectedUser}
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
}); 