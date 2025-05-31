import { Ionicons } from '@expo/vector-icons';

// 네비게이션 라우트 상수
export const ROUTES = {
  // 인증 관련
  AUTH: {
    LOGIN: 'Login',
    PROFILE_SETUP: 'ProfileSetup'
  },
  
  // 메인 관련
  MAIN: {
    STACK: 'MainStack',
    HOME: 'Home',
    MESSAGES: 'Messages',
    SETTINGS: 'Settings',
    PROFILE_TEST: 'ProfileTest'
  },
  
  // 공통
  SPLASH: 'Splash'
};

// 네비게이션 헤더 설정
export const HEADER_OPTIONS = {
  AUTH: {
    headerShown: false,
    cardStyle: { backgroundColor: '#fff' }
  },
  MAIN: {
    headerShown: false
  }
};

// 탭 네비게이션 설정
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

// 네비게이션 유틸리티 함수
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