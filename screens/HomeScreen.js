// HomeScreen.js
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useProfile, useAuth, useSocket, useLocation } from '../hooks';
import { getLastActiveText } from '../utils/dateUtils';
import { getOrientationColor } from '../utils/colors';
import { calculateDistance, formatDistance } from '../utils/discovery';
import useUserStore from '../store/userStore';
import * as Location from 'expo-location';
import { socketService } from '../services/socketService';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { getAll, loading } = useProfile();
  const { user } = useAuth();
  const { isUserOnline } = useSocket();
  const { userProfile, getDistanceToUser, setUserProfile } = useUserStore();
  const { startLocationTracking, stopLocationTracking } = useLocation();
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [isLocationTracking, setIsLocationTracking] = useState(false);
  const locationWatchId = useRef(null);

  // 앱 진입 시 위치 권한 강제 요청
  useEffect(() => {
    const requestLocationPermissionOnAppStart = async () => {
      try {
        // 위치 권한 요청
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status === 'granted') {
          // 위치 권한 허용됨
          setLocationPermissionGranted(true);
          startRealTimeLocationTracking();
        } else {
          // 위치 권한 거부됨 - 앱 사용 불가
          Alert.alert(
            '위치 권한 필요',
            '위치 권한을 허용해야 서비스를 이용할 수 있습니다.',
            [
              {
                text: '다시 시도',
                onPress: () => requestLocationPermissionOnAppStart()
              },
              {
                text: '앱 종료',
                onPress: () => {
                  // 앱 종료 또는 진입 차단
                  Alert.alert('앱 종료', '위치 권한 없이는 서비스를 이용할 수 없습니다.');
                }
              }
            ],
            { cancelable: false }
          );
        }
      } catch (error) {
        console.error('위치 권한 요청 실패:', error);
        Alert.alert('오류', '위치 권한 요청 중 오류가 발생했습니다.');
      }
    };

    // 앱 시작 시 즉시 위치 권한 요청
    requestLocationPermissionOnAppStart();
  }, []);

  // 앱 종료 시 마지막 위치 전송
  const sendLastLocationOnAppExit = useCallback(async () => {
    if (!user?.uuid || !userProfile?.latitude || !userProfile?.longitude) return;
    
    try {
      // 현재 위치를 마지막 위치로 서버에 전송
      const lastLocation = {
        uuid: user.uuid,
        latitude: userProfile.latitude,
        longitude: userProfile.longitude,
        timestamp: Date.now(),
        isLastLocation: true
      };
      
      // 소켓을 통해 마지막 위치 전송
      socketService.updateLastLocation(lastLocation);
      
      // 프로필 서비스에 마지막 위치 업데이트
      // await profileService.updateLastLocation(user.uuid, lastLocation);
      
      console.log('앱 종료 시 마지막 위치 전송됨:', lastLocation);
    } catch (error) {
      console.error('마지막 위치 전송 실패:', error);
    }
  }, [user?.uuid, userProfile]);

  // 실시간 위치 추적 시작
  const startRealTimeLocationTracking = useCallback(async () => {
    if (!user?.uuid) return;

    try {
      setIsLocationTracking(true);
      
      // 현재 위치 가져오기
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 15000,
        maximumAge: 10000
      });

      const { latitude, longitude } = currentLocation.coords;
      
      // 사용자 프로필에 위치 정보 업데이트
      if (userProfile) {
        const updatedProfile = {
          ...userProfile,
          latitude,
          longitude
        };
        setUserProfile(updatedProfile);
        
        // 소켓을 통해 실시간 위치 정보 전송 (접속 중일 때만)
        socketService.updateLocation(latitude, longitude);
      }

      // 실시간 위치 추적 시작 (접속 중일 때만)
      const locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10, // 10미터 이상 이동 시 업데이트
          timeInterval: 30000,  // 30초마다 업데이트
        },
        (location) => {
          const { latitude, longitude } = location.coords;
          
          // 사용자 프로필 업데이트
          if (userProfile) {
            const updatedProfile = {
              ...userProfile,
              latitude,
              longitude
            };
            setUserProfile(updatedProfile);
          }
          
          // 소켓을 통해 실시간 위치 정보 전송 (접속 중일 때만)
          socketService.updateLocation(latitude, longitude);
        }
      );

      locationWatchId.current = locationSubscription;
      
    } catch (error) {
      console.error('실시간 위치 추적 시작 실패:', error);
      setIsLocationTracking(false);
    }
  }, [user?.uuid, userProfile, setUserProfile]);

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

  // 컴포넌트 언마운트 시 위치 추적 정리 및 마지막 위치 전송
  useEffect(() => {
    return () => {
      // 마지막 위치 전송
      sendLastLocationOnAppExit();
      
      // 위치 추적 정리
      if (locationWatchId.current) {
        locationWatchId.current.remove();
        locationWatchId.current = null;
      }
    };
  }, [sendLastLocationOnAppExit]);

  const renderUserCard = ({ item }) => {
    // 내 프로필인지 확인
    const isMyProfile = item.uuid === userProfile?.uuid;
    
    // 내 프로필이 아닌 경우에만 거리 계산
    let finalDistanceText = null;
    if (!isMyProfile) {
      // 실시간 거리 정보 가져오기 (백엔드에서 오는 경우)
      const distanceInfo = getDistanceToUser(item.uuid);
      const distanceText = distanceInfo ? distanceInfo.formattedDistance : null;
      
      // 실제 위도/경도로 거리 계산 (백엔드 거리 정보가 없을 때만)
      let calculatedDistanceText = null;
      if (!distanceText && userProfile?.latitude && userProfile?.longitude && 
          item.latitude && item.longitude) {
        const distance = calculateDistance(
          userProfile.latitude, userProfile.longitude,
          item.latitude, item.longitude
        );
        calculatedDistanceText = formatDistance(distance);
      }
      
      // 최종 거리 텍스트 (백엔드 > 직접 계산)
      finalDistanceText = distanceText || calculatedDistanceText;
    }

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
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text style={styles.userName}>{item.nickname}</Text>
              {!isMyProfile && finalDistanceText && (
                <Text style={styles.distanceText}>  •  {finalDistanceText}</Text>
              )}
              {item.age && <Text style={styles.userAge}>  {item.age}세</Text>}
            </View>
            <View style={styles.statusContainer}>
              {isUserOnline(item.uuid) ? (
                <>
                  <View style={[styles.onlineDot, { backgroundColor: '#4CAF50' }]} />
                  <Text style={[styles.onlineText, { color: '#4CAF50' }]}>접속중</Text>
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
            </Text>
          </View>
          <Text style={styles.userBio} numberOfLines={1} ellipsizeMode="tail">{item.bio || ''}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 간단한 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CTpop</Text>
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
  calculatedText: {
    fontSize: 12,
    color: '#666',
  },
  backendText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },

}); 