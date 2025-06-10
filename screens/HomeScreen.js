// HomeScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useProfile } from '../hooks/useProfile';
import { socketService } from '../services/socketService';
import { useAuth } from '../hooks/useAuth';
import { getLastActiveText } from '../utils/dateUtils';

const isOnline = (lastActive) => {
  if (!lastActive) return false;
  const now = new Date();
  const lastActiveDate = new Date(lastActive);
  return (now - lastActiveDate) < 60000; // 1분 이내 접속
};

export default function HomeScreen() {
  const navigation = useNavigation();
  const { getAll, loading } = useProfile();
  const { user } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    if (user?.uuid) {
      socketService.connect(user.uuid);
      // 현재 사용자의 온라인 상태 추가
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.add(user.uuid);
        return newSet;
      });
    }
    return () => {
      socketService.disconnect();
    };
  }, [user]);

  useEffect(() => {
    setIsLoading(true);
    getAll()
      .then(data => {
        setProfiles(data);
        // 각 프로필에 대한 온라인 상태 구독
        data.forEach(profile => {
          socketService.subscribeToUserStatus(profile.uuid, (isOnline) => {
            setOnlineUsers(prev => {
              const newSet = new Set(prev);
              if (isOnline) {
                newSet.add(profile.uuid);
              } else {
                newSet.delete(profile.uuid);
              }
              return newSet;
            });
          });
        });
      })
      .finally(() => setIsLoading(false));

    return () => {
      // 구독 해제
      profiles.forEach(profile => {
        socketService.unsubscribeFromUserStatus(profile.uuid);
      });
    };
  }, [getAll]);

  const isUserOnline = (uuid) => {
    return onlineUsers.has(uuid);
  };

  const renderUserCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => {
        // 프로필 상세 페이지로 이동 (구현 예정)
        console.log(`사용자 ${item.uuid} 프로필 보기`);
      }}
    >
      <Image 
        style={styles.profilePhoto}
        source={item.mainPhotoURL ? { uri: item.mainPhotoURL } : require('../assets/default-profile.png')}
      />
      <View style={styles.userInfo}>
        <View style={styles.nameAgeContainer}>
          <Text style={styles.userName}>{item.nickname}</Text>
          {item.age && <Text style={styles.userAge}>{item.age}세</Text>}
          <View style={styles.statusContainer}>
            {isUserOnline(item.uuid) ? (
              <>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>접속중</Text>
              </>
            ) : (
              <Text style={styles.lastActiveText}>{getLastActiveText(item.lastActive)}</Text>
            )}
          </View>
        </View>
        <Text style={styles.userLocation}>
          {item.height && `${item.height}cm`}
          {item.weight && ` ${item.weight}kg`}
          {(item.height || item.weight) && (item.city || item.district) ? ' / ' : ''}
          {item.city && `${item.city} ${item.district || ''}`}
        </Text>
        <Text style={styles.userBio} numberOfLines={2}>{item.bio || ''}</Text>
      </View>
    </TouchableOpacity>
  );

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
          renderItem={renderUserCard}
          keyExtractor={item => item.uuid}
          contentContainerStyle={styles.listContainer}
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
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profilePhoto: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameAgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 6,
  },
  userAge: {
    fontSize: 15,
    color: '#666',
  },
  userLocation: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  userBio: {
    fontSize: 13,
    color: '#444',
    lineHeight: 18,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 4,
  },
  onlineText: {
    fontSize: 13,
    color: '#4CAF50',
  },
  lastActiveText: {
    fontSize: 13,
    color: '#999',
  },
}); 