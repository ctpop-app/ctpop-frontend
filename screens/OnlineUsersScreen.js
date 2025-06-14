import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { socketApi } from '../api/socket';

export default function OnlineUsersScreen() {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // onlineUsersList 이벤트 리스너 등록
    socketApi.on('onlineUsersList', (users) => {
      console.log('Received online users list:', users);
      setOnlineUsers(Array.from(users));
    });

    // 컴포넌트 마운트 시 목록 요청
    socketApi.emit('getOnlineUsers');

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      socketApi.off('onlineUsersList');
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    socketApi.emit('getOnlineUsers');
    setRefreshing(false);
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.userItem}>
      <Text style={styles.userText}>{item}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>현재 접속자: {onlineUsers.length}명</Text>
      <FlatList
        data={onlineUsers}
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