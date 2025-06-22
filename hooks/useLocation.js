import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import { socketService } from '../services/socketService';

export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isTracking, setIsTracking] = useState(false);

  // 위치 권한 확인 및 요청
  const requestLocationPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        setPermissionGranted(true);
        return true;
      } else {
        Alert.alert(
          '위치 권한 필요',
          '실시간 거리 계산을 위해 위치 권한이 필요합니다.',
          [{ text: '확인' }]
        );
        return false;
      }
    } catch (error) {
      console.error('위치 권한 요청 실패:', error);
      return false;
    }
  }, []);

  // 현재 위치 가져오기
  const getCurrentLocation = useCallback(async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 15000,
        maximumAge: 10000
      });
      
      const { latitude, longitude } = location.coords;
      setLocation({ latitude, longitude });
      return { latitude, longitude };
    } catch (error) {
      console.error('위치 가져오기 실패:', error);
      throw error;
    }
  }, []);

  // 위치 추적 시작
  const startLocationTracking = useCallback(async () => {
    if (!permissionGranted) {
      const granted = await requestLocationPermission();
      if (!granted) return null;
    }

    setIsTracking(true);
    
    // 초기 위치 가져오기
    try {
      const currentLocation = await getCurrentLocation();
      socketService.updateLocation(currentLocation.latitude, currentLocation.longitude);
    } catch (error) {
      console.error('초기 위치 가져오기 실패:', error);
    }

    // 위치 변경 감지
    const locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 10, // 10미터 이상 이동 시 업데이트
        timeInterval: 30000,  // 30초마다 업데이트
      },
      (location) => {
        const { latitude, longitude } = location.coords;
        setLocation({ latitude, longitude });
        socketService.updateLocation(latitude, longitude);
      }
    );

    return locationSubscription;
  }, [permissionGranted, requestLocationPermission, getCurrentLocation]);

  // 위치 추적 중지
  const stopLocationTracking = useCallback((locationSubscription) => {
    if (locationSubscription) {
      locationSubscription.remove();
    }
    setIsTracking(false);
  }, []);

  // 컴포넌트 마운트 시 권한 확인
  useEffect(() => {
    requestLocationPermission();
  }, [requestLocationPermission]);

  return {
    location,
    permissionGranted,
    isTracking,
    requestLocationPermission,
    getCurrentLocation,
    startLocationTracking,
    stopLocationTracking
  };
}; 