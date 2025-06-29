// HomeScreen.js
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import UserCard from '../components/home/UserCard';
import { useProfileList } from '../hooks/useProfileList';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { profiles, isLoading, refreshing, isBackgroundRefreshing, handleRefresh, isUserOnline } = useProfileList();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CTpop</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterButtonText}>필터</Text>
        </TouchableOpacity>
      </View>
      {isLoading ? (
        <ActivityIndicator size="large" color="#FF6B6B" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={profiles}
          renderItem={({ item }) => (
            <UserCard 
              item={item}
              onPress={() => navigation.navigate('ProfileDetail', { profile: item })}
              isUserOnline={isUserOnline}
            />
          )}
          keyExtractor={item => item.uuid}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListHeaderComponent={
            isBackgroundRefreshing ? (
              <View style={styles.refreshIndicator}>
                <ActivityIndicator size="small" color="#FF6B6B" />
                <Text style={styles.refreshText}>접속 상태 업데이트 중...</Text>
              </View>
            ) : null
          }
        />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  filterButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  listContainer: {
    padding: 6,
  },
  refreshIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 8,
    marginBottom: 8,
  },
  refreshText: {
    marginLeft: 8,
    color: '#FF6B6B',
    fontSize: 12,
  },
}); 