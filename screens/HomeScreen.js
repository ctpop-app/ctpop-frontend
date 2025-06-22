// HomeScreen.js
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useProfile, useAuth, useSocket, useLocation } from '../hooks';
import { getLastActiveText } from '../utils/dateUtils';
import { getOrientationColor } from '../utils/colors';
import useUserStore from '../store/userStore';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { getAll, loading } = useProfile();
  const { user } = useAuth();
  const { isUserOnline } = useSocket();
  const { userProfile, getDistanceToUser, debugNearbyDistances } = useUserStore();
  const { startLocationTracking, stopLocationTracking } = useLocation();
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false);
  const locationWatchId = useRef(null);

  // 위치 추적 시작
  useEffect(() => {
    const initLocationTracking = async () => {
      try {
        const locationSubscription = await startLocationTracking();
        if (locationSubscription) {
          locationWatchId.current = locationSubscription;
        }
      } catch (error) {
        console.error('위치 추적 초기화 실패:', error);
      }
    };

    if (user?.uuid) {
      initLocationTracking();
    }

    return () => {
      if (locationWatchId.current) {
        stopLocationTracking(locationWatchId.current);
      }
    };
  }, [user?.uuid, startLocationTracking, stopLocationTracking]);

  const loadProfiles = useCallback(async (isBackground = false) => {
    if (isBackground) {
      setIsBackgroundRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const newData = await getAll();
      const dataWithUserProfile = userProfile ? [userProfile, ...newData] : newData;
      
      const sortProfiles = (a, b) => {
        // 0. 사용자 자신의 프로필을 최상위로
        if (a.uuid === user?.uuid) return -1;
        if (b.uuid === user?.uuid) return 1;

        // 1. 접속 중인 사용자를 그 다음으로
        const aIsOnline = isUserOnline(a.uuid);
        const bIsOnline = isUserOnline(b.uuid);
        if (aIsOnline && !bIsOnline) return -1;
        if (!aIsOnline && bIsOnline) return 1;
        
        // 2. 둘 다 접속 중이거나 둘 다 접속 중이 아닌 경우 lastActive로 정렬
        if (!a.lastActive) return 1;
        if (!b.lastActive) return -1;

        // lastActive를 Date 객체로 변환
        const dateA = a.lastActive.toDate ? a.lastActive.toDate() : new Date(a.lastActive);
        const dateB = b.lastActive.toDate ? b.lastActive.toDate() : new Date(b.lastActive);
        return dateB - dateA;
      };
      
      if (isBackground) {
        setProfiles(prevProfiles => {
          const mergedProfiles = dataWithUserProfile.map(newProfile => {
            const existingProfile = prevProfiles.find(p => p.uuid === newProfile.uuid);
            if (existingProfile) {
              return {
                ...existingProfile,
                ...newProfile
              };
            }
            return newProfile;
          });
          return mergedProfiles.sort(sortProfiles);
        });
      } else {
        const sortedData = dataWithUserProfile.sort(sortProfiles);
        setProfiles(sortedData);
      }
    } catch (error) {
      console.error('프로필 로드 실패:', error);
    } finally {
      if (isBackground) {
        setIsBackgroundRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [getAll, userProfile, isUserOnline, user]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  // 디버깅용: 주기적으로 거리 정보 상태 확인
  useEffect(() => {
    const debugInterval = setInterval(() => {
      console.log('=== Distance Debug Info ===');
      debugNearbyDistances();
      console.log('==========================');
    }, 10000); // 10초마다 확인

    return () => clearInterval(debugInterval);
  }, [debugNearbyDistances]);

  const renderUserCard = ({ item }) => {
    // 실시간 거리 정보 가져오기
    const distanceInfo = getDistanceToUser(item.uuid);
    const distanceText = distanceInfo ? distanceInfo.formattedDistance : null;
    
    // 백엔드에서 거리 정보가 오지 않을 때 임시 거리 정보 사용
    const tempDistanceText = distanceText || (isUserOnline(item.uuid) ? '1.2km' : null);
    
    // 디버깅용 로그
    console.log(`User ${item.nickname} (${item.uuid}):`, {
      isOnline: isUserOnline(item.uuid),
      distanceInfo,
      distanceText,
      tempDistanceText
    });

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => {
          navigation.navigate('ProfileDetail', { profile: item });
        }}
        activeOpacity={0.8}
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
                  <View style={[styles.onlineDot, { backgroundColor: '#4CAF50' }]} />
                  <Text style={[styles.onlineText, { color: '#4CAF50' }]}>접속중</Text>
                  {tempDistanceText && (
                    <Text style={styles.distanceText}> • {tempDistanceText}</Text>
                  )}
                </>
              ) : (
                <Text style={styles.lastActiveText}>{getLastActiveText(item.lastActive)}</Text>
              )}
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={[styles.orientationBadge, { backgroundColor: getOrientationColor(item.orientation) }]}>
              <Text style={styles.orientationText}>{item.orientation || '미입력'}</Text>
            </View>
            <Text style={styles.userInfo}>
              {item.height && `${item.height}cm`}
              {item.weight && ` ${item.weight}kg`}
              {(item.height || item.weight) && (item.city || item.district) ? ' · ' : ''}
              {item.city && `${item.city} ${item.district || ''}`}
            </Text>
          </View>
          {/* 거리 정보 표시 */}
          {tempDistanceText && (
            <View style={styles.distanceRow}>
              <Text style={styles.distanceLabel}>📍 거리: {tempDistanceText}</Text>
            </View>
          )}
          <Text style={styles.userBio} numberOfLines={1} ellipsizeMode="tail">{item.bio || ''}</Text>
        </View>
      </TouchableOpacity>
    );
  };

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
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadProfiles().finally(() => setRefreshing(false));
          }}
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
  card: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 2,
    elevation: 1,
  },
  profilePhoto: {
    width: 50,
    height: 50,
    borderRadius: 24,
    marginRight: 10,
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  orientationBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  orientationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  userInfo: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  distanceText: {
    fontSize: 12,
    color: '#666',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    backgroundColor: '#f0f0f0',
    padding: 4,
    borderRadius: 4,
  },
  distanceLabel: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
}); 