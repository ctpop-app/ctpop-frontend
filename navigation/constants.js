/**
 * 네비게이션 관련 상수 정의
 * 이 파일은 앱의 전체 화면 구조와 네비게이션 설정을 정의합니다.
 * 새로운 화면을 추가할 때는 이 파일의 ROUTES 객체에 먼저 추가해야 합니다.
 */

import { Ionicons } from '@expo/vector-icons';

// 네비게이션 라우트 상수
export const ROUTES = {
  // 인증 관련
  AUTH: {
    LOGIN: 'Login',
    PROFILE_SETUP: 'ProfileSetup',
    OTP_VERIFICATION: 'OtpVerification'
  },
  
  // 메인 관련
  MAIN: {
    MAIN_TABS: 'MainTabs',  // 메인 탭 네비게이션
    HOME: 'Home',           // 홈 탭
    MESSAGES: 'Messages',
    SETTINGS: 'Settings',
    PROFILE_TEST: 'ProfileTest',
    BOARD: 'Board',
    PROFILE_EDIT: 'ProfileEdit',
    CHAT: 'Chat',
    CHAT_LIST: 'ChatList',
    NOTIFICATIONS: 'Notifications'
  },
  
  // 프로필 관련
  PROFILE: {
    VIEW: 'ProfileView',
    EDIT: 'ProfileEdit',
    PHOTOS: 'ProfilePhotos',
    SETTINGS: 'ProfileSettings'
  },
  
  // 게시판 관련
  BOARD: {
    LIST: 'BoardList',
    DETAIL: 'BoardDetail',
    WRITE: 'BoardWrite',
    EDIT: 'BoardEdit'
  },
  
  // 채팅 관련
  CHAT: {
    LIST: 'ChatList',
    ROOM: 'ChatRoom',
    CREATE: 'ChatCreate'
  },
  
  // 공통
  SPLASH: 'Splash',
  ERROR: 'Error'
};

/**
 * 각 화면의 헤더 설정
 * 화면별로 다른 헤더 스타일을 적용할 수 있습니다.
 */
export const HEADER_OPTIONS = {
  AUTH: {
    headerShown: false,
    cardStyle: { backgroundColor: '#fff' }
  },
  MAIN: {
    headerShown: false
  },
  PROFILE: {
    headerShown: true,
    headerStyle: {
      backgroundColor: '#fff',
      elevation: 0,
      shadowOpacity: 0
    }
  },
  BOARD: {
    headerShown: true,
    headerStyle: {
      backgroundColor: '#fff',
      elevation: 0,
      shadowOpacity: 0
    }
  },
  CHAT: {
    headerShown: true,
    headerStyle: {
      backgroundColor: '#fff',
      elevation: 0,
      shadowOpacity: 0
    }
  }
};

/**
 * 탭 네비게이션 설정
 * 하단 탭 바의 아이콘과 라벨을 정의합니다.
 */
export const TAB_OPTIONS = {
  [ROUTES.MAIN.HOME]: {
    tabBarLabel: '홈',
    tabBarIcon: ({ focused, color, size }) => (
      <Ionicons 
        name={focused ? 'home' : 'home-outline'} 
        size={size} 
        color={color} 
      />
    )
  },
  [ROUTES.MAIN.MESSAGES]: {
    tabBarLabel: '메시지',
    tabBarIcon: ({ focused, color, size }) => (
      <Ionicons 
        name={focused ? 'chatbubble' : 'chatbubble-outline'} 
        size={size} 
        color={color} 
      />
    )
  },
  [ROUTES.MAIN.SETTINGS]: {
    tabBarLabel: '설정',
    tabBarIcon: ({ focused, color, size }) => (
      <Ionicons 
        name={focused ? 'settings' : 'settings-outline'} 
        size={size} 
        color={color} 
      />
    )
  }
};

/**
 * 네비게이션 유틸리티 함수
 * 화면 전환과 관련된 공통 함수들을 제공합니다.
 */
export const navigationUtils = {
  // 화면 이동
  navigate: (navigation, routeName, params = {}) => {
    navigation.navigate(routeName, params);
  },

  // 스택 리셋
  reset: (navigation, routeName) => {
    navigation.reset({
      index: 0,
      routes: [{ name: routeName }]
    });
  },

  // 뒤로 가기
  goBack: (navigation) => {
    navigation.goBack();
  }
}; 