import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 알림 처리 방식 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
    this.currentChatRoomId = null;
  }

  /**
   * 알림 서비스 초기화
   */
  async initialize() {
    try {
      console.log('🚀 알림 서비스 초기화 시작...');
      
      // 먼저 알림 리스너 설정 (권한과 무관하게 작동)
      this.setupNotificationListeners();
      console.log('✅ 알림 리스너 설정 완료');

      // 권한 요청 및 토큰 생성
      const token = await this.registerForPushNotificationsAsync();
      if (token) {
        this.expoPushToken = token;
        await this.saveNotificationToken(token);
        console.log('✅ Push token 저장 완료');
      } else {
        console.warn('⚠️ Push token 생성 실패 - 로컬 알림만 사용');
      }

      console.log('🎉 알림 서비스 초기화 완료');
      return token;
    } catch (error) {
      console.error('❌ 알림 서비스 초기화 중 오류:', error);
      
      // 에러가 발생해도 로컬 알림은 작동하도록 설정
      try {
        this.setupNotificationListeners();
        console.log('✅ 기본 알림 리스너만 설정 완료');
      } catch (listenerError) {
        console.error('❌ 알림 리스너 설정도 실패:', listenerError);
      }
      
      return null;
    }
  }

  /**
   * 푸시 알림 권한 요청 및 토큰 생성
   */
  async registerForPushNotificationsAsync() {
    let token;

    try {
      // Android 알림 채널 설정
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'CTpop 알림',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: true,
          enableVibrate: true,
        });
        console.log('Android 알림 채널 설정 완료');
      }

      // 실제 기기인지 확인
      if (!Device.isDevice) {
        console.warn('Push notifications은 실제 기기에서만 작동합니다');
        return null;
      }

      // 알림 권한 확인 및 요청
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      console.log('현재 알림 권한 상태:', existingStatus);
      
      if (existingStatus !== 'granted') {
        console.log('알림 권한 요청 중...');
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowAnnouncements: true,
          },
        });
        finalStatus = status;
        console.log('알림 권한 요청 결과:', status);
      }
      
      if (finalStatus !== 'granted') {
        console.log('알림 권한이 거부되었습니다.');
        return null;
      }
      
      // Push token 생성
      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        if (!projectId) {
          console.error('EAS Project ID를 찾을 수 없습니다');
          console.log('Available config:', {
            expoConfig: Constants.expoConfig?.extra,
            easConfig: Constants.easConfig
          });
          return null;
        }
        
        console.log('Push token 생성 중... Project ID:', projectId);
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId,
        });
        
        token = tokenData.data;
        console.log('✅ Push token 생성 성공:', token);
      } catch (e) {
        console.error('❌ Push token 생성 실패:', e);
        
        // 더 자세한 에러 정보 로깅
        if (e.message.includes('EXPO_TOKEN')) {
          console.error('Expo 토큰 관련 오류 - 개발 환경에서는 정상입니다');
        }
        
        return null;
      }
    } catch (error) {
      console.error('알림 권한 설정 중 오류:', error);
      return null;
    }

    return token;
  }

  /**
   * 알림 리스너 설정
   */
  setupNotificationListeners() {
    // 앱이 foreground에 있을 때 알림을 받은 경우
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 알림 수신:', notification);
      this.handleNotificationReceived(notification);
    });

    // 사용자가 알림을 탭한 경우
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 알림 탭:', response);
      this.handleNotificationResponse(response);
    });
  }

  /**
   * 알림 수신 처리
   */
  handleNotificationReceived(notification) {
    try {
      const data = notification?.request?.content?.data || {};
      
      console.log('🔔 알림 수신 처리:', {
        data,
        currentChatRoom: this.currentChatRoomId
      });
      
      // 현재 채팅방과 같은 방의 메시지면 알림 표시하지 않음
      if (data.chatRoomId && data.chatRoomId === this.currentChatRoomId) {
        console.log('같은 채팅방 메시지 - 알림 표시 안함');
        return;
      }

      // 필요한 경우 추가 처리 로직
      const title = notification?.request?.content?.title || '새 메시지';
      console.log('새 메시지 알림 표시:', title);
    } catch (error) {
      console.error('알림 수신 처리 오류:', error);
    }
  }

  /**
   * 알림 탭 응답 처리
   */
  handleNotificationResponse(response) {
    try {
      const data = response?.notification?.request?.content?.data || {};
      
      console.log('👆 알림 탭 처리:', {
        data,
        hasNavigationHandler: !!this.navigateToChatRoom
      });
      
      // 채팅방으로 네비게이션하는 로직은 App.js에서 처리
      if (data.chatRoomId && data.otherUser && this.navigateToChatRoom) {
        console.log('채팅방으로 네비게이션 실행:', data.chatRoomId);
        this.navigateToChatRoom(data.chatRoomId, data.otherUser);
      } else {
        console.warn('알림 데이터 부족 또는 네비게이션 핸들러 없음:', {
          hasChatRoomId: !!data.chatRoomId,
          hasOtherUser: !!data.otherUser,
          hasHandler: !!this.navigateToChatRoom
        });
      }
    } catch (error) {
      console.error('알림 탭 응답 처리 오류:', error);
    }
  }

  /**
   * 현재 채팅방 ID 설정
   */
  setCurrentChatRoomId(chatRoomId) {
    this.currentChatRoomId = chatRoomId;
    // console.log('현재 채팅방 ID 설정:', chatRoomId);
  }

  /**
   * 현재 채팅방 ID 제거
   */
  clearCurrentChatRoomId() {
    this.currentChatRoomId = null;
    // console.log('현재 채팅방 ID 제거');
  }

  /**
   * 로컬 알림 표시 (테스트용)
   */
  async showLocalNotification(title, body, data = {}) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null,
    });
  }

  /**
   * 새 메시지 알림 표시
   */
  async showNewMessageNotification(message, chatRoomId, otherUser) {
    // 현재 채팅방과 같으면 알림 표시하지 않음
    if (chatRoomId === this.currentChatRoomId) {
      console.log('같은 채팅방 메시지 - 알림 표시 안함');
      return;
    }

    const title = `💬 ${otherUser.nickname || '새 메시지'}`;
    let body = '';
    
    if (message.type === 'text') {
      // 메시지가 너무 길면 줄임
      body = message.content.length > 50 
        ? message.content.substring(0, 50) + '...' 
        : message.content;
    } else if (message.type === 'image') {
      body = '📷 이미지를 보냈습니다';
    } else {
      body = '새로운 메시지가 도착했습니다';
    }

    await this.showLocalNotification(title, body, {
      chatRoomId,
      otherUser,
      messageId: message.id,
      type: 'new_message',
      timestamp: new Date().toISOString()
    });

    console.log('✅ 알림 표시 완료:', { title, body, chatRoomId });
  }

  /**
   * 알림 토큰 저장
   */
  async saveNotificationToken(token) {
    try {
      await AsyncStorage.setItem('expoPushToken', token);
      console.log('알림 토큰 저장 완료');
    } catch (error) {
      console.error('알림 토큰 저장 실패:', error);
    }
  }

  /**
   * 저장된 알림 토큰 가져오기
   */
  async getNotificationToken() {
    try {
      const token = await AsyncStorage.getItem('expoPushToken');
      return token;
    } catch (error) {
      console.error('알림 토큰 가져오기 실패:', error);
      return null;
    }
  }

  /**
   * 채팅방으로 네비게이션 (외부에서 설정)
   */
  setNavigationHandler(handler) {
    this.navigateToChatRoom = handler;
  }

  /**
   * 리스너 정리
   */
  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  /**
   * 푸시 토큰 가져오기
   */
  getExpoPushToken() {
    return this.expoPushToken;
  }
}

// 싱글톤 인스턴스 생성
const notificationService = new NotificationService();

export default notificationService;