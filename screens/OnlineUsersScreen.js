import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useSocket } from '../hooks/useSocket';
import useUserStore from '../store/userStore';

export default function OnlineUsersScreen() {
  const { onlineUsers, connect } = useSocket();
  const [refreshing, setRefreshing] = useState(false);
  const { userProfile } = useUserStore();

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    connect();
    setRefreshing(false);
  }, [connect]);

  const renderItem = ({ item }) => {
    // 현재 사용자의 경우 userStore에서 프로필 정보를 가져옴
    const isCurrentUser = item === userProfile?.uuid;
    const displayName = isCurrentUser ? userProfile?.nickname : item;

    return (
      <View style={styles.userItem}>
        <Text style={styles.userText}>
          {displayName || '알 수 없음'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>현재 접속자: {onlineUsers.size}명</Text>
      <FlatList
        data={Array.from(onlineUsers)}
        renderItem={renderItem}
        keyExtractor={item => item}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>접속 중인 사용자가 없습니다.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  userItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userText: {
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
}); 