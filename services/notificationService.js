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
      // 알림 권한 요청
      const token = await this.registerForPushNotificationsAsync();
      if (token) {
        this.expoPushToken = token;
        await this.saveNotificationToken(token);
      }

      // 알림 리스너 설정
      this.setupNotificationListeners();

      console.log('알림 서비스 초기화 완료:', token);
      return token;
    } catch (error) {
      console.error('알림 서비스 초기화 실패:', error);
      return null;
    }
  }

  /**
   * 푸시 알림 권한 요청 및 토큰 생성
   */
  async registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('알림 권한이 거부되었습니다.');
        return null;
      }
      
      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        if (!projectId) {
          throw new Error('Project ID not found');
        }
        
        token = (await Notifications.getExpoPushTokenAsync({
          projectId,
        })).data;
        
        console.log('Push token:', token);
      } catch (e) {
        console.error('Push token 생성 실패:', e);
        return null;
      }
    } else {
      console.log('Must use physical device for Push Notifications');
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
    const { data, request } = notification;
    
    // 현재 채팅방과 같은 방의 메시지면 알림 표시하지 않음
    if (data.chatRoomId && data.chatRoomId === this.currentChatRoomId) {
      console.log('같은 채팅방 메시지 - 알림 표시 안함');
      return;
    }

    // 필요한 경우 추가 처리 로직
    console.log('새 메시지 알림 표시:', request.content.title);
  }

  /**
   * 알림 탭 응답 처리
   */
  handleNotificationResponse(response) {
    const { data } = response.notification.request.content;
    
    // 채팅방으로 네비게이션하는 로직은 App.js에서 처리
    if (data.chatRoomId && data.otherUser) {
      // 전역 이벤트 발생 또는 네비게이션 처리
      this.navigateToChatRoom(data.chatRoomId, data.otherUser);
    }
  }

  /**
   * 현재 채팅방 ID 설정
   */
  setCurrentChatRoomId(chatRoomId) {
    this.currentChatRoomId = chatRoomId;
    console.log('현재 채팅방 ID 설정:', chatRoomId);
  }

  /**
   * 현재 채팅방 ID 제거
   */
  clearCurrentChatRoomId() {
    this.currentChatRoomId = null;
    console.log('현재 채팅방 ID 제거');
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

    const title = otherUser.nickname || '새 메시지';
    const body = message.type === 'text' ? message.content : '이미지를 보냈습니다';

    await this.showLocalNotification(title, body, {
      chatRoomId,
      otherUser,
      messageId: message.id,
      type: 'new_message'
    });
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